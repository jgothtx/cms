import { getDb } from './database';
import { v4 as uuid } from 'uuid';
import type { Vendor, Contract, Reminder, ActivityEvent, DocumentMetadata, User } from './models';

// ---- Helpers ----
function now() {
  return new Date().toISOString().replace('T', ' ').substring(0, 19);
}

function boolToInt(v: any): number {
  return v ? 1 : 0;
}

function rowToVendor(row: any): Vendor {
  return { ...row, status: row.status as Vendor['status'], risk_tier: row.risk_tier as Vendor['risk_tier'] };
}

function rowToContract(row: any): Contract {
  return {
    ...row,
    auto_renew: !!row.auto_renew,
    insurance_required: !!row.insurance_required,
    soc2_required: !!row.soc2_required,
    dpa_required: !!row.dpa_required,
    audit_rights: !!row.audit_rights,
    archived: !!row.archived,
  };
}

function rowToReminder(row: any): Reminder {
  return { ...row, completed: !!row.completed };
}

// ---- Users ----
export function findUserBySubject(subjectId: string): User | undefined {
  const row = getDb().prepare('SELECT * FROM users WHERE auth_subject_id = ?').get(subjectId) as any;
  return row ? { ...row, active: !!row.active } : undefined;
}

export function createUser(data: Partial<User> & { auth_subject_id: string; display_name: string; email: string; role: User['role'] }): User {
  const id = uuid();
  const ts = now();
  getDb().prepare(`
    INSERT INTO users (id, display_name, email, role, auth_subject_id, department, title, active, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, data.display_name, data.email, data.role, data.auth_subject_id, data.department || null, data.title || null, 1, ts, ts);
  return findUserBySubject(data.auth_subject_id)!;
}

export function listUsers(): User[] {
  return (getDb().prepare('SELECT * FROM users ORDER BY display_name').all() as any[]).map(r => ({ ...r, active: !!r.active }));
}

// ---- Vendors ----
export function listVendors(params?: { search?: string; status?: string; category?: string; risk_tier?: string; sort?: string; order?: string; page?: number; limit?: number }): { data: Vendor[]; total: number } {
  let where = 'WHERE 1=1';
  const args: any[] = [];

  if (params?.search) {
    where += ' AND (legal_name LIKE ? OR dba_name LIKE ?)';
    args.push(`%${params.search}%`, `%${params.search}%`);
  }
  if (params?.status) { where += ' AND status = ?'; args.push(params.status); }
  if (params?.category) { where += ' AND category = ?'; args.push(params.category); }
  if (params?.risk_tier) { where += ' AND risk_tier = ?'; args.push(params.risk_tier); }

  const total = (getDb().prepare(`SELECT COUNT(*) as cnt FROM vendors ${where}`).get(...args) as any).cnt;

  const sortCol = ['legal_name', 'status', 'risk_tier', 'created_at'].includes(params?.sort || '') ? params!.sort : 'legal_name';
  const sortOrder = params?.order === 'desc' ? 'DESC' : 'ASC';
  const limit = Math.min(params?.limit || 50, 200);
  const offset = ((params?.page || 1) - 1) * limit;

  const rows = getDb().prepare(`SELECT * FROM vendors ${where} ORDER BY ${sortCol} ${sortOrder} LIMIT ? OFFSET ?`).all(...args, limit, offset) as any[];
  return { data: rows.map(rowToVendor), total };
}

export function getVendor(id: string): Vendor | undefined {
  const row = getDb().prepare('SELECT * FROM vendors WHERE id = ?').get(id) as any;
  return row ? rowToVendor(row) : undefined;
}

export function createVendor(data: Partial<Vendor>, userId?: string): Vendor {
  const id = uuid();
  const ts = now();
  getDb().prepare(`
    INSERT INTO vendors (id, legal_name, dba_name, status, category, tax_id, website, primary_contact_name, primary_contact_email, primary_contact_phone, billing_contact_name, billing_contact_email, billing_address, country, risk_tier, performance_rating, notes, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, data.legal_name, data.dba_name || null, data.status || 'Active', data.category || null,
    data.tax_id || null, data.website || null, data.primary_contact_name || null, data.primary_contact_email || null,
    data.primary_contact_phone || null, data.billing_contact_name || null, data.billing_contact_email || null,
    data.billing_address || null, data.country || null, data.risk_tier || 'Low', data.performance_rating || null,
    data.notes || null, ts, ts
  );
  logActivity({ entity_type: 'Vendor', entity_id: id, action: 'Create', actor_user_id: userId, change_summary: `Created vendor: ${data.legal_name}` });
  return getVendor(id)!;
}

export function updateVendor(id: string, data: Partial<Vendor>, userId?: string): Vendor | undefined {
  const existing = getVendor(id);
  if (!existing) return undefined;
  const ts = now();
  const fields = ['legal_name', 'dba_name', 'status', 'category', 'tax_id', 'website', 'primary_contact_name', 'primary_contact_email', 'primary_contact_phone', 'billing_contact_name', 'billing_contact_email', 'billing_address', 'country', 'risk_tier', 'performance_rating', 'notes'] as const;
  const updates: string[] = ['updated_at = ?'];
  const values: any[] = [ts];
  for (const f of fields) {
    if (f in data) {
      updates.push(`${f} = ?`);
      values.push((data as any)[f] ?? null);
    }
  }
  values.push(id);
  getDb().prepare(`UPDATE vendors SET ${updates.join(', ')} WHERE id = ?`).run(...values);
  logActivity({ entity_type: 'Vendor', entity_id: id, action: 'Update', actor_user_id: userId, change_summary: `Updated vendor: ${existing.legal_name}` });
  return getVendor(id);
}

export function deleteVendor(id: string, userId?: string): Vendor | undefined {
  const existing = getVendor(id);
  if (!existing) return undefined;
  const ts = now();
  getDb().prepare('UPDATE vendors SET status = ?, updated_at = ? WHERE id = ?').run('Inactive', ts, id);
  logActivity({ entity_type: 'Vendor', entity_id: id, action: 'Delete', actor_user_id: userId, change_summary: `Soft-deleted vendor: ${existing.legal_name}` });
  return getVendor(id);
}

export function deactivateVendor(id: string, userId?: string): Vendor | undefined {
  const existing = getVendor(id);
  if (!existing) return undefined;
  if (existing.status === 'Inactive') return existing;
  const ts = now();
  getDb().prepare('UPDATE vendors SET status = ?, updated_at = ? WHERE id = ?').run('Inactive', ts, id);
  logActivity({ entity_type: 'Vendor', entity_id: id, action: 'Deactivate', actor_user_id: userId, change_summary: `Deactivated vendor: ${existing.legal_name}` });
  return getVendor(id);
}

// ---- Contracts ----
export function listContracts(params?: {
  search?: string; status?: string; vendor_id?: string; owner?: string; risk_tier?: string;
  expiry_window?: number; archived?: string; sort?: string; order?: string; page?: number; limit?: number;
}): { data: Contract[]; total: number } {
  let where = 'WHERE 1=1';
  const args: any[] = [];

  if (params?.archived !== 'true' && params?.archived !== 'all') {
    where += ' AND archived = 0';
  } else if (params?.archived === 'true') {
    where += ' AND archived = 1';
  }

  if (params?.search) {
    where += ' AND (c.title LIKE ? OR v.legal_name LIKE ?)';
    args.push(`%${params.search}%`, `%${params.search}%`);
  }
  if (params?.status) { where += ' AND c.status = ?'; args.push(params.status); }
  if (params?.vendor_id) { where += ' AND c.vendor_id = ?'; args.push(params.vendor_id); }
  if (params?.owner) { where += ' AND c.contract_owner LIKE ?'; args.push(`%${params.owner}%`); }
  if (params?.risk_tier) { where += ' AND c.risk_tier = ?'; args.push(params.risk_tier); }
  if (params?.expiry_window) {
    where += ' AND c.end_date <= date(?, ?) AND c.end_date >= date(?)';
    args.push('now', `+${params.expiry_window} days`, 'now');
  }

  const total = (getDb().prepare(`SELECT COUNT(*) as cnt FROM contracts c LEFT JOIN vendors v ON c.vendor_id = v.id ${where}`).get(...args) as any).cnt;

  const allowedSorts: Record<string, string> = { end_date: 'c.end_date', contract_value: 'c.contract_value', vendor: 'v.legal_name', status: 'c.status', title: 'c.title', created_at: 'c.created_at' };
  const sortCol = allowedSorts[params?.sort || ''] || 'c.created_at';
  const sortOrder = params?.order === 'asc' ? 'ASC' : 'DESC';
  const limit = Math.min(params?.limit || 50, 200);
  const offset = ((params?.page || 1) - 1) * limit;

  const rows = getDb().prepare(`SELECT c.* FROM contracts c LEFT JOIN vendors v ON c.vendor_id = v.id ${where} ORDER BY ${sortCol} ${sortOrder} LIMIT ? OFFSET ?`).all(...args, limit, offset) as any[];
  return { data: rows.map(rowToContract), total };
}

export function getContract(id: string): Contract | undefined {
  const row = getDb().prepare('SELECT * FROM contracts WHERE id = ?').get(id) as any;
  return row ? rowToContract(row) : undefined;
}

export function createContract(data: Partial<Contract>, userId?: string): Contract {
  const id = uuid();
  const ts = now();
  getDb().prepare(`
    INSERT INTO contracts (id, title, vendor_id, contract_owner, status, start_date, end_date,
      external_reference_id, contract_type, description, parent_contract_id, effective_date, signature_date,
      termination_date, initial_term_months, renewal_term_months, auto_renew, notice_period_days,
      contract_value, currency, billing_frequency, payment_terms, cost_center_code, spend_category,
      price_escalation_terms, risk_tier, data_classification, insurance_required, soc2_required, dpa_required,
      compliance_exceptions, regulatory_tags, key_obligations, sla_terms, service_credits_terms, audit_rights,
      notes, archived, created_by, updated_by, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?)
  `).run(
    id, data.title, data.vendor_id, data.contract_owner, data.status || 'Draft',
    data.start_date, data.end_date, data.external_reference_id || null, data.contract_type || null,
    data.description || null, data.parent_contract_id || null, data.effective_date || null,
    data.signature_date || null, data.termination_date || null, data.initial_term_months ?? null,
    data.renewal_term_months ?? null, boolToInt(data.auto_renew), data.notice_period_days ?? null,
    data.contract_value ?? null, data.currency || 'USD', data.billing_frequency || null,
    data.payment_terms || null, data.cost_center_code || null, data.spend_category || null,
    data.price_escalation_terms || null, data.risk_tier || 'Low', data.data_classification || null,
    boolToInt(data.insurance_required), boolToInt(data.soc2_required), boolToInt(data.dpa_required),
    data.compliance_exceptions || null, data.regulatory_tags || null, data.key_obligations || null,
    data.sla_terms || null, data.service_credits_terms || null, boolToInt(data.audit_rights),
    data.notes || null, userId || null, userId || null, ts, ts
  );
  logActivity({ entity_type: 'Contract', entity_id: id, action: 'Create', actor_user_id: userId, change_summary: `Created contract: ${data.title}` });
  return getContract(id)!;
}

export function updateContract(id: string, data: Partial<Contract>, userId?: string): Contract | undefined {
  const existing = getContract(id);
  if (!existing) return undefined;
  const ts = now();

  const fields = [
    'title', 'vendor_id', 'contract_owner', 'status', 'start_date', 'end_date',
    'external_reference_id', 'contract_type', 'description', 'parent_contract_id',
    'effective_date', 'signature_date', 'termination_date', 'initial_term_months',
    'renewal_term_months', 'notice_period_days', 'contract_value', 'currency',
    'billing_frequency', 'payment_terms', 'cost_center_code', 'spend_category',
    'price_escalation_terms', 'risk_tier', 'data_classification', 'compliance_exceptions',
    'regulatory_tags', 'key_obligations', 'sla_terms', 'service_credits_terms', 'notes'
  ] as const;

  const boolFields = ['auto_renew', 'insurance_required', 'soc2_required', 'dpa_required', 'audit_rights'] as const;

  const updates: string[] = ['updated_at = ?', 'updated_by = ?'];
  const values: any[] = [ts, userId || null];

  for (const f of fields) {
    if (f in data) {
      updates.push(`${f} = ?`);
      values.push((data as any)[f] ?? null);
    }
  }
  for (const f of boolFields) {
    if (f in data) {
      updates.push(`${f} = ?`);
      values.push(boolToInt((data as any)[f]));
    }
  }

  if (data.status && data.status !== existing.status) {
    logActivity({ entity_type: 'Contract', entity_id: id, action: 'StatusChange', actor_user_id: userId, change_summary: `Status: ${existing.status} → ${data.status}` });
  }

  values.push(id);
  getDb().prepare(`UPDATE contracts SET ${updates.join(', ')} WHERE id = ?`).run(...values);
  logActivity({ entity_type: 'Contract', entity_id: id, action: 'Update', actor_user_id: userId, change_summary: `Updated contract: ${existing.title}` });
  return getContract(id);
}

export function archiveContract(id: string, userId?: string): Contract | undefined {
  const existing = getContract(id);
  if (!existing) return undefined;
  const ts = now();
  getDb().prepare('UPDATE contracts SET archived = 1, archived_at = ?, archived_by = ?, updated_at = ? WHERE id = ?').run(ts, userId || null, ts, id);
  logActivity({ entity_type: 'Contract', entity_id: id, action: 'Archive', actor_user_id: userId, change_summary: `Archived contract: ${existing.title}` });
  return getContract(id);
}

export function deleteContract(id: string, userId?: string): Contract | undefined {
  const existing = getContract(id);
  if (!existing) return undefined;
  const ts = now();
  getDb().prepare("UPDATE contracts SET archived = 1, status = 'Archived', archived_at = ?, archived_by = ?, updated_at = ? WHERE id = ?").run(ts, userId || null, ts, id);
  logActivity({ entity_type: 'Contract', entity_id: id, action: 'Delete', actor_user_id: userId, change_summary: `Soft-deleted contract: ${existing.title}` });
  return getContract(id);
}

export function restoreContract(id: string, userId?: string): Contract | undefined {
  const existing = getContract(id);
  if (!existing) return undefined;
  const ts = now();
  getDb().prepare("UPDATE contracts SET archived = 0, archived_at = NULL, archived_by = NULL, status = 'Draft', updated_at = ? WHERE id = ?").run(ts, id);
  logActivity({ entity_type: 'Contract', entity_id: id, action: 'Restore', actor_user_id: userId, change_summary: `Restored contract: ${existing.title}` });
  return getContract(id);
}

// ---- Reminders ----
export function listReminders(contractId: string): Reminder[] {
  return (getDb().prepare('SELECT * FROM reminders WHERE contract_id = ? ORDER BY reminder_date ASC').all(contractId) as any[]).map(rowToReminder);
}

export function getAllReminders(params?: { completed?: string }): Reminder[] {
  let where = 'WHERE 1=1';
  const args: any[] = [];
  if (params?.completed === 'true') { where += ' AND completed = 1'; }
  else if (params?.completed === 'false') { where += ' AND completed = 0'; }
  return (getDb().prepare(`SELECT * FROM reminders ${where} ORDER BY reminder_date ASC`).all(...args) as any[]).map(rowToReminder);
}

export function createReminder(data: Partial<Reminder>, userId?: string): Reminder {
  const id = uuid();
  const ts = now();
  getDb().prepare(`
    INSERT INTO reminders (id, contract_id, reminder_date, reminder_type, owner_user_id, completed, reminder_note, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, 0, ?, ?, ?)
  `).run(id, data.contract_id, data.reminder_date, data.reminder_type, data.owner_user_id, data.reminder_note || null, ts, ts);
  logActivity({ entity_type: 'Reminder', entity_id: id, action: 'Create', actor_user_id: userId, change_summary: `Created reminder for contract ${data.contract_id}` });
  return getDb().prepare('SELECT * FROM reminders WHERE id = ?').get(id) as Reminder;
}

export function updateReminder(id: string, data: Partial<Reminder>, userId?: string): Reminder | undefined {
  const existing = getDb().prepare('SELECT * FROM reminders WHERE id = ?').get(id) as any;
  if (!existing) return undefined;
  const ts = now();
  const updates: string[] = ['updated_at = ?'];
  const values: any[] = [ts];

  if ('reminder_date' in data) { updates.push('reminder_date = ?'); values.push(data.reminder_date); }
  if ('reminder_type' in data) { updates.push('reminder_type = ?'); values.push(data.reminder_type); }
  if ('owner_user_id' in data) { updates.push('owner_user_id = ?'); values.push(data.owner_user_id); }
  if ('reminder_note' in data) { updates.push('reminder_note = ?'); values.push(data.reminder_note); }
  if ('completed' in data) {
    updates.push('completed = ?');
    values.push(boolToInt(data.completed));
    if (data.completed) { updates.push('completed_at = ?'); values.push(ts); }
  }

  values.push(id);
  getDb().prepare(`UPDATE reminders SET ${updates.join(', ')} WHERE id = ?`).run(...values);
  logActivity({ entity_type: 'Reminder', entity_id: id, action: 'Update', actor_user_id: userId, change_summary: `Updated reminder` });
  return rowToReminder(getDb().prepare('SELECT * FROM reminders WHERE id = ?').get(id) as any);
}

// ---- Activity Events ----
export function logActivity(data: { entity_type: string; entity_id: string; action: string; actor_user_id?: string; change_summary?: string; before_snapshot?: string; after_snapshot?: string; correlation_id?: string }) {
  const id = uuid();
  getDb().prepare(`
    INSERT INTO activity_events (id, timestamp, actor_user_id, entity_type, entity_id, action, change_summary, before_snapshot, after_snapshot, correlation_id)
    VALUES (?, datetime('now'), ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, data.actor_user_id || null, data.entity_type, data.entity_id, data.action, data.change_summary || null, data.before_snapshot || null, data.after_snapshot || null, data.correlation_id || null);
}

export function listActivityEvents(params?: { entity_type?: string; entity_id?: string; actor_user_id?: string; action?: string; page?: number; limit?: number }): { data: ActivityEvent[]; total: number } {
  let where = 'WHERE 1=1';
  const args: any[] = [];
  if (params?.entity_type) { where += ' AND entity_type = ?'; args.push(params.entity_type); }
  if (params?.entity_id) { where += ' AND entity_id = ?'; args.push(params.entity_id); }
  if (params?.actor_user_id) { where += ' AND actor_user_id = ?'; args.push(params.actor_user_id); }
  if (params?.action) { where += ' AND action = ?'; args.push(params.action); }

  const total = (getDb().prepare(`SELECT COUNT(*) as cnt FROM activity_events ${where}`).get(...args) as any).cnt;
  const limit = Math.min(params?.limit || 50, 200);
  const offset = ((params?.page || 1) - 1) * limit;

  const rows = getDb().prepare(`SELECT * FROM activity_events ${where} ORDER BY timestamp DESC LIMIT ? OFFSET ?`).all(...args, limit, offset) as ActivityEvent[];
  return { data: rows, total };
}

// ---- Document Metadata ----
export function createDocumentMetadata(data: Partial<DocumentMetadata>): DocumentMetadata {
  const id = uuid();
  const ts = now();
  getDb().prepare(`
    INSERT INTO document_metadata (id, contract_id, file_name, file_type, storage_pointer, uploaded_by, uploaded_at, version_number, document_category, checksum, file_size, source_system)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, data.contract_id, data.file_name, data.file_type, data.storage_pointer, data.uploaded_by || null, ts, data.version_number || 1, data.document_category || null, data.checksum || null, data.file_size || null, data.source_system || null);
  return getDb().prepare('SELECT * FROM document_metadata WHERE id = ?').get(id) as DocumentMetadata;
}

export function listDocuments(contractId: string): DocumentMetadata[] {
  return getDb().prepare('SELECT * FROM document_metadata WHERE contract_id = ? ORDER BY uploaded_at DESC').all(contractId) as DocumentMetadata[];
}

// ---- Dashboard ----
export function getDashboardSummary() {
  const db = getDb();
  const totalActive = (db.prepare("SELECT COUNT(*) as cnt FROM contracts WHERE status = 'Active' AND archived = 0").get() as any).cnt;
  const expiring30 = (db.prepare("SELECT COUNT(*) as cnt FROM contracts WHERE archived = 0 AND end_date BETWEEN date('now') AND date('now', '+30 days')").get() as any).cnt;
  const expiring60 = (db.prepare("SELECT COUNT(*) as cnt FROM contracts WHERE archived = 0 AND end_date BETWEEN date('now') AND date('now', '+60 days')").get() as any).cnt;
  const expiring90 = (db.prepare("SELECT COUNT(*) as cnt FROM contracts WHERE archived = 0 AND end_date BETWEEN date('now') AND date('now', '+90 days')").get() as any).cnt;
  const expired = (db.prepare("SELECT COUNT(*) as cnt FROM contracts WHERE archived = 0 AND end_date < date('now') AND status != 'Terminated'").get() as any).cnt;
  const highRisk = (db.prepare("SELECT COUNT(*) as cnt FROM contracts WHERE archived = 0 AND risk_tier = 'High'").get() as any).cnt;

  const byStatus = db.prepare("SELECT status, COUNT(*) as count FROM contracts WHERE archived = 0 GROUP BY status").all();
  const byVendor = db.prepare(`
    SELECT v.legal_name as vendor, COUNT(*) as count
    FROM contracts c JOIN vendors v ON c.vendor_id = v.id
    WHERE c.archived = 0
    GROUP BY v.legal_name ORDER BY count DESC LIMIT 10
  `).all();

  const recentActivity = db.prepare("SELECT * FROM activity_events ORDER BY timestamp DESC LIMIT 10").all();

  return { totalActive, expiring30, expiring60, expiring90, expired, highRisk, byStatus, byVendor, recentActivity };
}
