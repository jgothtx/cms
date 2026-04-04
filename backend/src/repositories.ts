import { randomUUID } from 'crypto';
import { database } from './database';
import {
  User, Vendor, Contract, Reminder, ActivityEvent, DocumentMetadata,
  ContractStatus, VendorStatus, RiskTier, UserRole, ActivityAction, EntityType
} from './models';

// Base Repository
export abstract class Repository<T> {
  protected abstract tableName: string;
  protected keyField = 'id';

  abstract toRow(entity: T): any;
  abstract fromRow(row: any): T;

  async create(entity: T): Promise<T> {
    const row = this.toRow(entity);
    const columns = Object.keys(row);
    const placeholders = columns.map(() => '?').join(',');
    const values = columns.map(col => row[col]);

    const sql = `INSERT INTO ${this.tableName} (${columns.join(',')}) VALUES (${placeholders})`;
    await database.run(sql, values);
    return entity;
  }

  async findById(id: string): Promise<T | null> {
    const sql = `SELECT * FROM ${this.tableName} WHERE ${this.keyField} = ?`;
    const row = await database.get(sql, [id]);
    return row ? this.fromRow(row) : null;
  }

  async findAll(limit = 100, offset = 0): Promise<T[]> {
    const sql = `SELECT * FROM ${this.tableName} LIMIT ? OFFSET ?`;
    const rows = await database.all(sql, [limit, offset]);
    return rows.map(row => this.fromRow(row));
  }

  async update(entity: T): Promise<void> {
    const row = this.toRow(entity);
    const keys = Object.keys(row);
    const setClause = keys.map(key => `${key} = ?`).join(',');
    const values = keys.map(key => row[key]);
    const id = (entity as any)[this.keyField];

    const sql = `UPDATE ${this.tableName} SET ${setClause} WHERE ${this.keyField} = ?`;
    await database.run(sql, [...values, id]);
  }

  async delete(id: string): Promise<void> {
    const sql = `DELETE FROM ${this.tableName} WHERE ${this.keyField} = ?`;
    await database.run(sql, [id]);
  }
}

// User Repository
export class UserRepository extends Repository<User> {
  protected tableName = 'users';

  toRow(user: User): any {
    return {
      id: user.id,
      email: user.email,
      display_name: user.display_name,
      role: user.role,
      auth_subject_id: user.auth_subject_id,
      department: user.department,
      title: user.title,
      active: user.active ? 1 : 0,
      created_at: user.created_at,
      updated_at: user.updated_at
    };
  }

  fromRow(row: any): User {
    return {
      id: row.id,
      email: row.email,
      display_name: row.display_name,
      role: row.role,
      auth_subject_id: row.auth_subject_id,
      department: row.department,
      title: row.title,
      active: row.active === 1,
      created_at: row.created_at,
      updated_at: row.updated_at
    };
  }

  async findByEmail(email: string): Promise<User | null> {
    const sql = 'SELECT * FROM users WHERE email = ?';
    const row = await database.get(sql, [email]);
    return row ? this.fromRow(row) : null;
  }

  async findByAuthSubjectId(authSubjectId: string): Promise<User | null> {
    const sql = 'SELECT * FROM users WHERE auth_subject_id = ?';
    const row = await database.get(sql, [authSubjectId]);
    return row ? this.fromRow(row) : null;
  }

  async createUser(email: string, displayName: string, role: UserRole, authSubjectId?: string): Promise<User> {
    const now = new Date().toISOString();
    const user: User = {
      id: randomUUID(),
      email,
      display_name: displayName,
      role,
      auth_subject_id: authSubjectId,
      active: true,
      created_at: now,
      updated_at: now
    };
    return this.create(user);
  }
}

// Vendor Repository
export class VendorRepository extends Repository<Vendor> {
  protected tableName = 'vendors';

  toRow(vendor: Vendor): any {
    return {
      id: vendor.id,
      legal_name: vendor.legal_name,
      dba_name: vendor.dba_name,
      category: vendor.category,
      status: vendor.status,
      risk_tier: vendor.risk_tier,
      tax_id: vendor.tax_id,
      website: vendor.website,
      primary_contact_name: vendor.primary_contact_name,
      primary_contact_email: vendor.primary_contact_email,
      primary_contact_phone: vendor.primary_contact_phone,
      billing_contact_name: vendor.billing_contact_name,
      billing_contact_email: vendor.billing_contact_email,
      billing_address: vendor.billing_address,
      country: vendor.country,
      performance_rating: vendor.performance_rating,
      notes: vendor.notes,
      created_at: vendor.created_at,
      updated_at: vendor.updated_at
    };
  }

  fromRow(row: any): Vendor {
    return {
      id: row.id,
      legal_name: row.legal_name,
      dba_name: row.dba_name,
      category: row.category,
      status: row.status,
      risk_tier: row.risk_tier,
      tax_id: row.tax_id,
      website: row.website,
      primary_contact_name: row.primary_contact_name,
      primary_contact_email: row.primary_contact_email,
      primary_contact_phone: row.primary_contact_phone,
      billing_contact_name: row.billing_contact_name,
      billing_contact_email: row.billing_contact_email,
      billing_address: row.billing_address,
      country: row.country,
      performance_rating: row.performance_rating,
      notes: row.notes,
      created_at: row.created_at,
      updated_at: row.updated_at
    };
  }

  async createVendor(legalName: string, riskTier: RiskTier, status: VendorStatus = 'Active'): Promise<Vendor> {
    const now = new Date().toISOString();
    const vendor: Vendor = {
      id: randomUUID(),
      legal_name: legalName,
      status,
      risk_tier: riskTier,
      created_at: now,
      updated_at: now
    };
    return this.create(vendor);
  }

  async searchByName(query: string): Promise<Vendor[]> {
    const sql = 'SELECT * FROM vendors WHERE legal_name LIKE ? OR dba_name LIKE ?';
    const pattern = `%${query}%`;
    const rows = await database.all(sql, [pattern, pattern]);
    return rows.map(row => this.fromRow(row));
  }

  async findByLegalNameNormalized(legalName: string): Promise<Vendor | null> {
    const sql = 'SELECT * FROM vendors WHERE lower(trim(legal_name)) = lower(trim(?))';
    const row = await database.get(sql, [legalName]);
    return row ? this.fromRow(row) : null;
  }
}

// Contract Repository
export class ContractRepository extends Repository<Contract> {
  protected tableName = 'contracts';

  toRow(contract: Contract): any {
    return {
      id: contract.id,
      title: contract.title,
      vendor_id: contract.vendor_id,
      contract_owner: contract.contract_owner,
      start_date: contract.start_date,
      end_date: contract.end_date,
      status: contract.status,
      external_reference_id: contract.external_reference_id,
      contract_type: contract.contract_type,
      description: contract.description,
      parent_contract_id: contract.parent_contract_id,
      effective_date: contract.effective_date,
      signature_date: contract.signature_date,
      initial_term_months: contract.initial_term_months,
      auto_renew: contract.auto_renew ? 1 : 0,
      renewal_term_months: contract.renewal_term_months,
      notice_period_days: contract.notice_period_days,
      termination_date: contract.termination_date,
      contract_value: contract.contract_value,
      currency: contract.currency,
      billing_frequency: contract.billing_frequency,
      payment_terms: contract.payment_terms,
      cost_center_code: contract.cost_center_code,
      spend_category: contract.spend_category,
      price_escalation_terms: contract.price_escalation_terms,
      risk_tier: contract.risk_tier,
      data_classification: contract.data_classification,
      insurance_required: contract.insurance_required ? 1 : 0,
      soc2_required: contract.soc2_required ? 1 : 0,
      dpa_required: contract.dpa_required ? 1 : 0,
      compliance_exceptions: contract.compliance_exceptions,
      regulatory_tags: contract.regulatory_tags,
      key_obligations: contract.key_obligations,
      sla_terms: contract.sla_terms,
      service_credits_terms: contract.service_credits_terms,
      audit_rights_flag: contract.audit_rights_flag ? 1 : 0,
      notes: contract.notes,
      archived: contract.archived ? 1 : 0,
      archived_at: contract.archived_at,
      archived_by: contract.archived_by,
      created_at: contract.created_at,
      created_by: contract.created_by,
      updated_at: contract.updated_at,
      updated_by: contract.updated_by
    };
  }

  fromRow(row: any): Contract {
    return {
      id: row.id,
      title: row.title,
      vendor_id: row.vendor_id,
      contract_owner: row.contract_owner,
      start_date: row.start_date,
      end_date: row.end_date,
      status: row.status,
      external_reference_id: row.external_reference_id,
      contract_type: row.contract_type,
      description: row.description,
      parent_contract_id: row.parent_contract_id,
      effective_date: row.effective_date,
      signature_date: row.signature_date,
      initial_term_months: row.initial_term_months,
      auto_renew: row.auto_renew === 1,
      renewal_term_months: row.renewal_term_months,
      notice_period_days: row.notice_period_days,
      termination_date: row.termination_date,
      contract_value: row.contract_value,
      currency: row.currency,
      billing_frequency: row.billing_frequency,
      payment_terms: row.payment_terms,
      cost_center_code: row.cost_center_code,
      spend_category: row.spend_category,
      price_escalation_terms: row.price_escalation_terms,
      risk_tier: row.risk_tier,
      data_classification: row.data_classification,
      insurance_required: row.insurance_required === 1,
      soc2_required: row.soc2_required === 1,
      dpa_required: row.dpa_required === 1,
      compliance_exceptions: row.compliance_exceptions,
      regulatory_tags: row.regulatory_tags,
      key_obligations: row.key_obligations,
      sla_terms: row.sla_terms,
      service_credits_terms: row.service_credits_terms,
      audit_rights_flag: row.audit_rights_flag === 1,
      notes: row.notes,
      archived: row.archived === 1,
      archived_at: row.archived_at,
      archived_by: row.archived_by,
      created_at: row.created_at,
      created_by: row.created_by,
      updated_at: row.updated_at,
      updated_by: row.updated_by
    };
  }

  async findByVendor(vendorId: string): Promise<Contract[]> {
    const sql = 'SELECT * FROM contracts WHERE vendor_id = ? AND archived = 0';
    const rows = await database.all(sql, [vendorId]);
    return rows.map(row => this.fromRow(row));
  }

  async searchByTitle(query: string): Promise<Contract[]> {
    const sql = 'SELECT * FROM contracts WHERE title LIKE ? AND archived = 0';
    const pattern = `%${query}%`;
    const rows = await database.all(sql, [pattern]);
    return rows.map(row => this.fromRow(row));
  }

  async findExpiringContracts(daysAhead: number): Promise<Contract[]> {
    const now = new Date().toISOString().split('T')[0];
    const futureDate = new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const sql = 'SELECT * FROM contracts WHERE archived = 0 AND end_date >= ? AND end_date <= ?';
    const rows = await database.all(sql, [now, futureDate]);
    return rows.map(row => this.fromRow(row));
  }

  async findExpiredContracts(): Promise<Contract[]> {
    const now = new Date().toISOString().split('T')[0];
    const sql = 'SELECT * FROM contracts WHERE archived = 0 AND end_date < ?';
    const rows = await database.all(sql, [now]);
    return rows.map(row => this.fromRow(row));
  }
}

// Reminder Repository
export class ReminderRepository extends Repository<Reminder> {
  protected tableName = 'reminders';

  toRow(reminder: Reminder): any {
    return {
      id: reminder.id,
      contract_id: reminder.contract_id,
      reminder_date: reminder.reminder_date,
      reminder_type: reminder.reminder_type,
      owner_user_id: reminder.owner_user_id,
      completed: reminder.completed ? 1 : 0,
      completion_timestamp: reminder.completion_timestamp,
      reminder_note: reminder.reminder_note,
      created_at: reminder.created_at,
      updated_at: reminder.updated_at
    };
  }

  fromRow(row: any): Reminder {
    return {
      id: row.id,
      contract_id: row.contract_id,
      reminder_date: row.reminder_date,
      reminder_type: row.reminder_type,
      owner_user_id: row.owner_user_id,
      completed: row.completed === 1,
      completion_timestamp: row.completion_timestamp,
      reminder_note: row.reminder_note,
      created_at: row.created_at,
      updated_at: row.updated_at
    };
  }

  async findByContract(contractId: string): Promise<Reminder[]> {
    const sql = 'SELECT * FROM reminders WHERE contract_id = ? ORDER BY reminder_date ASC';
    const rows = await database.all(sql, [contractId]);
    return rows.map(row => this.fromRow(row));
  }

  async findUpcoming(days: number): Promise<Reminder[]> {
    const now = new Date().toISOString().split('T')[0];
    const futureDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const sql = 'SELECT * FROM reminders WHERE completed = 0 AND reminder_date >= ? AND reminder_date <= ?';
    const rows = await database.all(sql, [now, futureDate]);
    return rows.map(row => this.fromRow(row));
  }
}

// ActivityEvent Repository
export class ActivityEventRepository extends Repository<ActivityEvent> {
  protected tableName = 'activity_events';

  toRow(event: ActivityEvent): any {
    return {
      id: event.id,
      timestamp: event.timestamp,
      actor_user_id: event.actor_user_id,
      entity_type: event.entity_type,
      entity_id: event.entity_id,
      action: event.action,
      change_summary: event.change_summary,
      before_snapshot: event.before_snapshot,
      after_snapshot: event.after_snapshot,
      correlation_id: event.correlation_id,
      created_at: event.created_at
    };
  }

  fromRow(row: any): ActivityEvent {
    return {
      id: row.id,
      timestamp: row.timestamp,
      actor_user_id: row.actor_user_id,
      entity_type: row.entity_type,
      entity_id: row.entity_id,
      action: row.action,
      change_summary: row.change_summary,
      before_snapshot: row.before_snapshot,
      after_snapshot: row.after_snapshot,
      correlation_id: row.correlation_id,
      created_at: row.created_at
    };
  }

  async findByEntity(entityType: EntityType, entityId: string): Promise<ActivityEvent[]> {
    const sql = 'SELECT * FROM activity_events WHERE entity_type = ? AND entity_id = ? ORDER BY timestamp DESC';
    const rows = await database.all(sql, [entityType, entityId]);
    return rows.map(row => this.fromRow(row));
  }

  async logActivity(userId: string, entity: EntityType, entityId: string, action: ActivityAction, summary: string): Promise<ActivityEvent> {
    const now = new Date().toISOString();
    const event: ActivityEvent = {
      id: randomUUID(),
      timestamp: now,
      actor_user_id: userId,
      entity_type: entity,
      entity_id: entityId,
      action,
      change_summary: summary,
      created_at: now
    };
    return this.create(event);
  }
}

// DocumentMetadata Repository
export class DocumentMetadataRepository extends Repository<DocumentMetadata> {
  protected tableName = 'document_metadata';

  toRow(doc: DocumentMetadata): any {
    return {
      id: doc.id,
      contract_id: doc.contract_id,
      file_name: doc.file_name,
      file_type: doc.file_type,
      storage_pointer: doc.storage_pointer,
      uploaded_by: doc.uploaded_by,
      uploaded_at: doc.uploaded_at,
      version_number: doc.version_number,
      document_category: doc.document_category,
      checksum: doc.checksum,
      file_size: doc.file_size,
      source_system: doc.source_system
    };
  }

  fromRow(row: any): DocumentMetadata {
    return {
      id: row.id,
      contract_id: row.contract_id,
      file_name: row.file_name,
      file_type: row.file_type,
      storage_pointer: row.storage_pointer,
      uploaded_by: row.uploaded_by,
      uploaded_at: row.uploaded_at,
      version_number: row.version_number,
      document_category: row.document_category,
      checksum: row.checksum,
      file_size: row.file_size,
      source_system: row.source_system
    };
  }

  async findByContract(contractId: string): Promise<DocumentMetadata[]> {
    const sql = 'SELECT * FROM document_metadata WHERE contract_id = ? ORDER BY uploaded_at DESC';
    const rows = await database.all(sql, [contractId]);
    return rows.map(row => this.fromRow(row));
  }
}
