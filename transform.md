# GarageOS — Transformation Tasks

**Source of truth:** [transform-prd.md](./transform-prd.md) + [system-design.md](./system-design.md)
**Date:** 23 May 2026
**Confirmed decisions:** remove mechanic role · delete Pesapal · de-scope appointments + suppliers/POs · adapt schema in place · rename work_order→Job everywhere · adopt React Query · keep Mantine + Phosphor icons.

---

## How this is organized

Tasks are grouped into **phases**, ordered so the most-essential functionality lands first and each phase ends in a connected, demoable state. Within a phase, subtasks are sequenced by dependency.

**Conventions**
- `[ ]` not started · `[~]` in progress · `[x]` done.
- **(BE)** backend/api · **(DB)** prisma/db · **(FE)** web/frontend · **(INFRA)** workers/config.
- "Wire" = replace mock data with live API via React Query.
- Definition of done for each phase is at its end.

**Target Job status machine (enforce server-side):**
`registered → awaiting_approval → in_repair ⇄ quality_check → ready_for_pickup → completed`; terminals `completed` / `cancelled`. QC fail loops `quality_check → in_repair`. Cancel only from `awaiting_approval`.

---

## Phase 0 — Foundations & reconciliation

Goal: lock the model, terminology, and shared tooling so every later phase wires uniformly. No mock data removed yet, but the rails are laid.

### 0.1 Remove out-of-scope modules (clear the deck)
- [ ] **(FE)** Delete mechanic dashboard: `apps/web/src/app/(dashboard)/mechanic/**`, `lib/mechanic-store.tsx`, mechanic nav/icons, and remove `mechanic` from `getRoleRoute()`.
- [ ] **(BE)** Delete `routes/mechanic-operations.ts` (+ test); move still-needed findings/labour logic to front-desk ownership (see 1.4).
- [ ] **(BE/DB)** Delete Pesapal: `routes/pesapal.ts`, `PesapalTransaction` model + relation on `Invoice`, IPN registration in `app.ts`, related env vars/docs.
- [ ] **(BE/DB)** De-scope Appointments: remove `Appointment` model + relations, `routes/front-desk.ts` appointment endpoints, `customer-portal.ts` appointment endpoints, FE appointment UI.
- [ ] **(BE/DB)** De-scope Suppliers/POs: remove `Supplier`, `PurchaseOrder` models + relations, `routes/purchasing.ts` (+ test), FE references.
- [ ] **(BE)** Delete `PartsRequest` (procurement-style) — replaced by inventory `parts` + `job_parts` in Phase 2.
- [ ] **(FE/BE)** Remove now-dead tests, types in `shared-types`, and Zod schemas tied to deleted modules; ensure `type-check` + `lint` pass.

### 0.2 Role model → three roles
- [ ] **(DB)** Migration: change `UserRole` enum to `admin | front_desk | customer` (drop `mechanic`); plan data move for any existing mechanic users.
- [ ] **(BE)** Update RBAC helpers/middleware: remove `mechanicOrAdmin`; keep `adminOnly`, `frontDeskOnly`, `requireRoles`.
- [ ] **(BE/DB)** Reseed: admin + front_desk + sample customers only.

### 0.3 Work order → Job rename (everywhere)
- [ ] **(DB)** Rename `work_orders` → `jobs`; `WorkOrderStatus` → `JobStatus` with target values; add `approval_status` (`pending|approved|declined`) and `qc_status` (`pending|passed|failed`) enums/fields per system-design.md `jobs` table.
- [ ] **(DB)** Map old statuses → new on migrate (e.g. `created→registered`, `in_progress→in_repair`, `quality_check→quality_check`, `completed/paid/collected→completed`).
- [ ] **(BE)** Rename `routes/work-orders.ts` → `routes/jobs.ts`, prefix `/api/v1/jobs`, update controllers/services/tests.
- [ ] **(FE)** Rename UI strings, types, routes, components from "work order" to "Job".

### 0.4 Job status state machine (server-enforced)
- [ ] **(BE)** Implement `canTransition(current, next)` utility covering the full target machine incl. QC↔in_repair loopback and cancel-from-awaiting_approval; reject invalid transitions before DB writes.
- [ ] **(BE)** Wire `PATCH /jobs/:id/status` through `canTransition`; add unit tests for every legal/illegal edge.
- [ ] **(BE)** Add status-history logging (audit trail) on each transition (system-design.md business rule 5).

### 0.5 Shared frontend data layer (React Query)
- [ ] **(FE)** Add `@tanstack/react-query`; mount `QueryClientProvider` in `app/layout.tsx`.
- [ ] **(FE)** Build a typed API client around `apiRequest` that injects the auth token and centralizes error handling; create reusable `useApiQuery`/`useApiMutation` hooks.
- [ ] **(FE)** Define query-key conventions + invalidation patterns (e.g. `['jobs']`, `['jobs', id]`).

**Phase 0 DoD:** mechanic/Pesapal/appointments/suppliers gone; three roles; `jobs` model + status machine live and tested; React Query installed and wired to auth. App builds, type-checks, lints; existing real auth still works.

---

## Phase 1 — Core front-desk loop (the spine)

Goal: the end-to-end operational path works against the real DB, front-desk mock data removed. This is the most essential functionality.

### 1.1 Registration (Stage 1)
- [ ] **(BE)** `POST /customers` (exists) — confirm creates `User(role=customer)` + `CustomerProfile`.
- [ ] **(BE)** Signup-link issuance: generate 48h signed JWT pre-filling email + tied to job; **email the link to the customer** via existing mailer/worker. New endpoint (e.g. `POST /customers/:id/signup-link`).
- [ ] **(FE)** Front-desk "Send signup link" action on the customer record — front desk triggers the email; show sent/failed status and allow resend.
- [ ] **(BE)** Token-gated signup: adapt `POST /auth/signup` to accept the signed token, set password, activate account.
- [ ] **(BE)** `POST /vehicles` / `POST /customers/:id/vehicles` (exists) — car name, model, plate.
- [ ] **(BE)** `POST /jobs` creates job in `registered` (exists as work-orders create — adapt).
- [ ] **(FE)** Wire front-desk register section: customer search/list (`GET /customers`), create/edit customer, add vehicle, create job — remove `initialCustomers/initialVehicles/initialWorkOrders` mock arrays.

### 1.2 Inspection / findings entry (Stage 2)
- [ ] **(BE)** `POST /jobs/:id/findings` — report_text, recommendation, footage_urls (re-home from inspections). Sets status → `awaiting_approval`.
- [ ] **(FE)** Front-desk findings form (entered by front desk on mechanic's behalf): report, recommendations, footage upload. Wire to endpoint; show status flip.

### 1.3 Approval (Stage 3)
- [ ] **(BE)** `PATCH /jobs/:id/approval` — front desk logs `approved` → status `in_repair`, or `declined` → status `cancelled`. Triggers customer notification.
- [ ] **(FE)** Front-desk approval control (records phone-call outcome). Portal stays read-only for approval.

### 1.4 Repairs + QC (Stages 4–5)
- [ ] **(BE)** Repair progress updates via `PATCH /jobs/:id/status` (→ `quality_check` when done).
- [ ] **(BE)** `PATCH /jobs/:id/qc` — passed → `ready_for_pickup` (+ pickup notification); failed → loops to `in_repair`.
- [ ] **(FE)** Front-desk QC pass/fail control with loopback reflected in UI.

### 1.5 Pickup & completion (Stage 7)
- [ ] **(BE)** `PATCH /jobs/:id/status` → `completed` on collection; triggers review prompt + schedules service reminder using the front-desk-supplied due date (reminder delivery impl in Phase 5).
- [ ] **(FE)** Front-desk "mark collected/completed" control, including a **service-reminder due-date picker** (front desk sets when the next service reminder should fire). Optional/skippable if no future service expected.

### 1.6 Business rule enforcement
- [ ] **(BE)** Rule 6: a vehicle can have only one active (non-completed/cancelled) job — enforce on `POST /jobs`.
- [ ] **(BE)** Rules 1–2: only front_desk/admin create/modify jobs; approval recorded by front desk only.

**Phase 1 DoD:** a front-desk user can drive a real job from `registered` to `completed` (and cancel/QC-loop) against the live DB; front-desk page has zero mock data; loading/empty/error states handled.

---

## Phase 2 — Billing (parts, services, invoice, payment)

Goal: server-side invoicing from real line items; manual payment recording. No online payment.

### 2.1 Inventory & catalog
- [ ] **(DB)** Add `parts` table (name, description, unit_price, stock_quantity). Keep existing `services` (name, category, price).
- [ ] **(DB)** Add `job_parts` (job_id, part_id, quantity, unit_price) and `job_services` (job_id, service_id, price) link tables.
- [ ] **(BE)** Parts inventory CRUD (`/admin/inventory`); services CRUD (exists).
- [ ] **(FE)** Front-desk: add parts/services to a job during findings/repair (drives invoice line items).

### 2.2 Invoice generation (Stage 6)
- [ ] **(BE)** `POST /jobs/:id/invoice` — auto-pull line items from `job_parts` + `job_services`, compute labour/parts/tax/grand totals **server-side** (never trust client). Rule 4: only when status ≥ `ready_for_pickup`.
- [ ] **(BE)** `GET /invoices/:id` and `GET /invoices/:id/pdf` (exist — adapt to new line items).
- [ ] **(FE)** Front-desk invoice screen: generate from job, preview itemized totals, download PDF. Remove manual-total mock form.

### 2.3 Payment
- [ ] **(BE)** `PATCH /invoices/:id/pay` / `POST /payments` (exists) — record cash/mobile money/bank transfer; mark invoice paid.
- [ ] **(FE)** Front-desk record-payment screen wired; receipt/paid state. Remove payment mock.

**Phase 2 DoD:** invoices generate from real parts+services with server-computed totals; payments recorded manually; PDF downloads; no Pesapal/online-payment path anywhere.

---

## Phase 3 — Customer self-service portal

Goal: customer sees their real jobs, report, footage, invoices; reviews after pickup; approval is phone-only.

- [ ] **(BE)** `GET /portal/jobs`, `GET /portal/jobs/:id` (report + secure footage URLs), `GET /portal/vehicles`, `GET /portal/invoices` (exist as customer-portal — adapt to Job model).
- [ ] **(BE)** Secure footage view: signed/secured URLs so customers view but not enumerate.
- [ ] **(BE)** `POST /portal/reviews` (reuse `Feedback`) — rating 1–5 + comment, after `completed`.
- [ ] **(FE)** Portal: live job status timeline, mechanic report + footage viewer (video + images), vehicle list, invoice view/download. Remove customer-page mock data.
- [ ] **(FE)** Portal approval is read-only with a "call the front desk" prompt (no in-app approve).
- [ ] **(FE)** Post-pickup review form.

**Phase 3 DoD:** a customer logs in via signup link, tracks a real job, views report/footage, downloads invoices, and submits a review; no portal mock data.

---

## Phase 4 — Admin oversight

Goal: live operational + financial visibility and management.

- [ ] **(FE/BE)** Operations dashboard: live KPIs + active/past jobs (`GET /reports/dashboard-kpis`, `/reports/revenue`, `/reports/jobs`). Remove admin mock data.
- [ ] **(FE/BE)** Staff management: CRUD front-desk/admin users (`/users`); admin-created accounts only (Rule 8, no signup link for staff).
- [ ] **(FE/BE)** Parts inventory + service catalog management (from 2.1).
- [ ] **(FE/BE)** Finance: revenue by day/week/month, invoice/payment audit, expenses (exists).
- [ ] **(FE/BE)** Notification log + audit trail views (`/notifications`, `/audit-logs`).
- [ ] **(FE/BE)** System settings: garage profile, working hours, notification templates (`/settings`).

**Phase 4 DoD:** admin sees live data everywhere, can manage staff/inventory/services/settings; audit + notification logs render real records; no admin mock data.

---

## Phase 5 — Notifications & service reminders

Goal: wire the automated event triggers + front-desk-scheduled service reminders, delivered across **in-app + email + SMS**, via the existing BullMQ worker.

### 5.1 Notification + reminder data model
- [ ] **(DB)** Reconcile `notifications` to target: `type` (pickup_ready, service_reminder, signup_link, general), `channel` (in_app, email, sms), `status` (pending, sent, failed).
- [ ] **(DB)** Add `service_reminders` (vehicle_id, customer_id, **remind_at** — set by front desk, sent boolean). `remind_at` is captured at job completion (task 1.5).

### 5.2 Delivery channels (in-app + email + SMS)
- [ ] **(INFRA)** Email via existing nodemailer/worker.
- [ ] **(INFRA)** **SMS via EgoSMS** (https://egosms.co) — JSON API. Build a small `egosms` client + queue + retry with backoff via BullMQ.
  - Endpoint: `POST https://www.egosms.co/api/v1/json/`
  - Body shape: `{ method: "SendSms", userdata: { username, password }, msgdata: [{ number, message, senderid }] }`
  - `number` = recipient MSISDN (Uganda, e.g. `2567XXXXXXXX`); `senderid` ≤ 11 chars; `message` ≤ 160 chars (URL-encoded).
  - Creds from env: `EGOSMS_USERNAME`, `EGOSMS_PASSWORD`, `EGOSMS_SENDER_ID` (never committed; add to `.env.example`).
  - Add a sandbox/dry-run mode for tests (no live sends).
- [ ] **(BE)** In-app: write a `Notification` row (bell already wired in `DashboardShell`).
- [ ] **(BE)** Fan-out helper: given a recipient + event, deliver to all configured channels (in-app + email + SMS) and record per-channel status.

### 5.3 Event triggers (system-design.md §375)
- [ ] **(BE)** Customer registered → signup-link email (from task 1.1).
- [ ] **(BE)** Status → awaiting_approval → "report ready, please call us".
- [ ] **(BE)** Status → cancelled → "job cancelled".
- [ ] **(BE)** Status → ready_for_pickup → "car ready for collection".
- [ ] **(BE)** Job completed → review request.

### 5.4 Service reminders (the core of this request)
- [ ] **(BE)** Rule 7 / your requirement: when a job is `completed`, create a `service_reminder` with the front-desk-set `remind_at`.
- [ ] **(INFRA)** BullMQ delayed/repeatable job (or periodic sweep) that fires due reminders at `remind_at` and dispatches them via **in-app + email + SMS** (5.2 fan-out): "Your [car] is due for a service".
- [ ] **(BE)** Mark `service_reminders.sent = true` after successful dispatch; surface failures for retry.
- [ ] **(FE)** Customer portal shows upcoming/sent service reminders; in-app reminder appears in the notification bell.

**Phase 5 DoD:** completing a job with a reminder date schedules a future service reminder that fires on `remind_at` and reaches the customer via in-app + email + SMS (EgoSMS); all event triggers fire correct templates; failures retry; per-channel status recorded.

> **Note:** SMS provider is **EgoSMS**. Live SMS needs `EGOSMS_USERNAME` / `EGOSMS_PASSWORD` / `EGOSMS_SENDER_ID` credentials; in-app + email can be built and tested before those are provisioned (use EgoSMS dry-run mode meanwhile).

---

## Phase 6 — Responsiveness & polish (keep Mantine)

Goal: fix the large-screen layout defect and verify all breakpoints, without abandoning Mantine or the current look.

- [ ] **(FE)** Fix the primary defect: `.garage-content` (globals.css ~L1457) is `width: min(100%, 1280px)` but uncentered → center/fluidly cap it (`margin-inline:auto` or Mantine `Container` responsive) so large screens don't show a ~60%-width dead band.
- [ ] **(FE)** Make capped grids fluid: `.operations-grid`, `.ds-stat-grid`, `.admin-grid`, `.register-layout` → use `auto-fit`/Mantine `SimpleGrid` breakpoints so cards fill the viewport sensibly.
- [ ] **(FE)** Audit all dashboards/portal at 1024px+, 768px+, 360px+ (old PRD §7.4 / acceptance #4).
- [ ] **(FE)** Replace hand-rolled grids with Mantine responsive primitives where it improves maintainability — preserve brand tokens + Phosphor icons.
- [ ] **(FE)** Verify Mantine theme tokens (`theme.ts`) align with brand colors used across pages.

**Phase 6 DoD:** no dead horizontal band on large monitors; content centered/fluid; all roles usable and tidy at 1024/768/360; still Mantine + Phosphor throughout.

---

## Cross-cutting / final acceptance (from transform-prd.md §7)

- [ ] No dashboard/portal page renders from hardcoded mock arrays — all data live from `/api/v1/*`.
- [ ] Job status machine matches system-design.md (incl. QC→in_repair loopback), enforced server-side.
- [ ] Full front-desk loop works end-to-end against the real DB.
- [ ] Customer portal: real jobs, report, footage, downloadable invoices; approval phone-only.
- [ ] Invoices generated server-side from job parts+services; payments manual.
- [ ] Every system-design.md feature (§82–151) has a working surface.
- [ ] Responsive at 1024/768/360, content centered/fluid, Mantine + Phosphor kept.
- [ ] RBAC holds (three roles); type-check, lint, Vitest unit, and Playwright E2E pass.

---

## Suggested execution order (one-line)

`0.1 → 0.2 → 0.3 → 0.4 → 0.5` → Phase 1 (1.1→1.6) → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6 → final acceptance.

> Each phase deletes the mock data for the surfaces it brings online — no half-wired pages left behind.
