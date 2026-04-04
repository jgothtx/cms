# Contract Management System

Web-based contract management system for a Vendor Management Office (VMO). Tracks vendor contracts, key dates, compliance obligations, and renewal risk.

## Tech Stack

- **Frontend:** Vue 3 + TypeScript + Vuetify 3 (Vite)
- **Backend:** Node.js + Express + TypeScript
- **Database:** SQLite (via better-sqlite3)
- **OCR:** Anthropic Claude API (contract upload extraction)

## Prerequisites

- Node.js 20+ (managed via nvm — `.nvmrc` included)
- Docker (optional, for containerized deployment)

## Quick Start

```bash
make install   # Install all dependencies
make seed      # Create database with sample data
make dev       # Start backend (3001) + frontend (5173)
```

Open http://localhost:5173

## Make Targets

```
make help           Show all targets
make install        Install all dependencies
make dev            Run backend and frontend concurrently
make dev-backend    Run backend only
make dev-frontend   Run frontend only
make build          Build frontend for production
make seed           Re-seed the database (deletes existing data)
make clean          Remove build artifacts and databases
make reset          Clean, reinstall, and re-seed
make test           Run backend type-check and frontend build check
make docker         Build Docker image
make docker-run     Run Docker container
make docker-stop    Stop and remove Docker container
```

## OCR Contract Upload

Upload scanned contracts (PNG, JPEG, WebP, PDF) for AI-powered data extraction. Requires an Anthropic API key.

1. Get an API key from [console.anthropic.com](https://console.anthropic.com)
2. Add credits to your account under Settings > Billing
3. Create `backend/.env`:
   ```
   ANTHROPIC_API_KEY=sk-ant-...
   ```

OpenAI is also supported — set `OPENAI_API_KEY` in the same `.env` file.

## Docker

```bash
make docker         # Build image
make docker-run     # Run (reads backend/.env for API keys)
make docker-stop    # Stop container
```

The container serves the full app on port 3001. Database and uploads are persisted in Docker volumes.

## Dev Auth

In development, the app uses header-based auth (no JWT required). Switch roles via the user menu in the top-right corner:

- **Admin** — full access, can restore archived contracts and delete vendors
- **Contract Manager** — CRUD on contracts/vendors/reminders
- **Viewer** — read-only

## Features

- Dashboard with portfolio metrics and expiry buckets
- Contract CRUD with multi-section forms (core info, dates, financials, risk/compliance, obligations)
- Vendor management with duplicate name prevention
- Searchable/filterable contract and vendor lists
- Contract archive/restore lifecycle
- Reminder system with overdue tracking
- Activity audit log
- CSV export
- OCR-driven contract upload with AI extraction
- Role-based access control

## Project Structure

```
backend/
  src/
    index.ts          Express server entry point
    database.ts       SQLite schema and initialization
    models.ts         TypeScript interfaces
    repositories.ts   Data access layer
    routes.ts         REST API endpoints
    auth.ts           JWT auth and role middleware
    ocr.ts            OCR extraction (Anthropic/OpenAI)
    seed.ts           Sample data seeder
frontend/
  src/
    main.ts           Vue app setup (Vuetify, Router, Pinia)
    router.ts         Route definitions
    App.vue           App shell with navigation drawer
    services/api.ts   Axios API client
    views/
      Dashboard.vue       Portfolio overview
      ContractList.vue    Searchable contract table
      ContractDetail.vue  Multi-section contract view
      ContractForm.vue    Contract create/edit form
      ContractUpload.vue  OCR upload page
      VendorList.vue      Vendor table
      VendorDetail.vue    Vendor profile view
      VendorForm.vue      Vendor create/edit form
      Reminders.vue       Cross-contract reminder view
      Activity.vue        Audit event log
      Archive.vue         Archived/expired contracts
      Admin.vue           User and reference data admin
```
