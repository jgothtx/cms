import { Router, Request, Response } from 'express';
import multer from 'multer';
import * as repo from './repositories';
import { authenticate, requireWriter, requireAdmin } from './auth';
import { getExtractionSpec, getConfiguredProviders, extractContractData, saveUploadedFile, computeChecksum } from './ocr';
import { getDb } from './database';
import fs from 'fs';

const router = Router();
const upload = multer({ dest: 'uploads/tmp/', limits: { fileSize: 10 * 1024 * 1024 } });

function qs(val: any): string | undefined {
  if (typeof val === 'string') return val;
  if (Array.isArray(val)) return val[0] as string;
  return undefined;
}

// Health
router.get('/health', (_req, res) => res.json({ status: 'ok' }));

// Auth - dev token generator
router.post('/auth/token', (req: Request, res: Response) => {
  if (process.env.NODE_ENV === 'production') { res.status(404).json({ error: 'Not found' }); return; }
  const { generateToken } = require('./auth');
  const { sub, name, email, role } = req.body;
  const token = generateToken({ sub: sub || 'dev-user', name: name || 'Dev User', email: email || 'dev@example.com', role: role || 'Admin' });
  res.json({ token });
});

// All API routes require auth
router.use(authenticate);

// ---- Users ----
router.get('/users', requireAdmin, (_req: Request, res: Response) => {
  res.json(repo.listUsers());
});

// ---- Vendors ----
router.get('/vendors', (req: Request, res: Response) => {
  const result = repo.listVendors({
    search: qs(req.query.search),
    status: qs(req.query.status),
    category: qs(req.query.category),
    risk_tier: qs(req.query.risk_tier),
    sort: qs(req.query.sort),
    order: qs(req.query.order),
    page: Number(req.query.page) || 1,
    limit: Number(req.query.limit) || 50,
  });
  res.json(result);
});

router.get('/vendors/:id', (req: Request, res: Response) => {
  const vendor = repo.getVendor(req.params.id);
  if (!vendor) { res.status(404).json({ error: 'Vendor not found' }); return; }
  res.json(vendor);
});

router.post('/vendors', requireWriter, (req: Request, res: Response) => {
  const { legal_name } = req.body;
  if (!legal_name?.trim()) {
    res.status(400).json({ error: 'Vendor legal name is required', field: 'legal_name' }); return;
  }
  try {
    const vendor = repo.createVendor(req.body, req.user!.id);
    res.status(201).json(vendor);
  } catch (err: any) {
    if (err.message?.includes('UNIQUE constraint')) {
      res.status(409).json({ error: 'Vendor with this legal name already exists', field: 'legal_name' }); return;
    }
    throw err;
  }
});

router.patch('/vendors/:id', requireWriter, (req: Request, res: Response) => {
  if (req.body.legal_name !== undefined && !req.body.legal_name?.trim()) {
    res.status(400).json({ error: 'Vendor legal name cannot be empty', field: 'legal_name' }); return;
  }
  try {
    const vendor = repo.updateVendor(req.params.id, req.body, req.user!.id);
    if (!vendor) { res.status(404).json({ error: 'Vendor not found' }); return; }
    res.json(vendor);
  } catch (err: any) {
    if (err.message?.includes('UNIQUE constraint')) {
      res.status(409).json({ error: 'Vendor with this legal name already exists', field: 'legal_name' }); return;
    }
    throw err;
  }
});

router.delete('/vendors/:id', requireAdmin, (req: Request, res: Response) => {
  const vendor = repo.deleteVendor(req.params.id, req.user!.id);
  if (!vendor) { res.status(404).json({ error: 'Vendor not found' }); return; }
  res.json(vendor);
});

router.post('/vendors/:id/deactivate', requireWriter, (req: Request, res: Response) => {
  const vendor = repo.deactivateVendor(req.params.id, req.user!.id);
  if (!vendor) { res.status(404).json({ error: 'Vendor not found' }); return; }
  res.json(vendor);
});

// ---- Contracts ----
router.get('/contracts', (req: Request, res: Response) => {
  const result = repo.listContracts({
    search: qs(req.query.search),
    status: qs(req.query.status),
    vendor_id: qs(req.query.vendor_id),
    owner: qs(req.query.owner),
    risk_tier: qs(req.query.risk_tier),
    expiry_window: req.query.expiry_window ? Number(req.query.expiry_window) : undefined,
    archived: qs(req.query.archived),
    sort: qs(req.query.sort),
    order: qs(req.query.order),
    page: Number(req.query.page) || 1,
    limit: Number(req.query.limit) || 50,
  });
  res.json(result);
});

router.get('/contracts/export.csv', (req: Request, res: Response) => {
  const result = repo.listContracts({ ...req.query as any, limit: 5000 });
  const cols = ['id', 'title', 'vendor_id', 'contract_owner', 'status', 'start_date', 'end_date', 'contract_value', 'currency', 'risk_tier', 'auto_renew'];
  const header = cols.join(',');
  const rows = result.data.map(c => cols.map(col => {
    const val = (c as any)[col];
    if (val === null || val === undefined) return '';
    const s = String(val);
    return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s;
  }).join(','));
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="contracts.csv"');
  res.send([header, ...rows].join('\r\n'));
});

router.get('/contracts/upload/spec', requireWriter, (_req: Request, res: Response) => {
  res.json({ spec: getExtractionSpec(), providers: getConfiguredProviders() });
});

router.get('/contracts/:id', (req: Request, res: Response) => {
  const contract = repo.getContract(req.params.id);
  if (!contract) { res.status(404).json({ error: 'Contract not found' }); return; }
  res.json(contract);
});

function validateContract(data: any, isUpdate = false): string[] {
  const errors: string[] = [];
  if (!isUpdate) {
    if (!data.title?.trim()) errors.push('title is required');
    if (!data.vendor_id) errors.push('vendor_id is required');
    if (!data.contract_owner?.trim()) errors.push('contract_owner is required');
    if (!data.start_date) errors.push('start_date is required');
    if (!data.end_date) errors.push('end_date is required');
  }
  if (data.start_date && data.end_date && data.end_date <= data.start_date) {
    errors.push('end_date must be after start_date');
  }
  if (data.contract_value !== undefined && data.contract_value !== null && data.contract_value < 0) {
    errors.push('contract_value cannot be negative');
  }
  const validStatuses = ['Draft', 'Under Review', 'Active', 'Expiring Soon', 'Expired', 'Terminated', 'Archived'];
  if (data.status && !validStatuses.includes(data.status)) {
    errors.push('Invalid status');
  }
  if (data.vendor_id) {
    const vendor = repo.getVendor(data.vendor_id);
    if (!vendor) errors.push('vendor_id references non-existent vendor');
  }
  if (data.parent_contract_id) {
    const parent = repo.getContract(data.parent_contract_id);
    if (!parent) errors.push('parent_contract_id references non-existent contract');
  }
  return errors;
}

router.post('/contracts', requireWriter, (req: Request, res: Response) => {
  const errors = validateContract(req.body);
  if (errors.length) { res.status(400).json({ error: 'Validation failed', details: errors }); return; }
  const contract = repo.createContract(req.body, req.user!.id);
  res.status(201).json(contract);
});

router.patch('/contracts/:id', requireWriter, (req: Request, res: Response) => {
  const existing = repo.getContract(req.params.id);
  if (!existing) { res.status(404).json({ error: 'Contract not found' }); return; }
  if (existing.archived && req.user!.role !== 'Admin') {
    res.status(403).json({ error: 'Archived contracts cannot be edited except by Admin' }); return;
  }
  if (req.body.parent_contract_id === req.params.id) {
    res.status(400).json({ error: 'Contract cannot reference itself as parent', details: ['Self-referencing parent_contract_id'] }); return;
  }
  const errors = validateContract(req.body, true);
  if (errors.length) { res.status(400).json({ error: 'Validation failed', details: errors }); return; }
  const contract = repo.updateContract(req.params.id, req.body, req.user!.id);
  res.json(contract);
});

router.delete('/contracts/:id', requireWriter, (req: Request, res: Response) => {
  const contract = repo.deleteContract(req.params.id, req.user!.id);
  if (!contract) { res.status(404).json({ error: 'Contract not found' }); return; }
  res.json(contract);
});

router.post('/contracts/:id/archive', requireWriter, (req: Request, res: Response) => {
  const contract = repo.archiveContract(req.params.id, req.user!.id);
  if (!contract) { res.status(404).json({ error: 'Contract not found' }); return; }
  res.json(contract);
});

router.post('/contracts/:id/restore', requireAdmin, (req: Request, res: Response) => {
  const contract = repo.restoreContract(req.params.id, req.user!.id);
  if (!contract) { res.status(404).json({ error: 'Contract not found' }); return; }
  res.json(contract);
});

// ---- Reminders ----
router.get('/contracts/:id/reminders', (req: Request, res: Response) => {
  const contract = repo.getContract(req.params.id);
  if (!contract) { res.status(404).json({ error: 'Contract not found' }); return; }
  res.json(repo.listReminders(req.params.id));
});

router.post('/contracts/:id/reminders', requireWriter, (req: Request, res: Response) => {
  const contract = repo.getContract(req.params.id);
  if (!contract) { res.status(404).json({ error: 'Contract not found' }); return; }
  if (!req.body.reminder_date) { res.status(400).json({ error: 'reminder_date is required' }); return; }
  if (!req.body.reminder_type) { res.status(400).json({ error: 'reminder_type is required' }); return; }
  const reminder = repo.createReminder({ ...req.body, contract_id: req.params.id, owner_user_id: req.body.owner_user_id || req.user!.id }, req.user!.id);
  res.status(201).json(reminder);
});

router.get('/reminders', (req: Request, res: Response) => {
  res.json(repo.getAllReminders({ completed: qs(req.query.completed) }));
});

router.patch('/reminders/:id', requireWriter, (req: Request, res: Response) => {
  const reminder = repo.updateReminder(req.params.id, req.body, req.user!.id);
  if (!reminder) { res.status(404).json({ error: 'Reminder not found' }); return; }
  res.json(reminder);
});

// ---- Dashboard ----
router.get('/dashboard/summary', (_req: Request, res: Response) => {
  res.json(repo.getDashboardSummary());
});

// ---- Activity Events ----
router.get('/activity', (req: Request, res: Response) => {
  const result = repo.listActivityEvents({
    entity_type: qs(req.query.entity_type),
    entity_id: qs(req.query.entity_id),
    actor_user_id: qs(req.query.actor_user_id),
    action: qs(req.query.action),
    page: Number(req.query.page) || 1,
    limit: Number(req.query.limit) || 50,
  });
  res.json(result);
});

// ---- Documents ----
router.get('/contracts/:id/documents', (req: Request, res: Response) => {
  res.json(repo.listDocuments(req.params.id));
});

// ---- OCR Upload ----
router.post('/contracts/upload', requireWriter, upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) { res.status(400).json({ error: 'No file uploaded' }); return; }

    const allowedTypes = ['image/png', 'image/jpeg', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(req.file.mimetype)) {
      fs.unlinkSync(req.file.path);
      res.status(400).json({ error: 'Unsupported file type. Allowed: PNG, JPEG, WebP, PDF' }); return;
    }

    const provider = req.body.provider || 'auto';
    const { data: extracted, provider: usedProvider } = await extractContractData(req.file.path, req.file.mimetype, provider);

    // Validate extracted contract data
    const contractData = extracted.contract || {};
    const vendorData = extracted.vendor || {};
    const parentRef = extracted.parent_contract_reference;

    const validationErrors: string[] = [];
    if (!contractData.title?.trim()) validationErrors.push('title is required');
    if (!contractData.contract_owner?.trim()) validationErrors.push('contract_owner is required');
    if (!contractData.start_date) validationErrors.push('start_date is required');
    if (!contractData.end_date) validationErrors.push('end_date is required');
    if (!vendorData.legal_name?.trim()) validationErrors.push('vendor legal_name is required');

    if (validationErrors.length) {
      fs.unlinkSync(req.file.path);
      res.status(422).json({ error: 'Extraction produced invalid data', details: validationErrors, extracted }); return;
    }

    // Resolve or create vendor
    let vendor = getDb().prepare('SELECT * FROM vendors WHERE LOWER(TRIM(legal_name)) = LOWER(TRIM(?))').get(vendorData.legal_name) as any;
    if (!vendor) {
      vendor = repo.createVendor({ ...vendorData, status: 'Active' }, req.user!.id);
    }

    // Resolve parent contract
    let parentContractId = null;
    const relationResults: any = {};
    if (parentRef) {
      const byId = repo.getContract(parentRef);
      if (byId) { parentContractId = byId.id; relationResults.parent = { resolved: true, by: 'id' }; }
      else {
        const byRef = getDb().prepare('SELECT * FROM contracts WHERE external_reference_id = ?').get(parentRef) as any;
        if (byRef) { parentContractId = byRef.id; relationResults.parent = { resolved: true, by: 'external_reference_id' }; }
        else {
          const byTitle = getDb().prepare('SELECT * FROM contracts WHERE title = ?').get(parentRef) as any;
          if (byTitle) { parentContractId = byTitle.id; relationResults.parent = { resolved: true, by: 'title' }; }
          else { relationResults.parent = { resolved: false, reference: parentRef }; }
        }
      }
    }

    // Create contract
    const contract = repo.createContract({
      ...contractData,
      vendor_id: vendor.id,
      parent_contract_id: parentContractId,
    }, req.user!.id);

    // Save file and create document metadata
    const storagePath = saveUploadedFile(req.file, contract.id);
    const checksum = computeChecksum(storagePath);
    const doc = repo.createDocumentMetadata({
      contract_id: contract.id,
      file_name: req.file.originalname,
      file_type: req.file.mimetype,
      storage_pointer: storagePath,
      uploaded_by: req.user!.id,
      checksum,
      file_size: req.file.size,
      source_system: 'ocr-upload',
    });

    res.status(201).json({ contract, vendor, document: doc, extracted, provider: usedProvider, relationResults });
  } catch (err: any) {
    if (req.file?.path) try { fs.unlinkSync(req.file.path); } catch {}
    res.status(500).json({ error: err.message });
  }
});

export default router;
