"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.database = exports.Database = void 0;
const sqlite3_1 = __importDefault(require("sqlite3"));
const path_1 = __importDefault(require("path"));
const DB_PATH = process.env.CONTRACT_DB_PATH || path_1.default.join(__dirname, '..', '..', 'contracts.db');
class Database {
    constructor() {
        this.isTest = process.env.NODE_ENV === 'test' || !!process.env.JEST_WORKER_ID;
        this.db = new sqlite3_1.default.Database(DB_PATH, (err) => {
            if (err) {
                if (!this.isTest) {
                    console.error('Error opening database:', err);
                }
            }
            else if (!this.isTest) {
                console.log('Connected to SQLite database');
            }
        });
        this.db.run('PRAGMA foreign_keys = ON');
    }
    async initialize() {
        return new Promise((resolve, reject) => {
            this.db.serialize(() => {
                // Users table
                this.db.run(`
          CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            display_name TEXT NOT NULL,
            role TEXT NOT NULL CHECK(role IN ('Admin', 'Contract Manager', 'Viewer')),
            auth_subject_id TEXT UNIQUE,
            department TEXT,
            title TEXT,
            active BOOLEAN DEFAULT 1,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
          )
        `);
                // Vendors table
                this.db.run(`
          CREATE TABLE IF NOT EXISTS vendors (
            id TEXT PRIMARY KEY,
            legal_name TEXT NOT NULL,
            dba_name TEXT,
            category TEXT,
            status TEXT NOT NULL CHECK(status IN ('Active', 'Inactive')),
            risk_tier TEXT NOT NULL CHECK(risk_tier IN ('Low', 'Medium', 'High')),
            tax_id TEXT,
            website TEXT,
            primary_contact_name TEXT,
            primary_contact_email TEXT,
            primary_contact_phone TEXT,
            billing_contact_name TEXT,
            billing_contact_email TEXT,
            billing_address TEXT,
            country TEXT,
            performance_rating TEXT,
            notes TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
          )
        `);
                this.db.run(`
          DELETE FROM vendors
          WHERE rowid NOT IN (
            SELECT MIN(rowid)
            FROM vendors
            GROUP BY lower(trim(legal_name))
          )
        `);
                this.db.run(`
          CREATE UNIQUE INDEX IF NOT EXISTS idx_vendors_legal_name_unique
          ON vendors (lower(trim(legal_name)))
        `);
                // Contracts table
                this.db.run(`
          CREATE TABLE IF NOT EXISTS contracts (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            vendor_id TEXT NOT NULL,
            contract_owner TEXT NOT NULL,
            start_date TEXT NOT NULL,
            end_date TEXT NOT NULL,
            status TEXT NOT NULL CHECK(status IN ('Draft', 'Under Review', 'Active', 'Expiring Soon', 'Expired', 'Terminated', 'Archived')),
            external_reference_id TEXT,
            contract_type TEXT,
            description TEXT,
            parent_contract_id TEXT,
            effective_date TEXT,
            signature_date TEXT,
            initial_term_months INTEGER,
            auto_renew BOOLEAN DEFAULT 0,
            renewal_term_months INTEGER,
            notice_period_days INTEGER,
            termination_date TEXT,
            contract_value REAL,
            currency TEXT,
            billing_frequency TEXT,
            payment_terms TEXT,
            cost_center_code TEXT,
            spend_category TEXT,
            price_escalation_terms TEXT,
            risk_tier TEXT CHECK(risk_tier IN ('Low', 'Medium', 'High')),
            data_classification TEXT,
            insurance_required BOOLEAN DEFAULT 0,
            soc2_required BOOLEAN DEFAULT 0,
            dpa_required BOOLEAN DEFAULT 0,
            compliance_exceptions TEXT,
            regulatory_tags TEXT,
            key_obligations TEXT,
            sla_terms TEXT,
            service_credits_terms TEXT,
            audit_rights_flag BOOLEAN DEFAULT 0,
            notes TEXT,
            archived BOOLEAN DEFAULT 0,
            archived_at TEXT,
            archived_by TEXT,
            created_at TEXT NOT NULL,
            created_by TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            updated_by TEXT NOT NULL,
            FOREIGN KEY(vendor_id) REFERENCES vendors(id),
            FOREIGN KEY(parent_contract_id) REFERENCES contracts(id)
          )
        `);
                // Reminders table
                this.db.run(`
          CREATE TABLE IF NOT EXISTS reminders (
            id TEXT PRIMARY KEY,
            contract_id TEXT NOT NULL,
            reminder_date TEXT NOT NULL,
            reminder_type TEXT NOT NULL,
            owner_user_id TEXT NOT NULL,
            completed BOOLEAN DEFAULT 0,
            completion_timestamp TEXT,
            reminder_note TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY(contract_id) REFERENCES contracts(id),
            FOREIGN KEY(owner_user_id) REFERENCES users(id)
          )
        `);
                // ActivityEvent table
                this.db.run(`
          CREATE TABLE IF NOT EXISTS activity_events (
            id TEXT PRIMARY KEY,
            timestamp TEXT NOT NULL,
            actor_user_id TEXT NOT NULL,
            entity_type TEXT NOT NULL,
            entity_id TEXT NOT NULL,
            action TEXT NOT NULL CHECK(action IN ('Create', 'Update', 'StatusChange', 'Archive', 'Restore')),
            change_summary TEXT NOT NULL,
            before_snapshot TEXT,
            after_snapshot TEXT,
            correlation_id TEXT,
            created_at TEXT NOT NULL,
            FOREIGN KEY(actor_user_id) REFERENCES users(id)
          )
        `);
                // DocumentMetadata table
                this.db.run(`
          CREATE TABLE IF NOT EXISTS document_metadata (
            id TEXT PRIMARY KEY,
            contract_id TEXT NOT NULL,
            file_name TEXT NOT NULL,
            file_type TEXT NOT NULL,
            storage_pointer TEXT NOT NULL,
            uploaded_by TEXT NOT NULL,
            uploaded_at TEXT NOT NULL,
            version_number INTEGER DEFAULT 1,
            document_category TEXT,
            checksum TEXT,
            file_size INTEGER,
            source_system TEXT,
            FOREIGN KEY(contract_id) REFERENCES contracts(id),
            FOREIGN KEY(uploaded_by) REFERENCES users(id)
          )
        `, (err) => {
                    if (err)
                        reject(err);
                    else
                        resolve();
                });
            });
        });
    }
    run(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, (err) => {
                if (err)
                    reject(err);
                else
                    resolve();
            });
        });
    }
    get(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err, row) => {
                if (err)
                    reject(err);
                else
                    resolve(row);
            });
        });
    }
    all(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err)
                    reject(err);
                else
                    resolve(rows || []);
            });
        });
    }
    close() {
        return new Promise((resolve, reject) => {
            this.db.close((err) => {
                if (err)
                    reject(err);
                else
                    resolve();
            });
        });
    }
}
exports.Database = Database;
exports.database = new Database();
//# sourceMappingURL=database.js.map