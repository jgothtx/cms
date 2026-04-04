import { getDb } from './database';
import { v4 as uuid } from 'uuid';

function now() { return new Date().toISOString().replace('T', ' ').substring(0, 19); }
function daysFromNow(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

export function seed() {
  const db = getDb();

  // Check if data already exists
  const vendorCount = (db.prepare('SELECT COUNT(*) as cnt FROM vendors').get() as any).cnt;
  if (vendorCount > 0) return;

  const ts = now();

  // Users
  const users = [
    { id: uuid(), display_name: 'Alice Admin', email: 'alice@example.com', role: 'Admin', auth_subject_id: 'admin-001' },
    { id: uuid(), display_name: 'Bob Manager', email: 'bob@example.com', role: 'Contract Manager', auth_subject_id: 'manager-001' },
    { id: uuid(), display_name: 'Carol Viewer', email: 'carol@example.com', role: 'Viewer', auth_subject_id: 'viewer-001' },
  ];
  for (const u of users) {
    db.prepare('INSERT INTO users (id, display_name, email, role, auth_subject_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)').run(u.id, u.display_name, u.email, u.role, u.auth_subject_id, ts, ts);
  }

  // Vendors
  const vendors = [
    { id: uuid(), legal_name: 'Acme Cloud Services', category: 'Cloud Infrastructure', risk_tier: 'Low', primary_contact_name: 'John Smith', primary_contact_email: 'john@acme.com', primary_contact_phone: '555-0101', country: 'US', website: 'https://acme.com' },
    { id: uuid(), legal_name: 'DataSecure Inc.', category: 'Security', risk_tier: 'Medium', primary_contact_name: 'Sarah Connor', primary_contact_email: 'sarah@datasecure.io', primary_contact_phone: '555-0102', country: 'US', website: 'https://datasecure.io' },
    { id: uuid(), legal_name: 'GlobalConsult Partners', category: 'Consulting', risk_tier: 'Low', primary_contact_name: 'James Lee', primary_contact_email: 'james@globalconsult.com', primary_contact_phone: '555-0103', country: 'UK' },
    { id: uuid(), legal_name: 'TechStar Solutions', category: 'Software', risk_tier: 'High', primary_contact_name: 'Maria Garcia', primary_contact_email: 'maria@techstar.com', primary_contact_phone: '555-0104', country: 'US' },
    { id: uuid(), legal_name: 'Nordic Analytics AB', category: 'Data Analytics', risk_tier: 'Medium', primary_contact_name: 'Erik Johansson', primary_contact_email: 'erik@nordic.se', primary_contact_phone: '+46-555-0105', country: 'SE' },
    { id: uuid(), legal_name: 'Pacific Legal Services', category: 'Legal', risk_tier: 'Low', primary_contact_name: 'Yuki Tanaka', primary_contact_email: 'yuki@pacificlegal.com', primary_contact_phone: '555-0106', country: 'JP' },
  ];
  for (const v of vendors) {
    db.prepare('INSERT INTO vendors (id, legal_name, dba_name, status, category, risk_tier, primary_contact_name, primary_contact_email, primary_contact_phone, country, website, created_at, updated_at) VALUES (?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(v.id, v.legal_name, 'Active', v.category, v.risk_tier, v.primary_contact_name, v.primary_contact_email, v.primary_contact_phone, v.country, v.website || null, ts, ts);
  }

  // Contracts
  const contracts = [
    { id: uuid(), title: 'Cloud Hosting Agreement', vendor_id: vendors[0].id, contract_owner: 'alice@example.com', status: 'Active', start_date: '2024-01-01', end_date: daysFromNow(45), contract_type: 'Service Agreement', contract_value: 120000, currency: 'USD', billing_frequency: 'Monthly', risk_tier: 'Low', auto_renew: 1, initial_term_months: 24, renewal_term_months: 12, notice_period_days: 60, data_classification: 'Confidential', soc2_required: 1, description: 'Primary cloud hosting for production workloads' },
    { id: uuid(), title: 'Security Monitoring SLA', vendor_id: vendors[1].id, contract_owner: 'bob@example.com', status: 'Active', start_date: '2024-03-15', end_date: daysFromNow(20), contract_type: 'SLA', contract_value: 85000, currency: 'USD', billing_frequency: 'Quarterly', risk_tier: 'High', auto_renew: 0, initial_term_months: 12, notice_period_days: 30, data_classification: 'Restricted', insurance_required: 1, soc2_required: 1, dpa_required: 1, description: 'SOC monitoring and incident response' },
    { id: uuid(), title: 'Strategic Consulting Engagement', vendor_id: vendors[2].id, contract_owner: 'alice@example.com', status: 'Under Review', start_date: '2025-01-01', end_date: daysFromNow(180), contract_type: 'Consulting', contract_value: 250000, currency: 'GBP', billing_frequency: 'Monthly', risk_tier: 'Medium', auto_renew: 0, description: 'Digital transformation advisory' },
    { id: uuid(), title: 'Enterprise CRM License', vendor_id: vendors[3].id, contract_owner: 'bob@example.com', status: 'Active', start_date: '2023-06-01', end_date: daysFromNow(-10), contract_type: 'Software License', contract_value: 75000, currency: 'USD', billing_frequency: 'Annual', risk_tier: 'High', auto_renew: 1, renewal_term_months: 12, notice_period_days: 90, soc2_required: 1, description: 'CRM platform for sales operations' },
    { id: uuid(), title: 'Data Analytics Platform', vendor_id: vendors[4].id, contract_owner: 'alice@example.com', status: 'Active', start_date: '2024-06-01', end_date: daysFromNow(75), contract_type: 'SaaS Subscription', contract_value: 45000, currency: 'EUR', billing_frequency: 'Annual', risk_tier: 'Medium', auto_renew: 1, initial_term_months: 24, notice_period_days: 45, data_classification: 'Internal', description: 'BI and analytics tooling' },
    { id: uuid(), title: 'Legal Retainer Agreement', vendor_id: vendors[5].id, contract_owner: 'carol@example.com', status: 'Draft', start_date: daysFromNow(10), end_date: daysFromNow(375), contract_type: 'Retainer', contract_value: 60000, currency: 'USD', billing_frequency: 'Monthly', risk_tier: 'Low', auto_renew: 0, description: 'Outside counsel for regulatory compliance' },
    { id: uuid(), title: 'Cloud DR Addendum', vendor_id: vendors[0].id, contract_owner: 'alice@example.com', status: 'Active', start_date: '2024-04-01', end_date: daysFromNow(45), contract_type: 'Addendum', contract_value: 30000, currency: 'USD', billing_frequency: 'Monthly', risk_tier: 'Low', auto_renew: 1, description: 'Disaster recovery add-on to cloud hosting' },
    { id: uuid(), title: 'Penetration Testing Services', vendor_id: vendors[1].id, contract_owner: 'bob@example.com', status: 'Expired', start_date: '2023-01-01', end_date: '2024-12-31', contract_type: 'Service Agreement', contract_value: 40000, currency: 'USD', billing_frequency: 'Semi-Annual', risk_tier: 'High', auto_renew: 0, insurance_required: 1, description: 'Annual penetration testing and vulnerability assessment' },
  ];

  // Set parent for DR addendum
  (contracts[6] as any).parent_contract_id = contracts[0].id;

  for (const c of contracts as any[]) {
    db.prepare(`INSERT INTO contracts (id, title, vendor_id, contract_owner, status, start_date, end_date, contract_type, contract_value, currency, billing_frequency, risk_tier, auto_renew, initial_term_months, renewal_term_months, notice_period_days, data_classification, insurance_required, soc2_required, dpa_required, description, parent_contract_id, created_by, updated_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
      c.id, c.title, c.vendor_id, c.contract_owner, c.status, c.start_date, c.end_date,
      c.contract_type, c.contract_value, c.currency, c.billing_frequency, c.risk_tier,
      c.auto_renew || 0, c.initial_term_months || null, c.renewal_term_months || null,
      c.notice_period_days || null, c.data_classification || null, c.insurance_required || 0,
      c.soc2_required || 0, c.dpa_required || 0, c.description || null, c.parent_contract_id || null,
      users[0].id, users[0].id, ts, ts
    );
  }

  // Reminders
  const reminders = [
    { contract_id: contracts[0].id, reminder_date: daysFromNow(15), reminder_type: 'Renewal Review', owner_user_id: users[0].id, reminder_note: 'Review cloud hosting renewal terms before auto-renew' },
    { contract_id: contracts[1].id, reminder_date: daysFromNow(5), reminder_type: 'Expiration Warning', owner_user_id: users[1].id, reminder_note: 'Security monitoring contract expiring soon - negotiate renewal' },
    { contract_id: contracts[3].id, reminder_date: daysFromNow(-5), reminder_type: 'Overdue Renewal', owner_user_id: users[1].id, reminder_note: 'CRM license expired - urgent renewal needed' },
    { contract_id: contracts[4].id, reminder_date: daysFromNow(30), reminder_type: 'Budget Review', owner_user_id: users[0].id, reminder_note: 'Confirm analytics budget for next fiscal year' },
  ];
  for (const r of reminders) {
    db.prepare('INSERT INTO reminders (id, contract_id, reminder_date, reminder_type, owner_user_id, completed, reminder_note, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 0, ?, ?, ?)').run(uuid(), r.contract_id, r.reminder_date, r.reminder_type, r.owner_user_id, r.reminder_note, ts, ts);
  }

  // Activity events
  for (const c of contracts) {
    db.prepare("INSERT INTO activity_events (id, timestamp, actor_user_id, entity_type, entity_id, action, change_summary) VALUES (?, datetime('now'), ?, 'Contract', ?, 'Create', ?)").run(uuid(), users[0].id, c.id, `Created contract: ${c.title}`);
  }
  for (const v of vendors) {
    db.prepare("INSERT INTO activity_events (id, timestamp, actor_user_id, entity_type, entity_id, action, change_summary) VALUES (?, datetime('now'), ?, 'Vendor', ?, 'Create', ?)").run(uuid(), users[0].id, v.id, `Created vendor: ${v.legal_name}`);
  }

  console.log('Seed data created successfully');
}

// Run if called directly
seed();
