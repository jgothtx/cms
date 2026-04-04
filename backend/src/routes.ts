import { Router, Response } from 'express';
import { randomUUID } from 'crypto';
import { AuthRequest, requireWriter, requireAdmin, requireRole } from './auth';
import { database } from './database';
import { 
  VendorRepository, ContractRepository, ReminderRepository, 
  ActivityEventRepository, UserRepository 
} from './repositories';
import { validateContract, validateVendor, validateReminder } from './validators';
import { Contract, Vendor, Reminder } from './models';

const router = Router();

const vendorRepo = new VendorRepository();
const contractRepo = new ContractRepository();
const reminderRepo = new ReminderRepository();
const activityRepo = new ActivityEventRepository();
const userRepo = new UserRepository();

// ===== VENDOR ENDPOINTS =====

// GET /api/vendors - List all vendors
router.get('/vendors', async (req: AuthRequest, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 100, 1000);
    const offset = parseInt(req.query.offset as string) || 0;
    const vendors = await vendorRepo.findAll(limit, offset);
    res.json({ data: vendors, count: vendors.length });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch vendors' });
  }
});

// POST /api/vendors - Create vendor
router.post('/vendors', requireWriter, async (req: AuthRequest, res: Response) => {
  try {
    const validation = validateVendor(req.body);
    if (!validation.isValid()) {
      res.status(400).json(validation.toResponse());
      return;
    }

    const duplicate = await vendorRepo.findByLegalNameNormalized(req.body.legal_name);
    if (duplicate) {
      res.status(409).json({
        error: {
          field: 'legal_name',
          message: 'A vendor with this legal name already exists'
        }
      });
      return;
    }

    const now = new Date().toISOString();
    const vendor: Vendor = {
      id: randomUUID(),
      legal_name: req.body.legal_name,
      dba_name: req.body.dba_name,
      category: req.body.category,
      status: req.body.status || 'Active',
      risk_tier: req.body.risk_tier,
      tax_id: req.body.tax_id,
      website: req.body.website,
      primary_contact_name: req.body.primary_contact_name,
      primary_contact_email: req.body.primary_contact_email,
      primary_contact_phone: req.body.primary_contact_phone,
      billing_contact_name: req.body.billing_contact_name,
      billing_contact_email: req.body.billing_contact_email,
      billing_address: req.body.billing_address,
      country: req.body.country,
      performance_rating: req.body.performance_rating,
      notes: req.body.notes,
      created_at: now,
      updated_at: now
    };

    const created = await vendorRepo.create(vendor);
    await activityRepo.logActivity(req.user!.id, 'Vendor', vendor.id, 'Create', `Created vendor: ${vendor.legal_name}`);
    res.status(201).json(created);
  } catch (err) {
    if ((err as Error).message.includes('UNIQUE constraint failed')) {
      res.status(409).json({
        error: {
          field: 'legal_name',
          message: 'A vendor with this legal name already exists'
        }
      });
      return;
    }
    res.status(500).json({ error: 'Failed to create vendor' });
  }
});

// GET /api/vendors/:id
router.get('/vendors/:id', async (req: AuthRequest, res: Response) => {
  try {
    const vendor = await vendorRepo.findById(req.params.id as string);
    if (!vendor) {
      res.status(404).json({ error: 'Vendor not found' });
      return;
    }
    res.json(vendor);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch vendor' });
  }
});

// PATCH /api/vendors/:id
router.patch('/vendors/:id', requireWriter, async (req: AuthRequest, res: Response) => {
  try {
    const vendor = await vendorRepo.findById(req.params.id as string);
    if (!vendor) {
      res.status(404).json({ error: 'Vendor not found' });
      return;
    }

    const updated: Vendor = {
      ...vendor,
      ...req.body,
      id: vendor.id,
      created_at: vendor.created_at,
      updated_at: new Date().toISOString()
    };

    const validation = validateVendor(updated);
    if (!validation.isValid()) {
      res.status(400).json(validation.toResponse());
      return;
    }

    const duplicate = await vendorRepo.findByLegalNameNormalized(updated.legal_name);
    if (duplicate && duplicate.id !== vendor.id) {
      res.status(409).json({
        error: {
          field: 'legal_name',
          message: 'A vendor with this legal name already exists'
        }
      });
      return;
    }

    await vendorRepo.update(updated);
    await activityRepo.logActivity(req.user!.id, 'Vendor', vendor.id, 'Update', `Updated vendor: ${vendor.legal_name}`);
    res.json(updated);
  } catch (err) {
    if ((err as Error).message.includes('UNIQUE constraint failed')) {
      res.status(409).json({
        error: {
          field: 'legal_name',
          message: 'A vendor with this legal name already exists'
        }
      });
      return;
    }
    res.status(500).json({ error: 'Failed to update vendor' });
  }
});

// DELETE /api/vendors/:id
router.delete('/vendors/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const vendor = await vendorRepo.findById(req.params.id as string);
    if (!vendor) {
      res.status(404).json({ error: 'Vendor not found' });
      return;
    }

    const updated: Vendor = {
      ...vendor,
      status: 'Inactive',
      updated_at: new Date().toISOString()
    };

    await vendorRepo.update(updated);
    await activityRepo.logActivity(req.user!.id, 'Vendor', vendor.id, 'Update', `Soft-deleted vendor (set inactive): ${vendor.legal_name}`);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete vendor' });
  }
});

// POST /api/vendors/:id/deactivate
router.post('/vendors/:id/deactivate', requireWriter, async (req: AuthRequest, res: Response) => {
  try {
    const vendor = await vendorRepo.findById(req.params.id as string);
    if (!vendor) {
      res.status(404).json({ error: 'Vendor not found' });
      return;
    }

    if (vendor.status === 'Inactive') {
      res.status(200).json(vendor);
      return;
    }

    const updated: Vendor = {
      ...vendor,
      status: 'Inactive',
      updated_at: new Date().toISOString()
    };

    await vendorRepo.update(updated);
    await activityRepo.logActivity(req.user!.id, 'Vendor', vendor.id, 'Update', `Deactivated vendor: ${vendor.legal_name}`);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to deactivate vendor' });
  }
});

// ===== CONTRACT ENDPOINTS =====

// GET /api/contracts - List contracts with filters
router.get('/contracts', async (req: AuthRequest, res: Response) => {
  try {
    let contracts: Contract[] = [];
    
    const limit = Math.min(parseInt(req.query.limit as string) || 100, 1000);
    const offset = parseInt(req.query.offset as string) || 0;
    const search = req.query.search as string;
    const status = req.query.status as string;
    const vendorId = req.query.vendor_id as string;

    if (search) {
      contracts = await contractRepo.searchByTitle(search);
    } else {
      contracts = await contractRepo.findAll(limit, offset);
    }

    // Apply filters
    if (status) {
      contracts = contracts.filter(c => c.status === status);
    }
    if (vendorId) {
      contracts = contracts.filter(c => c.vendor_id === vendorId);
    }

    contracts = contracts.filter(c => !c.archived);

    res.json({ data: contracts, count: contracts.length });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch contracts' });
  }
});

// POST /api/contracts - Create contract
router.post('/contracts', requireWriter, async (req: AuthRequest, res: Response) => {
  try {
    const validation = validateContract(req.body);
    if (!validation.isValid()) {
      res.status(400).json(validation.toResponse());
      return;
    }

    // Verify vendor exists
    const vendor = await vendorRepo.findById(req.body.vendor_id);
    if (!vendor) {
      res.status(400).json({ error: { field: 'vendor_id', message: 'Vendor not found' } });
      return;
    }

    const now = new Date().toISOString();
    const contract: Contract = {
      id: randomUUID(),
      title: req.body.title,
      vendor_id: req.body.vendor_id,
      contract_owner: req.body.contract_owner,
      start_date: req.body.start_date,
      end_date: req.body.end_date,
      status: req.body.status || 'Draft',
      external_reference_id: req.body.external_reference_id,
      contract_type: req.body.contract_type,
      description: req.body.description,
      effective_date: req.body.effective_date,
      signature_date: req.body.signature_date,
      initial_term_months: req.body.initial_term_months,
      auto_renew: req.body.auto_renew || false,
      renewal_term_months: req.body.renewal_term_months,
      notice_period_days: req.body.notice_period_days,
      contract_value: req.body.contract_value,
      currency: req.body.currency,
      risk_tier: req.body.risk_tier,
      notes: req.body.notes,
      archived: false,
      created_at: now,
      created_by: req.user!.id,
      updated_at: now,
      updated_by: req.user!.id
    };

    const created = await contractRepo.create(contract);
    await activityRepo.logActivity(req.user!.id, 'Contract', contract.id, 'Create', `Created contract: ${contract.title}`);
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create contract' });
  }
});

// GET /api/contracts/:id
router.get('/contracts/:id', async (req: AuthRequest, res: Response) => {
  try {
    const contract = await contractRepo.findById(req.params.id as string);
    if (!contract) {
      res.status(404).json({ error: 'Contract not found' });
      return;
    }
    res.json(contract);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch contract' });
  }
});

// PATCH /api/contracts/:id
router.patch('/contracts/:id', requireWriter, async (req: AuthRequest, res: Response) => {
  try {
    const contract = await contractRepo.findById(req.params.id as string);
    if (!contract) {
      res.status(404).json({ error: 'Contract not found' });
      return;
    }

    if (contract.archived && req.user?.role !== 'Admin') {
      res.status(403).json({ error: 'Cannot edit archived contracts' });
      return;
    }

    const updated: Contract = {
      ...contract,
      ...req.body,
      id: contract.id,
      created_at: contract.created_at,
      created_by: contract.created_by,
      updated_at: new Date().toISOString(),
      updated_by: req.user!.id
    };

    const validation = validateContract(updated);
    if (!validation.isValid()) {
      res.status(400).json(validation.toResponse());
      return;
    }

    await contractRepo.update(updated);
    await activityRepo.logActivity(req.user!.id, 'Contract', contract.id, 'Update', `Updated contract: ${contract.title}`);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update contract' });
  }
});

// DELETE /api/contracts/:id (soft-delete via archive)
router.delete('/contracts/:id', requireWriter, async (req: AuthRequest, res: Response) => {
  try {
    const contract = await contractRepo.findById(req.params.id as string);
    if (!contract) {
      res.status(404).json({ error: 'Contract not found' });
      return;
    }

    const now = new Date().toISOString();
    const archived: Contract = {
      ...contract,
      archived: true,
      status: 'Archived',
      archived_at: now,
      archived_by: req.user!.id,
      updated_at: now,
      updated_by: req.user!.id
    };

    await contractRepo.update(archived);
    await activityRepo.logActivity(req.user!.id, 'Contract', contract.id, 'Archive', `Deleted (archived) contract: ${contract.title}`);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete contract' });
  }
});

// POST /api/contracts/:id/archive - Archive contract
router.post('/contracts/:id/archive', requireWriter, async (req: AuthRequest, res: Response) => {
  try {
    const contract = await contractRepo.findById(req.params.id as string);
    if (!contract) {
      res.status(404).json({ error: 'Contract not found' });
      return;
    }

    const now = new Date().toISOString();
    const archived = {
      ...contract,
      archived: true,
      archived_at: now,
      archived_by: req.user!.id,
      updated_at: now,
      updated_by: req.user!.id
    };

    await contractRepo.update(archived);
    await activityRepo.logActivity(req.user!.id, 'Contract', contract.id, 'Archive', `Archived contract: ${contract.title}`);
    res.json(archived);
  } catch (err) {
    res.status(500).json({ error: 'Failed to archive contract' });
  }
});

// POST /api/contracts/:id/restore - Restore archived contract (Admin only)
router.post('/contracts/:id/restore', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const contract = await contractRepo.findById(req.params.id as string);
    if (!contract) {
      res.status(404).json({ error: 'Contract not found' });
      return;
    }

    if (!contract.archived) {
      res.status(400).json({ error: 'Contract is not archived' });
      return;
    }

    const now = new Date().toISOString();
    const restored = {
      ...contract,
      archived: false,
      archived_at: undefined,
      archived_by: undefined,
      updated_at: now,
      updated_by: req.user!.id
    };

    await contractRepo.update(restored);
    await activityRepo.logActivity(req.user!.id, 'Contract', contract.id, 'Restore', `Restored contract: ${contract.title}`);
    res.json(restored);
  } catch (err) {
    res.status(500).json({ error: 'Failed to restore contract' });
  }
});

// ===== REMINDER ENDPOINTS =====

// GET /api/contracts/:contractId/reminders
router.get('/contracts/:contractId/reminders', async (req: AuthRequest, res: Response) => {
  try {
    const reminders = await reminderRepo.findByContract(req.params.contractId as string);
    res.json({ data: reminders });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch reminders' });
  }
});

// POST /api/contracts/:contractId/reminders
router.post('/contracts/:contractId/reminders', requireWriter, async (req: AuthRequest, res: Response) => {
  try {
    const validation = validateReminder({ ...req.body, contract_id: req.params.contractId as string });
    if (!validation.isValid()) {
      res.status(400).json(validation.toResponse());
      return;
    }

    const now = new Date().toISOString();
    const reminder: Reminder = {
      id: randomUUID(),
      contract_id: req.params.contractId as string,
      reminder_date: req.body.reminder_date,
      reminder_type: req.body.reminder_type,
      owner_user_id: req.body.owner_user_id || req.user!.id,
      completed: false,
      reminder_note: req.body.reminder_note,
      created_at: now,
      updated_at: now
    };

    const created = await reminderRepo.create(reminder);
    await activityRepo.logActivity(req.user!.id, 'Reminder', reminder.id, 'Create', `Created reminder for contract`);
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create reminder' });
  }
});

// PATCH /api/reminders/:id
router.patch('/reminders/:id', requireWriter, async (req: AuthRequest, res: Response) => {
  try {
    const reminder = await reminderRepo.findById(req.params.id as string);
    if (!reminder) {
      res.status(404).json({ error: 'Reminder not found' });
      return;
    }

    const now = new Date().toISOString();
    const updated: Reminder = {
      ...reminder,
      ...req.body,
      id: reminder.id,
      created_at: reminder.created_at,
      updated_at: now,
      completion_timestamp: req.body.completed && !reminder.completed ? now : reminder.completion_timestamp
    };

    await reminderRepo.update(updated);
    await activityRepo.logActivity(req.user!.id, 'Reminder', reminder.id, 'Update', `Updated reminder`);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update reminder' });
  }
});

// ===== DASHBOARD ENDPOINTS =====

// GET /api/dashboard/summary
router.get('/dashboard/summary', async (req: AuthRequest, res: Response) => {
  try {
    const allContracts = await contractRepo.findAll(10000, 0);
    const activeContracts = allContracts.filter(c => c.status === 'Active' && !c.archived);
    
    const expiring30 = await contractRepo.findExpiringContracts(30);
    const expiring60 = await contractRepo.findExpiringContracts(60);
    const expiring90 = await contractRepo.findExpiringContracts(90);
    const expired = await contractRepo.findExpiredContracts();

    const allVendors = await vendorRepo.findAll(10000, 0);
    const highRiskVendors = allVendors.filter(v => v.risk_tier === 'High');
    const highRiskContracts = activeContracts.filter(c => c.risk_tier === 'High');

    const statusSummary: any = {};
    allContracts.forEach(c => {
      statusSummary[c.status] = (statusSummary[c.status] || 0) + 1;
    });

    res.json({
      total_active_contracts: activeContracts.length,
      expiring_30_days: expiring30.length,
      expiring_60_days: expiring60.length,
      expiring_90_days: expiring90.length,
      expired_contracts: expired.length,
      high_risk_vendors: highRiskVendors.length,
      high_risk_contracts: highRiskContracts.length,
      status_summary: statusSummary
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch dashboard summary' });
  }
});

// ===== EXPORT ENDPOINTS =====

// GET /api/contracts/export.csv
router.get('/contracts/export.csv', async (req: AuthRequest, res: Response) => {
  try {
    const contracts = await contractRepo.findAll(10000, 0);
    
    const headers = ['id', 'title', 'vendor_id', 'contract_owner', 'status', 'start_date', 'end_date', 'contract_value', 'currency', 'risk_tier', 'auto_renew'];
    
    const csv = [
      headers.join(','),
      ...contracts
        .filter(c => !c.archived)
        .map(c => 
          [
            c.id,
            `"${c.title}"`,
            c.vendor_id,
            c.contract_owner,
            c.status,
            c.start_date,
            c.end_date,
            c.contract_value || '',
            c.currency || '',
            c.risk_tier || '',
            c.auto_renew ? '1' : '0'
          ].join(',')
        )
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="contracts.csv"');
    res.send(csv);
  } catch (err) {
    res.status(500).json({ error: 'Failed to export contracts' });
  }
});

export default router;
