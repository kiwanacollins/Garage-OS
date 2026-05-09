# GarageOS — Task List

**Source PRD:** [prd.md](../prd.md)
**Generated:** 9 May 2026

---

## Relevant Files

- `package.json` - Root monorepo package with Turborepo scripts
- `turbo.json` - Turborepo pipeline configuration
- `apps/web/` - Next.js 14 web application (Admin, Front Desk, Mechanic, Customer)
- `apps/api/` - Fastify REST API server
- `apps/api/src/server.ts` - Fastify server entry point
- `apps/api/src/plugins/auth.ts` - JWT auth and RBAC plugin
- `apps/api/src/plugins/auth.test.ts` - Tests for auth plugin
- `apps/api/src/routes/auth.ts` - Auth route handlers (login, register, refresh, forgot-password)
- `apps/api/src/routes/auth.test.ts` - Tests for auth routes
- `apps/api/src/routes/users.ts` - User CRUD route handlers
- `apps/api/src/routes/users.test.ts` - Tests for user routes
- `apps/api/src/routes/customers.ts` - Customer management routes
- `apps/api/src/routes/customers.test.ts` - Tests for customer routes
- `apps/api/src/routes/vehicles.ts` - Vehicle register routes
- `apps/api/src/routes/vehicles.test.ts` - Tests for vehicle routes
- `apps/api/src/routes/work-orders.ts` - Work order lifecycle routes
- `apps/api/src/routes/work-orders.test.ts` - Tests for work order routes
- `apps/api/src/routes/inspections.ts` - Inspection and diagnosis routes
- `apps/api/src/routes/inspections.test.ts` - Tests for inspection routes
- `apps/api/src/routes/labour-logs.ts` - Labour logging routes
- `apps/api/src/routes/labour-logs.test.ts` - Tests for labour log routes
- `apps/api/src/routes/parts-requests.ts` - Parts request routes
- `apps/api/src/routes/parts-requests.test.ts` - Tests for parts request routes
- `apps/api/src/routes/invoices.ts` - Invoice generation and management routes
- `apps/api/src/routes/invoices.test.ts` - Tests for invoice routes
- `apps/api/src/routes/payments.ts` - Payment processing routes
- `apps/api/src/routes/payments.test.ts` - Tests for payment routes
- `apps/api/src/routes/appointments.ts` - Appointment booking routes
- `apps/api/src/routes/appointments.test.ts` - Tests for appointment routes
- `apps/api/src/routes/suppliers.ts` - Supplier directory routes
- `apps/api/src/routes/purchase-orders.ts` - Purchase order routes
- `apps/api/src/routes/reports.ts` - Reporting and analytics routes
- `apps/api/src/routes/notifications.ts` - In-app notification routes
- `apps/api/src/routes/audit-logs.ts` - Audit log routes (admin only)
- `apps/api/src/middleware/rbac.ts` - Role-based access control middleware
- `apps/api/src/middleware/rbac.test.ts` - Tests for RBAC middleware
- `apps/api/src/middleware/audit.ts` - Audit trail middleware
- `apps/api/src/services/notification.service.ts` - Notification dispatch logic
- `apps/api/src/services/pdf.service.ts` - PDF generation for invoices and reports
- `apps/web/src/app/(auth)/login/page.tsx` - Login page
- `apps/web/src/app/(auth)/register/page.tsx` - Registration page
- `apps/web/src/app/(dashboard)/admin/page.tsx` - Admin dashboard
- `apps/web/src/app/(dashboard)/front-desk/page.tsx` - Front desk workspace
- `apps/web/src/app/(dashboard)/mechanic/page.tsx` - Mechanic job card view
- `apps/web/src/app/(portal)/customer/page.tsx` - Customer self-service portal
- `packages/shared-types/src/index.ts` - Shared TypeScript interfaces and enums
- `packages/validation/src/index.ts` - Shared Zod schemas
- `packages/db/prisma/schema.prisma` - Prisma database schema
- `packages/db/prisma/seed.ts` - Database seed script
- `packages/db/src/client.ts` - Prisma client singleton
- `packages/config/` - Shared ESLint, Prettier, TSConfig
- `workers/queue/src/index.ts` - BullMQ worker entry point
- `workers/queue/src/jobs/notification.job.ts` - SMS/WhatsApp/email notification job
- `workers/queue/src/jobs/pdf.job.ts` - PDF generation background job

### Notes

- Unit tests should be placed alongside the code files they test (e.g., `auth.ts` and `auth.test.ts` in the same directory).
- Use `npx vitest` to run unit/integration tests. Use `npx playwright test` for E2E browser tests.
- The project uses a Turborepo monorepo with `apps/web`, `apps/api`, shared `packages/`, and `workers/`.
- All API routes follow the pattern `/api/v1/<resource>` and require JWT auth except login/register.
- RBAC roles: `admin`, `mechanic`, `front_desk`, `customer`.

---

## Tasks

- [ ] 1.0 Project Scaffolding and Monorepo Setup
  - [ ] 1.1 Initialise the root monorepo with `package.json`, Turborepo (`turbo.json`), and shared TypeScript config
  - [ ] 1.2 Scaffold `apps/web` using Next.js 14 with App Router and TypeScript
  - [ ] 1.3 Scaffold `apps/api` using Fastify with TypeScript, Pino logger, and CORS/rate-limit plugins
  - [ ] 1.4 Create `packages/shared-types` with base TypeScript interfaces and role enums (`admin`, `mechanic`, `front_desk`, `customer`)
  - [ ] 1.5 Create `packages/validation` with Zod and export placeholder schemas
  - [ ] 1.6 Create `packages/db` with Prisma, configure PostgreSQL connection, and write the initial `schema.prisma` with all 15 entities from PRD §4
  - [ ] 1.7 Run `prisma migrate dev` to generate the initial migration and verify the database schema
  - [ ] 1.8 Create `packages/db/prisma/seed.ts` with sample data (admin user, test customer, test vehicle)
  - [ ] 1.9 Create `packages/config` with shared ESLint, Prettier, and TSConfig presets
  - [ ] 1.10 Scaffold `workers/queue` with BullMQ and Redis connection setup
  - [ ] 1.11 Configure Turborepo pipelines (`build`, `dev`, `lint`, `test`) and verify `npm run dev` starts both web and api
  - [ ] 1.12 Set up Vitest for `apps/api` and `packages/*`; set up Playwright for `apps/web`
  - [ ] 1.13 Create a basic GitHub Actions CI workflow (lint, type-check, test)

- [ ] 2.0 Authentication, Authorisation, and User Management
  - [ ] 2.1 Define Zod schemas for login, register, refresh-token, and forgot-password requests in `packages/validation`
  - [ ] 2.2 Implement `POST /api/v1/auth/register` — hash password with bcrypt (cost 12), create user in DB, return JWT access + refresh tokens
  - [ ] 2.3 Implement `POST /api/v1/auth/login` — validate credentials, return JWT access token (15 min) and refresh token (7 days)
  - [ ] 2.4 Implement `POST /api/v1/auth/refresh` — validate refresh token, issue new access + refresh pair
  - [ ] 2.5 Implement `POST /api/v1/auth/forgot-password` — generate reset token, send reset email via Nodemailer
  - [ ] 2.6 Create Fastify auth plugin (`plugins/auth.ts`) that decodes JWT from `Authorization: Bearer` header and attaches user to request
  - [ ] 2.7 Create RBAC middleware (`middleware/rbac.ts`) that checks user role against allowed roles per endpoint
  - [ ] 2.8 Implement `GET /api/v1/users/me` and `PATCH /api/v1/users/me` for profile viewing/editing
  - [ ] 2.9 Implement admin-only `GET /api/v1/users` (list all), `POST /api/v1/users` (create staff), `PATCH /api/v1/users/:id`, `DELETE /api/v1/users/:id`
  - [ ] 2.10 Build the Next.js login page (`/login`) with form, validation, error handling, and JWT storage
  - [ ] 2.11 Build the Next.js registration page (`/register`) for customer self-registration
  - [ ] 2.12 Implement auth context/provider in Next.js to manage tokens, auto-refresh, and protected route wrappers
  - [ ] 2.13 Write unit tests for auth routes, RBAC middleware, and JWT plugin
  - [ ] 2.14 Write Playwright E2E test for login and registration flows

- [ ] 3.0 Vehicle Register and Customer Management
  - [ ] 3.1 Define Zod schemas for customer and vehicle CRUD operations in `packages/validation`
  - [ ] 3.2 Implement `POST /api/v1/customers` — register a new customer with contact details and create linked `CustomerProfile`
  - [ ] 3.3 Implement `GET /api/v1/customers` with search/filter (name, phone, email) and pagination
  - [ ] 3.4 Implement `GET /api/v1/customers/:id` with nested vehicles and service history
  - [ ] 3.5 Implement `PATCH /api/v1/customers/:id` and `DELETE /api/v1/customers/:id`
  - [ ] 3.6 Implement vehicle CRUD: `POST /api/v1/vehicles`, `GET /api/v1/vehicles`, `GET /api/v1/vehicles/:id`, `PATCH`, `DELETE`
  - [ ] 3.7 Implement `GET /api/v1/vehicles/:id/work-orders` to retrieve full service history for a vehicle
  - [ ] 3.8 Build the Front Desk customer management UI — customer list, search bar, add/edit customer modal, linked vehicles view
  - [ ] 3.9 Build the vehicle register UI — add vehicle form (make, model, year, colour, reg plate), vehicle detail card
  - [ ] 3.10 Write unit tests for customer and vehicle routes
  - [ ] 3.11 Write Playwright E2E test for adding a customer and registering a vehicle

- [ ] 4.0 Work Order Lifecycle and Job Card System
  - [ ] 4.1 Define Zod schemas for work order creation, status updates, and assignment in `packages/validation`
  - [ ] 4.2 Define the work order status enum: `created`, `assigned`, `in_progress`, `awaiting_parts`, `completed`, `quality_check`, `invoiced`, `paid`, `collected`
  - [ ] 4.3 Implement `POST /api/v1/work-orders` — create a work order linked to a vehicle, with customer notes and service type
  - [ ] 4.4 Implement `GET /api/v1/work-orders` with filters (status, mechanic, date range) and pagination; scope by role (mechanic sees only their own)
  - [ ] 4.5 Implement `GET /api/v1/work-orders/:id` with nested inspection, labour logs, and parts requests
  - [ ] 4.6 Implement `PATCH /api/v1/work-orders/:id/status` — enforce valid state transitions per PRD §2.3 state machine
  - [ ] 4.7 Implement `PATCH /api/v1/work-orders/:id/assign` — admin assigns a mechanic to a work order (status → `assigned`)
  - [ ] 4.8 Build the mechanic job card list view — cards showing vehicle info, status badge, customer notes, action buttons
  - [ ] 4.9 Build the mechanic job card detail view — full work order info with tabs for inspection, labour, parts
  - [ ] 4.10 Build the admin work order assignment UI — list of unassigned orders, mechanic dropdown, assign button
  - [ ] 4.11 Implement real-time status updates via Socket.io — emit events on status change, listen on relevant dashboards
  - [ ] 4.12 Write unit tests for work order routes and state machine transition validation
  - [ ] 4.13 Write Playwright E2E test for the full work order lifecycle (create → assign → in progress → complete)

- [ ] 5.0 Front Desk Operations (Check-in/out, Appointments, Invoicing, Payments)
  - [ ] 5.1 Implement vehicle check-in endpoint — capture odometer reading, condition photos (upload to S3), set work order status to `created`
  - [ ] 5.2 Implement vehicle check-out endpoint — mark work order status as `collected`, record departure timestamp
  - [ ] 5.3 Build the front desk check-in UI — vehicle lookup, odometer input, photo upload with drag-and-drop, condition notes
  - [ ] 5.4 Build the front desk check-out UI — vehicle search, confirm collection, print summary
  - [ ] 5.5 Implement appointment CRUD: `POST /api/v1/appointments`, `GET` (calendar view data), `PATCH` (reschedule), `DELETE` (cancel)
  - [ ] 5.6 Implement `GET /api/v1/appointments/available-slots` — return available time slots for a given date
  - [ ] 5.7 Build the appointment calendar UI — daily/weekly view, click-to-book, drag-to-reschedule, colour-coded by status
  - [ ] 5.8 Implement `POST /api/v1/invoices` — generate itemised invoice from work order (auto-calculate labour total, parts total, tax, grand total)
  - [ ] 5.9 Implement `GET /api/v1/invoices/:id/pdf` — generate and return PDF invoice using pdf-lib/Puppeteer
  - [ ] 5.10 Implement `PATCH /api/v1/invoices/:id/status` — update invoice status (draft → sent → paid → overdue)
  - [ ] 5.11 Build the invoice generation UI — preview invoice, edit line items, generate PDF, print/download
  - [ ] 5.12 Implement `POST /api/v1/payments` — record payment with method (cash, mobile money, bank transfer), amount, transaction ref
  - [ ] 5.13 Implement `GET /api/v1/payments/by-invoice/:id` — list payments for an invoice
  - [ ] 5.14 Build the payment processing UI — select payment method, enter amount, record transaction, issue receipt
  - [ ] 5.15 Write unit tests for appointment, invoice, and payment routes
  - [ ] 5.16 Write Playwright E2E test for check-in → invoice → payment flow

- [ ] 6.0 Mechanic Operations (Inspections, Labour Logging, Parts Requests)
  - [ ] 6.1 Define Zod schemas for inspection, labour log, and parts request in `packages/validation`
  - [ ] 6.2 Implement `POST /api/v1/inspections` — create inspection record with findings, recommendations, and photo URLs
  - [ ] 6.3 Implement photo upload endpoint for inspections — accept multipart form data, upload to S3, return URLs
  - [ ] 6.4 Implement `PATCH /api/v1/inspections/:id` — update inspection findings
  - [ ] 6.5 Build the mechanic inspection form UI — text areas for findings/recommendations, photo upload with camera access, preview gallery
  - [ ] 6.6 Implement labour log CRUD: `POST /api/v1/labour-logs` (start timer), `PATCH /:id` (stop timer, add description), `GET` (by work order)
  - [ ] 6.7 Build the mechanic labour logging UI — start/stop timer, manual entry, running total per work order
  - [ ] 6.8 Implement `POST /api/v1/parts-requests` — submit parts request linked to work order, set status to `pending`
  - [ ] 6.9 Implement `PATCH /api/v1/parts-requests/:id` — admin approves/rejects request (status → `approved` / `rejected`)
  - [ ] 6.10 Implement `PATCH /api/v1/parts-requests/:id/fulfil` — mark request as `fulfilled` when part is received
  - [ ] 6.11 Build the mechanic parts request form UI — part name, quantity, urgency note, submit button
  - [ ] 6.12 Build the admin parts approval UI — pending requests list, approve/reject buttons, notes field
  - [ ] 6.13 Implement `POST /api/v1/work-orders/:id/complete` — mechanic signs off job, adds final notes, status → `completed`
  - [ ] 6.14 Build the mechanic job completion UI — final notes textarea, recommendation field, submit for quality check
  - [ ] 6.15 Implement `GET /api/v1/vehicles/:id/history` — return full service history visible to mechanic for workshop context
  - [ ] 6.16 Write unit tests for inspection, labour log, and parts request routes
  - [ ] 6.17 Write Playwright E2E test for mechanic workflow (inspect → log labour → request parts → complete)

- [ ] 7.0 Admin Dashboard, Analytics, Reports, and Staff Management
  - [ ] 7.1 Implement `GET /api/v1/reports/revenue` — return revenue data with date-range filtering (daily, weekly, monthly)
  - [ ] 7.2 Implement `GET /api/v1/reports/jobs` — return job completion stats, average turnaround time, jobs by status
  - [ ] 7.3 Implement `GET /api/v1/reports/staff-performance` — return per-mechanic stats (jobs completed, avg time, labour hours)
  - [ ] 7.4 Implement Redis caching for report queries to meet < 2 second dashboard load target
  - [ ] 7.5 Build the admin dashboard page — KPI cards (revenue, active jobs, pending jobs, mechanics online), trend charts, date-range picker
  - [ ] 7.6 Build the revenue chart component — line/bar chart with daily/weekly/monthly toggle
  - [ ] 7.7 Build the mechanic performance table component — sortable by jobs completed, avg time, utilisation
  - [ ] 7.8 Implement PDF/Excel report export — generate downloadable files via BullMQ background job
  - [ ] 7.9 Build the reports page UI — select report type, date range, format (PDF/Excel), download button with progress indicator
  - [ ] 7.10 Implement staff management endpoints — already covered in 2.9; add shift management (`PATCH /api/v1/users/:id/shifts`) and attendance tracking
  - [ ] 7.11 Build the staff management UI — staff list table, add/edit staff modal, role assignment dropdown, shift calendar, attendance log
  - [ ] 7.12 Implement service catalogue CRUD: `POST /api/v1/services`, `GET`, `PATCH`, `DELETE` — define service types, standard prices, categories
  - [ ] 7.13 Build the service catalogue UI — table with add/edit/delete, category filters, price editing
  - [ ] 7.14 Write unit tests for report, staff management, and service catalogue routes
  - [ ] 7.15 Write Playwright E2E test for dashboard load and report export

- [ ] 8.0 Notification System and External Integrations (SMS, WhatsApp, Email)
  - [ ] 8.1 Set up BullMQ notification queue in `workers/queue` with job types: `sms`, `whatsapp`, `email`, `in_app`
  - [ ] 8.2 Implement the `in_app` notification job — create `Notification` record in DB, emit Socket.io event to recipient
  - [ ] 8.3 Implement `GET /api/v1/notifications` — return paginated notifications for the logged-in user
  - [ ] 8.4 Implement `PATCH /api/v1/notifications/:id/read` — mark notification as read
  - [ ] 8.5 Build the notification bell/dropdown UI component — unread count badge, notification list, mark-as-read on click
  - [ ] 8.6 Implement the `sms` notification job — integrate with SMS gateway (Africa's Talking / Twilio), send message, log result
  - [ ] 8.7 Implement the `email` notification job — use Nodemailer + SendGrid to send transactional emails (invoice, password reset)
  - [ ] 8.8 Implement the `whatsapp` notification job — integrate with WhatsApp Business API, send template messages
  - [ ] 8.9 Create notification triggers — enqueue jobs on: work order status change, appointment reminder (T-24h), job assignment, invoice sent
  - [ ] 8.10 Implement customer notification preferences — store preferred channel per customer in `CustomerProfile.preferred_contact`
  - [ ] 8.11 Build the front desk manual notification UI — select customer, compose message, choose channel, send button
  - [ ] 8.12 Implement retry with exponential backoff for failed SMS/WhatsApp deliveries
  - [ ] 8.13 Write unit tests for notification service and queue jobs
  - [ ] 8.14 Write integration test for end-to-end notification flow (status change → queue → delivery)

- [ ] 9.0 Customer Self-Service Portal
  - [ ] 9.1 Build the customer registration page — sign-up form with name, email, phone, password, Zod validation
  - [ ] 9.2 Build the customer profile page — view/edit personal details, change password
  - [ ] 9.3 Build the customer vehicle management page — list registered vehicles, add vehicle form, edit/remove vehicle
  - [ ] 9.4 Build the customer appointment booking page — date picker, available slot grid, vehicle selector, issue description textarea, booking confirmation
  - [ ] 9.5 Build the customer service status tracking page — list of active work orders with real-time status badges, auto-refresh via Socket.io
  - [ ] 9.6 Build the customer service history page — list of past services per vehicle with expandable details (work performed, parts, mechanic notes)
  - [ ] 9.7 Build the customer invoice and payment page — list invoices, view/download PDF, pay online button (placeholder for payment gateway integration)
  - [ ] 9.8 Integrate payment gateway (mobile money / card) — implement webhook handler for payment confirmation, update invoice status to `paid`
  - [ ] 9.9 Build the customer feedback and ratings UI — star rating (1-5), optional comment textarea, submit after service completion
  - [ ] 9.10 Implement `POST /api/v1/feedback` and `GET /api/v1/feedback/by-work-order/:id` — create and retrieve feedback
  - [ ] 9.11 Ensure all customer endpoints are scoped — customers can only view/modify their own data (enforced by RBAC + ownership check)
  - [ ] 9.12 Write Playwright E2E test for customer portal flows (register → add vehicle → book → track → pay → rate)

- [ ] 10.0 Audit Trail, System Settings, and Cross-Cutting Concerns
  - [ ] 10.1 Create audit trail middleware (`middleware/audit.ts`) — intercept all POST/PATCH/DELETE requests, log user, entity, action, changes to `AuditLog` table
  - [ ] 10.2 Implement `GET /api/v1/audit-logs` (admin only) — paginated, filterable by entity type, user, date range
  - [ ] 10.3 Build the admin audit log viewer UI — searchable table with filters, expandable row showing change diff
  - [ ] 10.4 Implement system settings endpoints — `GET /api/v1/settings`, `PATCH /api/v1/settings` (admin only) for garage name, address, logo, tax rate
  - [ ] 10.5 Build the admin system settings page — garage details form, logo upload, tax rate config, notification preference toggles
  - [ ] 10.6 Implement supplier CRUD: `POST /api/v1/suppliers`, `GET`, `PATCH`, `DELETE` — name, contact phone, contact email
  - [ ] 10.7 Implement purchase order CRUD: `POST /api/v1/purchase-orders`, `GET`, `PATCH /:id/status` (ordered → shipped → received)
  - [ ] 10.8 Build the supplier directory UI — table with add/edit/remove, linked purchase orders
  - [ ] 10.9 Build the purchase order management UI — create PO from approved parts request, track status, receive confirmation
  - [ ] 10.10 Implement data backup configuration — endpoint to trigger manual backup, display last backup timestamp
  - [ ] 10.11 Implement PWA service worker for offline job card caching (mechanic use case)
  - [ ] 10.12 Add global error handling and standardised API error responses across all Fastify routes
  - [ ] 10.13 Write unit tests for audit middleware, settings, supplier, and purchase order routes
  - [ ] 10.14 Final Playwright E2E regression suite covering all critical user flows across all four roles
