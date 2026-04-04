import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'contracts.db');

let db: Database.Database;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initSchema(db);
    deduplicateVendors(db);
  }
  return db;
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      display_name TEXT NOT NULL,
      email TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('Admin','Contract Manager','Viewer')),
      auth_subject_id TEXT NOT NULL UNIQUE,
      department TEXT,
      title TEXT,
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS vendors (
      id TEXT PRIMARY KEY,
      legal_name TEXT NOT NULL,
      dba_name TEXT,
      status TEXT NOT NULL DEFAULT 'Active' CHECK(status IN ('Active','Inactive')),
      category TEXT,
      tax_id TEXT,
      website TEXT,
      primary_contact_name TEXT,
      primary_contact_email TEXT,
      primary_contact_phone TEXT,
      billing_contact_name TEXT,
      billing_contact_email TEXT,
      billing_address TEXT,
      country TEXT,
      risk_tier TEXT NOT NULL DEFAULT 'Low' CHECK(risk_tier IN ('Low','Medium','High')),
      performance_rating TEXT,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS contracts (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      vendor_id TEXT NOT NULL REFERENCES vendors(id),
      contract_owner TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Draft' CHECK(status IN ('Draft','Under Review','Active','Expiring Soon','Expired','Terminated','Archived')),
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      external_reference_id TEXT,
      contract_type TEXT,
      description TEXT,
      parent_contract_id TEXT REFERENCES contracts(id),
      effective_date TEXT,
      signature_date TEXT,
      termination_date TEXT,
      initial_term_months INTEGER,
      renewal_term_months INTEGER,
      auto_renew INTEGER DEFAULT 0,
      notice_period_days INTEGER,
      contract_value REAL,
      currency TEXT DEFAULT 'USD',
      billing_frequency TEXT CHECK(billing_frequency IS NULL OR billing_frequency IN ('Monthly','Quarterly','Semi-Annual','Annual','One-Time','Usage-Based')),
      payment_terms TEXT,
      cost_center_code TEXT,
      spend_category TEXT,
      price_escalation_terms TEXT,
      risk_tier TEXT DEFAULT 'Low' CHECK(risk_tier IS NULL OR risk_tier IN ('Low','Medium','High')),
      data_classification TEXT CHECK(data_classification IS NULL OR data_classification IN ('Public','Internal','Confidential','Restricted')),
      insurance_required INTEGER DEFAULT 0,
      soc2_required INTEGER DEFAULT 0,
      dpa_required INTEGER DEFAULT 0,
      compliance_exceptions TEXT,
      regulatory_tags TEXT,
      key_obligations TEXT,
      sla_terms TEXT,
      service_credits_terms TEXT,
      audit_rights INTEGER DEFAULT 0,
      notes TEXT,
      archived INTEGER NOT NULL DEFAULT 0,
      archived_at TEXT,
      archived_by TEXT,
      created_by TEXT,
      updated_by TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS reminders (
      id TEXT PRIMARY KEY,
      contract_id TEXT NOT NULL REFERENCES contracts(id),
      reminder_date TEXT NOT NULL,
      reminder_type TEXT NOT NULL,
      owner_user_id TEXT NOT NULL,
      completed INTEGER NOT NULL DEFAULT 0,
      completed_at TEXT,
      reminder_note TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS activity_events (
      id TEXT PRIMARY KEY,
      timestamp TEXT NOT NULL DEFAULT (datetime('now')),
      actor_user_id TEXT,
      entity_type TEXT NOT NULL CHECK(entity_type IN ('Contract','Vendor','Reminder','User')),
      entity_id TEXT NOT NULL,
      action TEXT NOT NULL CHECK(action IN ('Create','Update','StatusChange','Archive','Restore','Delete','Deactivate')),
      change_summary TEXT,
      before_snapshot TEXT,
      after_snapshot TEXT,
      correlation_id TEXT
    );

    CREATE TABLE IF NOT EXISTS document_metadata (
      id TEXT PRIMARY KEY,
      contract_id TEXT NOT NULL REFERENCES contracts(id),
      file_name TEXT NOT NULL,
      file_type TEXT NOT NULL,
      storage_pointer TEXT NOT NULL,
      uploaded_by TEXT,
      uploaded_at TEXT NOT NULL DEFAULT (datetime('now')),
      version_number INTEGER NOT NULL DEFAULT 1,
      document_category TEXT,
      checksum TEXT,
      file_size INTEGER,
      source_system TEXT
    );
  `);

  // Create unique index on vendor legal_name if not exists
  try {
    db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS idx_vendor_legal_name_unique ON vendors(LOWER(TRIM(legal_name)));`);
  } catch {
    // Index may already exist
  }
}

function deduplicateVendors(db: Database.Database) {
  const dupes = db.prepare(`
    SELECT LOWER(TRIM(legal_name)) as norm_name, MIN(created_at) as earliest
    FROM vendors
    GROUP BY LOWER(TRIM(legal_name))
    HAVING COUNT(*) > 1
  `).all() as Array<{ norm_name: string; earliest: string }>;

  for (const dupe of dupes) {
    db.prepare(`
      DELETE FROM vendors
      WHERE LOWER(TRIM(legal_name)) = ? AND created_at != ?
    `).run(dupe.norm_name, dupe.earliest);
  }
}
