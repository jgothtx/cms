# Contract Management Site Requirements (Vendor Management Office)

## 1. Purpose
Build a web-based contract management system for a Vendor Management Office (VMO) to track vendor contracts, key dates, compliance obligations, and renewal risk.

## 2. Scope
This phase delivers an MVP focused on contract intake, tracking, reminders, and reporting visibility.

### In Scope (MVP)
- Contract record creation and editing
- Vendor profile management
- Contract status lifecycle tracking
- Renewal and expiration alerts
- Search, filter, and sort contracts
- Dashboard with portfolio metrics
- Basic user roles (Admin, Contract Manager, Viewer)
- Activity log on contract changes
- Document metadata tracking (not full DMS)
- OCR-driven contract upload with AI extraction (OpenAI / Anthropic)
- Soft-delete semantics for contracts (archive) and vendors (deactivate)
- Duplicate vendor name prevention (case-insensitive)
- Contract archive and restore lifecycle
- Vendor deactivate action separate from delete
- Contract and vendor detail (read-only) screens

### Out of Scope (MVP)
- E-signature workflow integration
- ERP/Procurement integrations
- Full legal redlining workflow
- Full production Okta tenant setup and SSO hardening (API auth must be JWT-based and Okta-compatible)

## 3. Users and Roles
- Admin: Manage users, all contracts, settings
- Contract Manager: Create and update contracts, manage reminders
- Viewer: Read-only access to contracts and dashboard

## 4. Functional Requirements

### FR-1 Dashboard
- Show total active contracts
- Show contracts expiring in 30/60/90 days
- Show contracts by status and by vendor
- Show high-risk contracts flag count

### FR-2 Vendor Management
- Create/edit vendor profile with:
  - Vendor name (required)
  - Primary contact
  - Email and phone
  - Category
  - Risk tier (Low, Medium, High)
- Vendor legal name must be unique (case-insensitive, trimmed). Duplicate creation returns 409 Conflict.
- On application startup, existing duplicate vendor names are de-duplicated before the unique index is applied.
- Delete vendor (Admin only): sets vendor status to Inactive (soft delete). Does not remove the record.
- Deactivate vendor (Writer role): sets vendor status to Inactive. If already Inactive, returns the vendor unchanged.
- Vendor detail page: read-only view showing all profile fields with an edit link for authorized users.
- Vendor edit page loads existing vendor data into the form.

### FR-3 Contract Management
- Create/edit contract with:
  - Contract title (required)
  - Vendor (required, searchable autocomplete)
  - Contract owner (required, free-text name or email)
  - Start date, end date (required)
  - External reference id
  - Contract type
  - Description
  - Parent contract (searchable autocomplete)
  - Effective date, signature date, termination date
  - Initial term months, renewal term months
  - Auto-renew boolean
  - Notice period days
  - Contract value and currency
  - Billing frequency
  - Payment terms
  - Cost center code, spend category
  - Price escalation terms
  - Risk tier
  - Data classification
  - Compliance flags (Insurance, SOC2, Data Processing Agreement)
  - Audit rights flag
  - Compliance exceptions, regulatory tags
  - Key obligations, SLA terms, service credits terms
  - Notes
  - Status (Draft, Under Review, Active, Expiring Soon, Expired, Terminated)
- Contract form is organized into sections: Core Information, Dates and Term, Financials, Risk and Compliance, Obligations and Notes.
- Contract edit page loads existing contract data into the form.
- Contract detail page: multi-section read-only view showing all stored fields with an edit link for authorized users.
- Delete contract (Writer role): soft-deletes by setting `archived=true` and `status='Archived'`.
- Archive contract (Writer role): explicitly archives a contract via `POST /contracts/:id/archive`. Sets `archived=true` but preserves the current status value.
- Restore contract (Admin only): restores an archived contract via `POST /contracts/:id/restore`. Sets `archived=false` and resets `status` to `Draft`.
- Soft-delete/archive contracts

### FR-4 Search and Filtering
- Full text search by title/vendor
- Filters by status, vendor, owner, risk tier, expiry window
- Sort by end date, value, vendor, and status

### FR-5 Alerts and Reminders
- Compute contracts expiring in 30/60/90 days
- Highlight overdue contracts (end date in past)
- Support reminder entries tied to contracts:
  - Reminder date
  - Reminder type
  - Owner
  - Completed/not completed

### FR-6 Activity Log
- Track timestamped events for create/update/status change
- Record actor name and change summary

### FR-7 Reporting (MVP)
- Export current contract list to CSV via `GET /api/contracts/export.csv`.
  - Exported columns: id, title, vendor_id, contract_owner, status, start_date, end_date, contract_value, currency, risk_tier, auto_renew.
  - Archived contracts are excluded from the export.
- Display simple summary table on dashboard

### FR-8 OCR Contract Upload
- Upload a scanned contract image (PNG, JPEG, WebP) or PDF via a dedicated upload page.
- File size limit: 10 MB.
- OCR extraction is performed by OpenAI or Anthropic, configured via backend environment variables:
  - `OPENAI_API_KEY` and optional `OPENAI_OCR_MODEL` (default: `gpt-4.1-mini`)
  - `ANTHROPIC_API_KEY` and optional `ANTHROPIC_OCR_MODEL` (default: `claude-3-5-sonnet-latest`)
- Provider selection: user may choose Auto, OpenAI, or Anthropic. Auto selects the first configured provider; PDF uploads prefer Anthropic when available.
- The OCR model is instructed to return a strict JSON spec matching the contract, vendor, relationship, and document metadata schemas. The extraction spec is available via `GET /api/contracts/upload/spec`.
- Extracted values are normalized: dates to YYYY-MM-DD, booleans to true/false, risk tier to Low/Medium/High, status to the controlled enum, currency amounts cleaned of formatting.
- Vendor resolution: the extracted vendor legal name is matched (case-insensitive) against existing vendors. If no match, a new Active vendor is created automatically with all extracted profile fields.
- Parent contract resolution: if the OCR output includes a parent contract reference, the system attempts to resolve it by id, external reference id, or exact title match.
- On successful extraction: a contract record, document metadata row, and optionally a new vendor are created in a single request.
- The uploaded file is saved to disk under `uploads/contracts/{contractId}/` with a SHA-256 checksum stored in document metadata.
- The response includes the created contract, vendor, document metadata, raw extracted JSON, provider used, and relation resolution results.
- If the OCR output fails contract validation (e.g., missing required fields), a 422 response is returned with the extracted data and validation errors so the user can see what was extracted.
- The upload page displays: file input, provider selector, the expected JSON spec, and after submission shows created records, links to the contract and vendor, and the raw extracted JSON.
- Upload requires Writer role (Admin or Contract Manager).
- Navigation: the upload page is accessible from the sidebar and from an "Upload Contract" button on the contract list page.

## 5. Non-Functional Requirements
- Usability: Responsive UI for desktop and tablet
- Performance: Main list and dashboard load under 2 seconds for <= 5,000 contracts (mock target)
- Security: Role-based authorization checks in app layer
- Reliability: Validate required fields and date logic
- Maintainability: Modular components and typed models
- Frontend UI component library: Vuetify
- All dropdown/select inputs with non-trivial option sets must support search/typeahead

## 6. Data Storage Requirements (MVP)

### DR-1 Contract Entity
System must store the following contract fields.

Required fields:
- Contract id (system-generated)
- Contract title
- Vendor id (foreign key)
- Contract owner (free-text name or email; not a user foreign key)
- Start date
- End date
- Status
- Created at
- Created by
- Updated at
- Updated by

Optional fields:
- External contract reference id
- Contract type
- Description or summary
- Parent contract id
- Effective date
- Signature date
- Initial term months
- Auto renew flag
- Renewal term months
- Notice period days
- Termination date
- Contract value
- Currency
- Billing frequency
- Payment terms
- Cost center code
- Spend category
- Price escalation terms
- Risk tier
- Data classification
- Compliance flags:
  - Insurance required
  - SOC2 required
  - Data processing agreement required
- Compliance exceptions text
- Regulatory tags
- Key obligations text
- SLA terms
- Service credits terms
- Audit rights flag
- Notes
- Archive flag
- Archived at
- Archived by

Controlled enums:
- Status: Draft, Under Review, Active, Expiring Soon, Expired, Terminated, Archived
- Risk tier: Low, Medium, High
- Billing frequency: Monthly, Quarterly, Semi-Annual, Annual, One-Time, Usage-Based
- Data classification: Public, Internal, Confidential, Restricted

### DR-2 Vendor Entity
System must store vendor profile fields.

Required fields:
- Vendor id (system-generated)
- Vendor legal name (unique, case-insensitive)
- Vendor status (Active, Inactive)
- Risk tier
- Created at
- Updated at

Constraints:
- Unique index on `lower(trim(legal_name))`. On startup, existing duplicates are removed (keeping the earliest record) before the index is applied.

Optional fields:
- DBA name
- Vendor category
- Tax id or registration number
- Website
- Primary contact name
- Primary contact email
- Primary contact phone
- Billing contact name
- Billing contact email
- Billing address
- Country
- Performance rating
- Notes

### DR-3 User Entity
System must store minimum user and authorization attributes.

Required fields:
- User id (system-generated)
- Display name
- Email
- Role (Admin, Contract Manager, Viewer)
- Auth subject id from JWT token
- Created at
- Updated at

Optional fields:
- Department
- Title
- Active flag

### DR-4 Reminder Entity
System must store reminders tied to contracts.

Required fields:
- Reminder id (system-generated)
- Contract id
- Reminder date (UTC)
- Reminder type
- Owner user id
- Completed flag
- Created at
- Updated at

Optional fields:
- Completion timestamp
- Reminder note

### DR-5 ActivityEvent Entity
System must store append-only audit activity.

Required fields:
- Event id (system-generated)
- Timestamp (UTC)
- Actor user id
- Entity type (Contract, Vendor, Reminder, User)
- Entity id
- Action (Create, Update, StatusChange, Archive, Restore)
- Change summary

Optional fields:
- Before snapshot reference
- After snapshot reference
- Correlation id

### DR-6 Document Metadata Entity
System must store metadata for contract files even if binary files are stored externally.

Required fields:
- Document id (system-generated)
- Contract id
- File name
- File type
- Storage pointer or URL
- Uploaded by
- Uploaded at
- Version number

Optional fields:
- Document category
- Checksum
- File size
- Source system

## 7. Validation Rules
- End date must be after start date
- Required fields must be enforced
- Status must be from controlled enum
- Reminder date cannot be empty
- Contract value cannot be negative
- Contract owner does not need to reference an active user account
- Vendor id must reference an existing vendor
- Archived contracts cannot be edited except by Admin restore action. Non-admin users who attempt to edit an archived contract receive a 403 response.
- All stored timestamps must be UTC
- Vendor legal name must be unique (case-insensitive, trimmed). Duplicate attempts return 409 Conflict with `field: 'legal_name'`.
- Parent contract id, when provided, must reference an existing contract. Self-referencing (parent_contract_id == contract id) is rejected on update.
- Vendor id must be validated on contract update as well as create.
- OCR upload: if extraction produces an invalid contract payload (missing required fields), the endpoint returns 422 with the extracted data and validation error details.

## 8. Acceptance Criteria
1. User can create a vendor and create a contract linked to that vendor.
2. Dashboard correctly shows counts and expiring buckets.
3. Contract list supports search and filter simultaneously.
4. Expired and expiring contracts are visually distinct.
5. CSV export downloads the currently filtered list.
6. Activity log updates when contract changes are saved.
7. Vendor with a duplicate legal name (case-insensitive) is rejected with a 409 response.
8. Deleting a vendor sets it to Inactive; deleting a contract archives it.
9. Contract detail page displays all stored contract fields across organized sections.
10. Contract edit page loads and hydrates existing contract data.
11. Vendor detail page displays all stored vendor profile fields.
12. Vendor edit page loads and hydrates existing vendor data.
13. Uploading a contract image or PDF via the upload form extracts structured data and creates the contract, vendor (if new), and document metadata.
14. OCR upload resolves parent contract references when the extracted data includes a matching id, external reference, or title.
15. Admin can restore an archived contract. Non-admins cannot.

## 9. Technical Delivery Approach
- Frontend: Vue 3 + TypeScript SPA using Vuetify.
- Backend: Node.js + Express REST API.
- Persistence for MVP: server-side JSON/file store or SQLite (implementation choice), with repository layer to allow future DB migration.
- Seed sample data to demonstrate workflows.

## 10. Build Plan
- Step 1: Scaffold web app project
- Step 2: Implement typed domain models and seed data
- Step 3: Build dashboard and contract list with filters
- Step 4: Build create/edit workflows for vendors/contracts
- Step 5: Add reminders, activity log, and CSV export
- Step 6: Validate against acceptance criteria

## 11. API Requirements (MVP)
- REST endpoints (minimum):
  - `GET /api/health` — unauthenticated health check
  - `GET/POST /api/vendors`
  - `GET/PATCH/DELETE /api/vendors/:id`
  - `POST /api/vendors/:id/deactivate` — sets vendor Inactive (Writer role)
  - `GET/POST /api/contracts`
  - `GET/PATCH/DELETE /api/contracts/:id`
  - `POST /api/contracts/:id/archive` — archives a contract (Writer role)
  - `POST /api/contracts/:id/restore` — restores an archived contract (Admin only)
  - `GET /api/contracts/upload/spec` — returns the OCR JSON extraction spec and configured providers (Writer role)
  - `POST /api/contracts/upload` — multipart file upload with OCR extraction, contract+vendor+document creation (Writer role)
  - `GET/POST /api/contracts/:id/reminders`
  - `PATCH /api/reminders/:id`
  - `GET /api/dashboard/summary`
  - `GET /api/contracts/export.csv`
- API responses should include validation errors with field-level details.
- List endpoints should support pagination, filtering, and sorting.
- Duplicate vendor creation returns 409 Conflict with field-level error.
- Contract delete returns the soft-deleted (archived) result.
- Vendor delete returns the updated vendor with Inactive status.

## 12. Authorization Rules (MVP)
- Admin: full CRUD on users, vendors, contracts, reminders. Only role that can delete vendors or restore archived contracts.
- Contract Manager: CRUD vendors/contracts/reminders (except vendor delete and contract restore), no user administration.
- Viewer: read-only access to dashboard, vendors, contracts, reminders.
- Every modifying API call must enforce role checks.
- Specific per-action role requirements:
  - Vendor create/update: Writer (Admin or Contract Manager)
  - Vendor delete (soft-delete to Inactive): Admin only
  - Vendor deactivate: Writer (Admin or Contract Manager)
  - Contract create/update: Writer
  - Contract delete (soft-delete via archive): Writer
  - Contract archive: Writer
  - Contract restore: Admin only
  - Contract upload (OCR): Writer
  - Reminder create/update: Writer
- API authentication uses JWT tokens in the Authorization header.
- JWT validation must be implemented behind a provider abstraction so Okta integration can be enabled without changing authorization logic.
- Authenticated users are automatically provisioned in the users table on first API request to ensure foreign key integrity for audit logging.

## 13. Audit and Data Handling
- Activity log events are append-only (no update/delete from UI).
- Log at minimum: timestamp, actor, entity type, entity id, action, changed fields summary.
- Soft-deleted contracts remain queryable by Admin via archive filter.

## 14. Open Decisions Before Build Complete
- Locked: SQLite for MVP persistence.
- Locked: JWT-based API auth with role claims, designed for future Okta integration.
- Locked: UTC as canonical timezone for date-based expiry logic.
- Open: required CSV columns and final export schema (RFC4180 CSV assumed).

## 15. Delivery Status Note
- Implementation is intentionally paused per stakeholder instruction.
- No frontend or backend scaffolding will begin until explicit approval to start build.

## 16. Screen Requirements (MVP)

### SR-1 Dashboard Screen
Purpose:
- Provide portfolio-level visibility for VMO users.

Required content:
- Total active contracts
- Contracts expiring in 30/60/90 days
- Expired contracts count
- High-risk contract or vendor count
- Status summary
- Recent activity summary

Primary actions:
- Navigate to contract list
- Navigate to vendor list
- Navigate to expiring contracts or reminders
- Start contract creation
- Start vendor creation

Role access:
- Admin, Contract Manager, Viewer

### SR-2 Contract List Screen
Purpose:
- Serve as the primary operational screen for locating and managing contracts.

Required content:
- Search bar for title/vendor
- Filter controls for status, vendor, owner, risk tier, expiry window, archive state
- Sortable results table
- Visual indicators for expiring and expired contracts
- CSV export action

Primary actions:
- Open contract detail
- Start contract creation
- Edit contract
- Export filtered results
- Archive contract (role permitting)

Role access:
- Admin, Contract Manager, Viewer

### SR-3 Contract Detail Screen
Purpose:
- Show complete contract information and related activity in one place.

Required content:
- Core contract data
- Dates and term information
- Commercial terms
- Risk and compliance fields
- Obligations and notes
- Related reminders
- Activity timeline
- Document metadata list

Primary actions:
- Edit contract
- Add reminder
- View audit history
- Archive or restore contract (role permitting)

Role access:
- Admin, Contract Manager, Viewer

### SR-4 Contract Create/Edit Screen
Purpose:
- Capture and maintain contract records.

Required content:
- Multi-section contract form
- Searchable select inputs for vendor, owner, and other lookup fields
- Inline validation messages
- Save and cancel actions

Primary actions:
- Create contract
- Update contract
- Save draft changes

Role access:
- Admin, Contract Manager

### SR-5 Vendor List Screen
Purpose:
- Allow users to locate and assess vendor records.

Required content:
- Vendor search
- Filters for status, category, and risk tier
- Vendor results table
- Contract count per vendor where available

Primary actions:
- Open vendor detail
- Start vendor creation
- Edit vendor

Role access:
- Admin, Contract Manager, Viewer

### SR-6 Vendor Detail Screen
Purpose:
- Show vendor profile, contacts, and associated contracts.

Required content:
- Vendor identity and status
- Contact information
- Risk and performance information
- Related contracts list
- Notes

Primary actions:
- Edit vendor
- Navigate to related contract records

Role access:
- Admin, Contract Manager, Viewer

### SR-7 Vendor Create/Edit Screen
Purpose:
- Capture and maintain vendor records.

Required content:
- Vendor profile form
- Contact fields
- Risk tier and category fields
- Save and cancel actions

Primary actions:
- Create vendor
- Update vendor

Role access:
- Admin, Contract Manager

### SR-8 Reminder / Task Screen
Purpose:
- Provide a cross-contract operational view of upcoming and overdue reminders.

Required content:
- Upcoming reminders list
- Overdue reminders list
- Completed reminders filter
- Related contract references

Primary actions:
- Create reminder
- Mark reminder complete
- Open related contract

Role access:
- Admin, Contract Manager, Viewer

### SR-9 Activity / Audit Screen
Purpose:
- Provide searchable audit visibility across system changes.

Required content:
- Activity event list
- Filters by entity type, actor, action, and date range
- Change summary display

Primary actions:
- Search and filter audit events
- Open related contract or vendor records

Role access:
- Admin, Contract Manager, Viewer

### SR-10 Archive / Expired Contracts Screen
Purpose:
- Provide focused review of expired, terminated, and archived contracts.

Required content:
- Archived and expired contract table
- Filter by archive state and status
- Restore action where allowed

Primary actions:
- Open contract detail
- Restore archived contract

Role access:
- Admin for restore actions
- Admin, Contract Manager, Viewer for read access if permitted by policy

### SR-11 Admin / Reference Data Screen
Purpose:
- Provide limited administration and lookup-data maintenance for MVP where required.

Required content:
- User and role overview
- Lookup/reference values used by forms and filters

Primary actions:
- View user roles
- Maintain allowed reference values if enabled in MVP

Role access:
- Admin
