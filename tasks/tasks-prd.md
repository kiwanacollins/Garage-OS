# GarageOS — Task List (TDD Approach)

**Source PRD:** [prd.md](../prd.md)
**Generated:** 9 May 2026
**Methodology:** Test-Driven Development for backend; test-after for frontend UI

---

## Relevant Files

- `package.json` - Root monorepo package with Turborepo scripts
- `turbo.json` - Turborepo pipeline configuration
- `apps/web/` - Next.js 14 web application (Admin, Front Desk, Mechanic, Customer)
- `apps/api/` - Fastify REST API server
- `apps/api/src/server.ts` - Fastify server entry point
- `apps/api/src/plugins/auth.ts` - JWT auth plugin
- `apps/api/src/plugins/auth.test.ts` - Tests for auth plugin
- `apps/api/src/routes/auth.ts` - Auth route handlers
- `apps/api/src/routes/auth.test.ts` - Tests for auth routes
- `apps/api/src/lib/jwt.ts` - HMAC JWT signing and verification helpers
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
- `apps/api/src/middleware/audit.test.ts` - Tests for audit middleware
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

- **TDD workflow:** For backend tasks marked 🔴, write the failing test first, then implement to make it pass (Red → Green → Refactor).
- **Test-after workflow:** For frontend/UI tasks marked 🟢, build the UI first, then add E2E tests at the end of the group.
- Unit tests should be placed alongside the code files they test.
- Use `npx vitest` for unit/integration tests. Use `npx playwright test` for E2E browser tests.
- RBAC roles: `admin`, `mechanic`, `front_desk`, `customer`.

---

## Tasks

- [x] 1.1 Initialise root monorepo with `package.json`, Turborepo (`turbo.json`), and shared TypeScript config
  - [x] 1.2 Scaffold `apps/web` using Next.js 14 with App Router and TypeScript
  - [x] 1.3 Scaffold `apps/api` using Fastify with TypeScript, Pino logger, and CORS/rate-limit plugins
  - [x] 1.4 Create `packages/shared-types` with role enums (`admin`, `mechanic`, `front_desk`, `customer`) and base interfaces
  - [x] 1.5 Create `packages/validation` with Zod and export placeholder schemas
  - [x] 1.6 Create `packages/db` with Prisma, configure PostgreSQL, write `schema.prisma` with all 15 entities from PRD §4
  - [x] 1.7 Run `prisma migrate dev` to generate initial migration and verify schema
  - [x] 1.8 Create `packages/db/prisma/seed.ts` with sample data (admin user, test customer, test vehicle)
  - [x] 1.9 Create `packages/config` with shared ESLint, Prettier, and TSConfig presets
  - [x] 1.10 Scaffold `workers/queue` with BullMQ and Redis connection setup
  - [x] 1.11 Configure Turborepo pipelines (`build`, `dev`, `lint`, `test`) and verify `npm run dev` starts web + api
  - [x] 1.12 Set up Vitest for `apps/api` and `packages/*`; set up Playwright for `apps/web`

- [x] 2.0 Authentication, Authorisation, and User Management
  - [x] 2.1 Define Zod schemas for login, register, refresh-token, forgot-password in `packages/validation`
  - [x] 2.2 🔴 Write tests for `POST /auth/register` — valid registration returns tokens, duplicate email returns 409, invalid input returns 400
  - [x] 2.3 Implement `POST /api/v1/auth/register` — make tests from 2.2 pass
  - [x] 2.4 🔴 Write tests for `POST /auth/login` — valid credentials return tokens, wrong password returns 401, missing user returns 404
  - [x] 2.5 Implement `POST /api/v1/auth/login` — make tests from 2.4 pass
  - [x] 2.6 🔴 Write tests for `POST /auth/refresh` — valid refresh returns new pair, expired token returns 401
  - [x] 2.7 Implement `POST /api/v1/auth/refresh` — make tests from 2.6 pass
  - [x] 2.8 🔴 Write tests for auth plugin — requests without token return 401, invalid token returns 401, valid token attaches user to request
  - [x] 2.9 Implement Fastify auth plugin (`plugins/auth.ts`) — make tests from 2.8 pass
  - [x] 2.10 🔴 Write tests for RBAC middleware — admin can access admin routes, mechanic cannot access admin routes, etc. (full role × route matrix)
  - [x] 2.11 Implement RBAC middleware (`middleware/rbac.ts`) — make tests from 2.10 pass
  - [x] 2.12 🔴 Write tests for user CRUD — admin can list/create/update/delete users, non-admin gets 403, GET /me returns own profile
  - [x] 2.13 Implement user endpoints (`GET /me`, `PATCH /me`, admin CRUD) — make tests from 2.12 pass
  - [x] 2.14 Implement `POST /auth/forgot-password` — generate reset token, send email via Nodemailer
  - [x] 2.15 🟢 Build Next.js login page with form, validation, error handling, JWT storage
  - [x] 2.16 🟢 Build Next.js registration page for customer self-registration
  - [x] 2.17 🟢 Implement auth context/provider — token management, auto-refresh, protected route wrappers
  - [x] 2.18 🟢 Write Playwright E2E test for login and registration flows

- [ ] 3.0 Vehicle Register and Customer Management
  - [ ] 3.1 Define Zod schemas for customer and vehicle CRUD in `packages/validation`
  - [ ] 3.2 🔴 Write tests for customer routes — create returns 201, search filters work, GET /:id returns profile with vehicles, RBAC enforced
  - [ ] 3.3 Implement customer CRUD (`POST`, `GET` with search/pagination, `GET /:id`, `PATCH`, `DELETE`) — make tests from 3.2 pass
  - [ ] 3.4 🔴 Write tests for vehicle routes — create linked to customer, GET returns vehicle, GET /:id/work-orders returns history, RBAC enforced
  - [ ] 3.5 Implement vehicle CRUD (`POST`, `GET`, `GET /:id`, `PATCH`, `DELETE`, `GET /:id/work-orders`) — make tests from 3.4 pass
  - [ ] 3.6 🟢 Build front desk customer management UI — customer list, search bar, add/edit modal, linked vehicles view
  - [ ] 3.7 🟢 Build vehicle register UI — add vehicle form (make, model, year, colour, reg plate), vehicle detail card
  - [ ] 3.8 🟢 Write Playwright E2E test for adding a customer and registering a vehicle

- [ ] 4.0 Work Order Lifecycle and Job Card System
  - [ ] 4.1 Define Zod schemas for work order creation, status updates, assignment in `packages/validation`
  - [ ] 4.2 Define work order status enum: `created`, `assigned`, `in_progress`, `awaiting_parts`, `completed`, `quality_check`, `invoiced`, `paid`, `collected`
  - [ ] 4.3 🔴 Write tests for state machine — valid transitions pass (created→assigned, assigned→in_progress, etc.), invalid transitions return 400
  - [ ] 4.4 🔴 Write tests for work order CRUD — create returns 201, GET filters by status/mechanic/date, mechanic only sees own orders
  - [ ] 4.5 Implement `POST /api/v1/work-orders` — make creation tests pass
  - [ ] 4.6 Implement `GET /api/v1/work-orders` with filters and role scoping — make list tests pass
  - [ ] 4.7 Implement `GET /api/v1/work-orders/:id` with nested inspection, labour, parts — make detail tests pass
  - [ ] 4.8 Implement `PATCH /api/v1/work-orders/:id/status` with state machine validation — make transition tests from 4.3 pass
  - [ ] 4.9 Implement `PATCH /api/v1/work-orders/:id/assign` — admin assigns mechanic, status → `assigned`
  - [ ] 4.10 🟢 Build mechanic job card list view — cards with vehicle info, status badge, customer notes, action buttons
  - [ ] 4.11 🟢 Build mechanic job card detail view — full work order info with tabs for inspection, labour, parts
  - [ ] 4.12 🟢 Build admin work order assignment UI — unassigned orders list, mechanic dropdown, assign button
  - [ ] 4.13 Set up Socket.io for real-time status updates — emit on status change, listen on dashboards
  - [ ] 4.14 🟢 Write Playwright E2E test for full work order lifecycle (create → assign → in progress → complete)

- [ ] 5.0 Front Desk Operations (Check-in/out, Appointments, Invoicing, Payments)
  - [ ] 5.1 🔴 Write tests for check-in endpoint — accepts odometer + photos, creates work order, returns 201
  - [ ] 5.2 Implement vehicle check-in — capture odometer, upload condition photos to S3, set status `created` — make tests pass
  - [ ] 5.3 🔴 Write tests for check-out endpoint — marks work order `collected`, records departure timestamp
  - [ ] 5.4 Implement vehicle check-out — make tests from 5.3 pass
  - [ ] 5.5 🔴 Write tests for appointment routes — CRUD, available-slots returns valid slots, cancel sends notification
  - [ ] 5.6 Implement appointment CRUD (`POST`, `GET`, `PATCH`, `DELETE`) and `GET /available-slots` — make tests pass
  - [ ] 5.7 🔴 Write tests for invoice generation — calculates labour + parts + tax correctly, PDF generation returns binary, status transitions valid
  - [ ] 5.8 Implement `POST /api/v1/invoices` — auto-calculate totals from work order — make tests pass
  - [ ] 5.9 Implement `GET /api/v1/invoices/:id/pdf` — generate PDF via pdf-lib/Puppeteer — make tests pass
  - [ ] 5.10 Implement `PATCH /api/v1/invoices/:id/status` — make tests pass
  - [ ] 5.11 🔴 Write tests for payment routes — record payment, GET by invoice returns list, invalid method returns 400
  - [ ] 5.12 Implement `POST /api/v1/payments` and `GET /by-invoice/:id` — make tests pass
  - [ ] 5.13 🟢 Build front desk check-in UI — vehicle lookup, odometer input, photo upload with drag-and-drop
  - [ ] 5.14 🟢 Build front desk check-out UI — vehicle search, confirm collection, print summary
  - [ ] 5.15 🟢 Build appointment calendar UI — daily/weekly view, click-to-book, drag-to-reschedule, colour-coded
  - [ ] 5.16 🟢 Build invoice generation UI — preview, edit line items, generate PDF, print/download
  - [ ] 5.17 🟢 Build payment processing UI — select method, enter amount, record transaction, issue receipt
  - [ ] 5.18 🟢 Write Playwright E2E test for check-in → invoice → payment flow

- [ ] 6.0 Mechanic Operations (Inspections, Labour Logging, Parts Requests)
  - [ ] 6.1 Define Zod schemas for inspection, labour log, parts request in `packages/validation`
  - [ ] 6.2 🔴 Write tests for inspection routes — create with findings + photos, update findings, photo upload returns URLs
  - [ ] 6.3 Implement `POST /api/v1/inspections` and `PATCH /:id` — make tests pass
  - [ ] 6.4 Implement inspection photo upload — accept multipart, upload to S3, return URLs — make tests pass
  - [ ] 6.5 🔴 Write tests for labour log routes — start timer creates entry, stop timer updates end_time, GET returns logs by work order
  - [ ] 6.6 Implement labour log CRUD (`POST`, `PATCH /:id`, `GET` by work order) — make tests pass
  - [ ] 6.7 🔴 Write tests for parts request routes — create sets status `pending`, approve → `approved`, reject → `rejected`, fulfil → `fulfilled`
  - [ ] 6.8 Implement parts request CRUD (`POST`, `PATCH /:id` approve/reject, `PATCH /:id/fulfil`) — make tests pass
  - [ ] 6.9 🔴 Write tests for job completion — status → `completed`, final notes saved, quality check flag set
  - [ ] 6.10 Implement `POST /api/v1/work-orders/:id/complete` — make tests pass
  - [ ] 6.11 Implement `GET /api/v1/vehicles/:id/history` — full service history for mechanic context
  - [ ] 6.12 🟢 Build mechanic inspection form UI — findings/recommendations text areas, photo upload with camera, preview gallery
  - [ ] 6.13 🟢 Build mechanic labour logging UI — start/stop timer, manual entry, running total per work order
  - [ ] 6.14 🟢 Build mechanic parts request form UI — part name, quantity, urgency note, submit
  - [ ] 6.15 🟢 Build admin parts approval UI — pending requests list, approve/reject buttons, notes field
  - [ ] 6.16 🟢 Build mechanic job completion UI — final notes textarea, recommendations, submit for quality check
  - [ ] 6.17 🟢 Write Playwright E2E test for mechanic workflow (inspect → log labour → request parts → complete)

- [ ] 7.0 Admin Dashboard, Analytics, Reports, and Staff Management
  - [ ] 7.1 🔴 Write tests for report endpoints — revenue returns correct totals for date range, jobs returns completion stats, staff-performance returns per-mechanic data
  - [ ] 7.2 Implement `GET /api/v1/reports/revenue` with date-range filtering — make tests pass
  - [ ] 7.3 Implement `GET /api/v1/reports/jobs` (completion stats, avg turnaround, by status) — make tests pass
  - [ ] 7.4 Implement `GET /api/v1/reports/staff-performance` (per-mechanic stats) — make tests pass
  - [ ] 7.5 Implement Redis caching for report queries (< 2s dashboard load target)
  - [ ] 7.6 🔴 Write tests for service catalogue CRUD — create service with price, update price, delete, category filter works
  - [ ] 7.7 Implement service catalogue CRUD (`POST /api/v1/services`, `GET`, `PATCH`, `DELETE`) — make tests pass
  - [ ] 7.8 🔴 Write tests for staff shift/attendance endpoints — update shifts, log attendance, GET returns records
  - [ ] 7.9 Implement shift management (`PATCH /api/v1/users/:id/shifts`) and attendance tracking — make tests pass
  - [ ] 7.10 Implement PDF/Excel report export via BullMQ background job
  - [ ] 7.11 🟢 Build admin dashboard page — KPI cards, trend charts, date-range picker
  - [ ] 7.12 🟢 Build revenue chart component — line/bar chart with daily/weekly/monthly toggle
  - [ ] 7.13 🟢 Build mechanic performance table component — sortable by jobs, avg time, utilisation
  - [ ] 7.14 🟢 Build reports page UI — select type, date range, format (PDF/Excel), download with progress
  - [ ] 7.15 🟢 Build staff management UI — staff list, add/edit modal, role dropdown, shift calendar, attendance
  - [ ] 7.16 🟢 Build service catalogue UI — table with add/edit/delete, category filters, price editing
  - [ ] 7.17 🟢 Write Playwright E2E test for dashboard load and report export

- [ ] 8.0 Notification System and External Integrations
  - [ ] 8.1 🔴 Write tests for notification service — in_app creates DB record + emits socket event, sms/email/whatsapp jobs are enqueued correctly
  - [ ] 8.2 Set up BullMQ notification queue with job types: `sms`, `whatsapp`, `email`, `in_app`
  - [ ] 8.3 Implement `in_app` notification job — create Notification record, emit Socket.io event — make tests pass
  - [ ] 8.4 🔴 Write tests for notification API — GET returns paginated list for logged-in user, PATCH marks as read
  - [ ] 8.5 Implement `GET /api/v1/notifications` and `PATCH /:id/read` — make tests pass
  - [ ] 8.6 Implement `sms` job — integrate SMS gateway, send message, log result
  - [ ] 8.7 Implement `email` job — Nodemailer + SendGrid for transactional emails
  - [ ] 8.8 Implement `whatsapp` job — WhatsApp Business API, send template messages
  - [ ] 8.9 🔴 Write tests for notification triggers — status change enqueues job, appointment T-24h enqueues reminder
  - [ ] 8.10 Create notification triggers — enqueue on: status change, appointment reminder, job assignment, invoice sent — make tests pass
  - [ ] 8.11 Implement customer notification preferences via `CustomerProfile.preferred_contact`
  - [ ] 8.12 Implement retry with exponential backoff for failed deliveries
  - [ ] 8.13 🟢 Build notification bell/dropdown UI — unread badge, notification list, mark-as-read
  - [ ] 8.14 🟢 Build front desk manual notification UI — select customer, compose, choose channel, send

- [ ] 9.0 Customer Self-Service Portal
  - [ ] 9.1 🔴 Write tests for customer data scoping — customer can only access own vehicles/orders/invoices, accessing another customer's data returns 403
  - [ ] 9.2 Implement ownership check middleware for all customer-facing endpoints — make tests pass
  - [ ] 9.3 🔴 Write tests for feedback routes — POST creates rating + comment, GET by work order returns feedback
  - [ ] 9.4 Implement `POST /api/v1/feedback` and `GET /api/v1/feedback/by-work-order/:id` — make tests pass
  - [ ] 9.5 🟢 Build customer registration page — sign-up form with Zod validation
  - [ ] 9.6 🟢 Build customer profile page — view/edit details, change password
  - [ ] 9.7 🟢 Build customer vehicle management page — list, add, edit, remove vehicles
  - [ ] 9.8 🟢 Build customer appointment booking page — date picker, slot grid, vehicle selector, issue description, confirmation
  - [ ] 9.9 🟢 Build customer service status tracking page — active work orders with real-time status via Socket.io
  - [ ] 9.10 🟢 Build customer service history page — past services per vehicle with expandable details
  - [ ] 9.11 🟢 Build customer invoice and payment page — list invoices, download PDF, pay online
  - [ ] 9.12 Integrate payment gateway (mobile money / card) — webhook handler, update invoice status to `paid`
  - [ ] 9.13 🟢 Build customer feedback UI — star rating (1-5), comment, submit after completion
  - [ ] 9.14 🟢 Write Playwright E2E test for full customer flow (register → add vehicle → book → track → pay → rate)

- [ ] 10.0 Audit Trail, System Settings, and Cross-Cutting Concerns
  - [ ] 10.1 🔴 Write tests for audit middleware — POST/PATCH/DELETE requests create AuditLog entry with user, entity, action, changes
  - [ ] 10.2 Implement audit middleware (`middleware/audit.ts`) — make tests pass
  - [ ] 10.3 🔴 Write tests for audit log API — GET returns paginated results, filters by entity/user/date, non-admin gets 403
  - [ ] 10.4 Implement `GET /api/v1/audit-logs` (admin only) — make tests pass
  - [ ] 10.5 🔴 Write tests for system settings — GET returns config, PATCH updates config, non-admin gets 403
  - [ ] 10.6 Implement settings endpoints (`GET /api/v1/settings`, `PATCH /api/v1/settings`) — make tests pass
  - [ ] 10.7 🔴 Write tests for supplier CRUD — create, list, update, delete, linked purchase orders
  - [ ] 10.8 Implement supplier CRUD (`POST`, `GET`, `PATCH`, `DELETE`) — make tests pass
  - [ ] 10.9 🔴 Write tests for purchase order routes — create from parts request, status transitions (ordered → shipped → received)
  - [ ] 10.10 Implement purchase order CRUD and status transitions — make tests pass
  - [ ] 10.11 🟢 Build admin audit log viewer UI — searchable table, filters, expandable change diff
  - [ ] 10.12 🟢 Build admin system settings page — garage details, logo upload, tax config, notification prefs
  - [ ] 10.13 🟢 Build supplier directory UI — table with CRUD, linked purchase orders
  - [ ] 10.14 🟢 Build purchase order management UI — create from approved parts request, track status
  - [ ] 10.15 Implement global error handling and standardised API error responses
  - [ ] 10.16 Implement PWA service worker for offline job card caching
  - [ ] 10.17 🟢 Final Playwright E2E regression suite covering critical flows across all four roles
