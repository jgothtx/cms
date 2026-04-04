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

### Out of Scope (MVP)
- E-signature workflow integration
- AI clause extraction
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

### FR-3 Contract Management
- Create/edit contract with:
  - Contract title (required)
  - Vendor (required)
  - Contract owner (required)
  - Start date, end date (required)
  - Auto-renew boolean
  - Notice period days
  - Contract value and currency
  - Status (Draft, Under Review, Active, Expiring Soon, Expired, Terminated)
  - Compliance flags (Insurance, SOC2, Data Processing Agreement)
  - Notes
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
- Export current contract list to CSV
- Display simple summary table on dashboard

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
- Contract owner user id
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

### DR-2 Vendor Entity
System must store vendor profile fields.

Required fields:
- Vendor id (system-generated)
- Vendor legal name
- Vendor status (Active, Inactive)
- Risk tier
- Created at
- Updated at

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
- Archived contracts cannot be edited except by Admin restore action
- All stored timestamps must be UTC

## 8. Acceptance Criteria
1. User can create a vendor and create a contract linked to that vendor.
2. Dashboard correctly shows counts and expiring buckets.
3. Contract list supports search and filter simultaneously.
4. Expired and expiring contracts are visually distinct.
5. CSV export downloads the currently filtered list.
6. Activity log updates when contract changes are saved.

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
  - `GET/POST /api/vendors`
  - `GET/PATCH/DELETE /api/vendors/:id`
  - `GET/POST /api/contracts`
  - `GET/PATCH/DELETE /api/contracts/:id`
  - `GET/POST /api/contracts/:id/reminders`
  - `PATCH /api/reminders/:id`
  - `GET /api/dashboard/summary`
  - `GET /api/contracts/export.csv`
- API responses should include validation errors with field-level details.
- List endpoints should support pagination, filtering, and sorting.

## 12. Authorization Rules (MVP)
- Admin: full CRUD on users, vendors, contracts, reminders.
- Contract Manager: CRUD vendors/contracts/reminders, no user administration.
- Viewer: read-only access to dashboard, vendors, contracts, reminders.
- Every modifying API call must enforce role checks.
- API authentication uses JWT tokens in the Authorization header.
- JWT validation must be implemented behind a provider abstraction so Okta integration can be enabled without changing authorization logic.

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
