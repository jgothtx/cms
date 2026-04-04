# Contract Management Build Tasks

## 1. Delivery Rules
- Do not begin implementation until explicit go-ahead from stakeholder.
- Every implementation task must include tests.
- No feature is complete until required tests pass in CI.
- Use UTC for all persisted timestamps and date calculations.

## 2. Phase 0: Project Setup

### 2.1 Repository Structure
- Create frontend application (Vue 3 + TypeScript + Vuetify).
- Create backend application (Node.js + Express + TypeScript).
- Create shared docs folder for API contracts and architecture notes.

Tests required:
- Backend: baseline test runner configured and example test passing.
- Frontend: baseline unit test runner configured and example test passing.
- CI: pipeline job runs frontend and backend test commands.

### 2.2 Tooling and Quality Gates
- Configure linting and formatting for frontend/backend.
- Configure type-check scripts for frontend/backend.
- Add pre-commit or CI checks for lint + type-check + tests.

### 2.3 Cypress Test Harness
- Install and configure Cypress for end-to-end testing.
- Create deterministic test seed/reset script for local and CI runs.
- Add Cypress environment configuration for base URL, auth fixtures, and role-based test users.
- Add scripts for headless and interactive Cypress runs.

Tests required:
- Failing lint rule must fail CI.
- Type error must fail CI.
- Cypress smoke spec runs in CI and fails build on any test failure.

## 3. Phase 1: Backend Foundation

### 3.1 Core Backend Modules
- Create backend folders: routes, controllers, services, repositories, middleware, validators, models.
- Implement health endpoint.
- Implement standardized error response format.

Tests required:
- Health endpoint returns 200 and expected payload.
- Error middleware returns structured validation and server error responses.

### 3.2 Persistence Layer
- Implement SQLite storage and migration scripts.
- Create repository interfaces to abstract persistence implementation.
- Add seed data scripts.

Tests required:
- Repository CRUD tests for all entities.
- Migration test validates schema can be created from scratch.
- Seed script test verifies required minimum sample data.

## 4. Phase 2: Security and Authorization

### 4.1 JWT Authentication
- Implement JWT validation middleware.
- Support provider abstraction for future Okta integration.
- Map role claims to application roles.

Tests required:
- Reject missing token.
- Reject invalid token.
- Accept valid token with expected claims.

### 4.2 RBAC Enforcement
- Enforce role checks for all modifying endpoints.
- Enforce read-only behavior for Viewer role.

Tests required:
- Admin can perform all write actions.
- Contract Manager can write contract/vendor/reminder resources.
- Viewer cannot write and receives authorization error.

## 5. Phase 3: Data Model and Validation

### 5.1 Entity Schemas
- Implement data models for Contract, Vendor, User, Reminder, ActivityEvent, DocumentMetadata.
- Add controlled enums and value constraints.

Tests required:
- Model validation tests for required fields.
- Enum rejection tests for invalid status/risk values.

### 5.2 Business Validation
- Enforce end date after start date.
- Enforce non-negative contract value.
- Enforce vendor foreign key existence.
- Enforce archived contract edit restrictions.

Tests required:
- Validation tests for each business rule.
- API tests verify invalid requests return field-level errors.

## 6. Phase 4: API Implementation

### 6.1 Vendor APIs
- Implement GET/POST /api/vendors.
- Implement GET/PATCH/DELETE /api/vendors/:id.

Tests required:
- CRUD contract tests for happy paths and not-found cases.
- Filter/sort tests for list endpoint.

### 6.2 Contract APIs
- Implement GET/POST /api/contracts.
- Implement GET/PATCH/DELETE /api/contracts/:id.
- Implement archive and restore behavior.

Tests required:
- CRUD tests with role-based authorization coverage.
- Archive behavior tests including Admin-only restore behavior.

### 6.3 Reminder APIs
- Implement GET/POST /api/contracts/:id/reminders.
- Implement PATCH /api/reminders/:id.

Tests required:
- Reminder create/update tests.
- Reminder completion workflow tests.

### 6.4 Dashboard and Export APIs
- Implement GET /api/dashboard/summary.
- Implement GET /api/contracts/export.csv.

Tests required:
- Dashboard aggregation tests for status/expiry/risk counts.
- CSV export tests verifying filtered output and RFC4180 formatting.

## 7. Phase 5: Audit and Activity Logging
- Implement append-only activity event writes for create/update/status/archive actions.
- Include actor, timestamp, action, entity type/id, and change summary.

Tests required:
- Activity event generated for each audited action.
- Event immutability test (no update/delete path exposed).

## 8. Phase 6: Frontend Foundation (Vue)

### 8.1 App Shell
- Build app layout, navigation, and role-aware route guards.
- Configure API client with JWT bearer token handling.

Tests required:
- Route guard tests by role.
- API client unit tests for auth header injection and error handling.

### 8.2 Shared UI and State
- Build reusable table, filter panel, Vuetify form controls, and alert components.
- Implement state management for contracts/vendors/reminders/dashboard.
- Ensure dropdown/select components support search/typeahead where option sets are non-trivial.

Tests required:
- Component rendering tests.
- State store tests for loading, success, and error states.
- Searchable select tests verify option filtering and keyboard selection behavior.

## 9. Phase 7: Frontend Features

### 9.1 Dashboard UI
- Show active totals, expiring 30/60/90 buckets, status summary, high-risk counts.

Tests required:
- Dashboard component tests for computed display values.
- Cypress end-to-end dashboard load test.

### 9.2 Vendor UI
- Vendor list, create, and edit screens.

Tests required:
- Form validation tests.
- Cypress end-to-end create/edit vendor flow.

### 9.3 Contract UI
- Contract list with search/filter/sort.
- Contract create/edit with required fields and validation.
- Visual indicators for expiring and expired contracts.

Tests required:
- Unit tests for filter and sort behavior.
- Form validation tests.
- Cypress end-to-end contract creation and update flow.

### 9.4 Reminder UI
- Create and manage contract reminders.
- Mark reminders completed.

Tests required:
- Reminder UI interaction tests.
- Cypress end-to-end reminder create/complete flow.

### 9.5 Activity and Export UI
- Contract activity timeline display.
- CSV export action for filtered contract list.

Tests required:
- Activity timeline render tests.
- Cypress end-to-end export test verifies file download trigger and API call parameters.

## 10. Phase 8.5: Cypress Functional Validation Suite

### 10.5.1 Core Workflow Specs
- Implement Cypress specs for:
  - Login bootstrap using JWT test fixture.
  - Vendor creation and editing.
  - Contract creation linked to vendor.
  - Contract search + multi-filter behavior.
  - Expiring and expired visual indicators.
  - Reminder create and completion flow.
  - Activity log updates after contract changes.
  - Filtered CSV export flow.

Tests required:
- All core workflow specs pass in headed and headless modes.
- Cypress tests run independently with isolated test data.

### 10.5.2 Authorization Specs
- Implement Cypress role coverage for Admin, Contract Manager, and Viewer.
- Validate UI and API denial handling for unauthorized actions.

Tests required:
- Viewer cannot access write flows in UI.
- Unauthorized API responses are handled and displayed correctly.

### 10.5.3 CI Execution and Artifacts
- Run Cypress in CI on pull requests and main branch.
- Capture screenshots and videos for failed specs.
- Publish Cypress test report artifact for each CI run.

Tests required:
- CI pipeline fails when any Cypress spec fails.
- Failed run exposes screenshots/videos in CI artifacts.

## 10. Phase 8: Integration and Non-Functional Validation

### 10.1 Performance
- Validate dashboard and contract list response times for target dataset.

Tests required:
- Scripted performance checks for <= 2s target under mock load.

### 10.2 Reliability and Error Handling
- Validate empty states, API failure states, and retry behavior.

Tests required:
- API integration failure tests.
- UI error state tests.

### 10.3 Security
- Validate unauthorized access handling and role boundaries.

Tests required:
- Security integration tests for protected endpoints.
- Frontend route access tests.

## 11. Phase 9: Final Acceptance and Release Readiness
- Execute all acceptance criteria from requirements.
- Produce test report and traceability matrix mapping requirements to tests.
- Prepare release checklist and rollback plan.

Tests required:
- Full regression suite pass.
- Cypress end-to-end acceptance scenarios:
  - Create vendor and linked contract.
  - Validate dashboard expiring buckets.
  - Validate combined search + filter.
  - Validate expiring/expired visual distinction.
  - Validate filtered CSV export.
  - Validate activity log updates on contract save.

## 12. Definition of Done
- All scoped requirements implemented.
- All required tests implemented and passing.
- No critical or high severity defects open.
- API and UI behavior documented.
- Build reproducible from clean environment.
