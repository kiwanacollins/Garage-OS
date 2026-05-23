# GarageOS — Transformation PRD

**Version:** 1.0 (Draft for review)
**Date:** 23 May 2026
**Author:** Generated from a full repository scan + [system-design.md](./system-design.md)
**Status:** Awaiting review — once approved, this drives `transform.md` (tasks & subtasks)

---

## 0. How to read this document

This PRD has one job: describe **what the system is today**, **what `system-design.md` says it should become**, and **the exact gap between the two** — so we can transform the existing dummy UI into a fully functional garage management system without missing any feature.

It does **not** contain the task breakdown. After you review and approve this PRD, we generate `transform.md` with sequenced tasks and subtasks, ordered from most-essential functionality outward.

> **Important framing:** This is **not a greenfield build**. The repository already contains a real, tested backend and a high-fidelity frontend. The core problem is that the **frontend is a dummy** (hardcoded mock data, local React state) that is **not wired to the backend**, the **data model diverges from the new system-design.md**, and the **UI is not responsive on large screens**. The transformation is mostly *connect, reconcile, and adapt* — not *build from scratch*.

---

## 1. Current State (as found in the repo)

### 1.1 Architecture — what actually exists

A Turborepo monorepo, **not** the Next.js + Tailwind stack the system-design.md *recommends*. The existing stack is deliberately kept (per your instruction to maintain Mantine UI):

| Layer | Current technology | Notes |
|-------|-------------------|-------|
| Frontend | **Next.js 14 (App Router) + Mantine UI + react-icons (Phosphor)** | Keep. system-design.md suggests Tailwind — we override that and keep Mantine. |
| Backend | **Fastify + TypeScript** | Real, working, tested. |
| ORM / DB | **Prisma + PostgreSQL** | Real schema with 20 models, 5 migrations. |
| Shared | `packages/shared-types`, `packages/validation` (Zod), `packages/db`, `packages/config` | Workspaces. |
| Workers | `workers/queue` (BullMQ: notifications, PDF) | Present. |
| Auth | JWT access + refresh, bcrypt, RBAC middleware | **Real and working end-to-end.** |
| Infra | Docker, docker-compose (dev/prod), Coolify deploy configs, GitHub Actions | Present. |

Monorepo layout:
```
apps/web   — Next.js frontend (Mantine)
apps/api   — Fastify REST API (/api/v1/*)
packages/  — db (Prisma), shared-types, validation (Zod), config
workers/   — BullMQ queue worker
```

### 1.2 What genuinely works today (real, not dummy)

- **Authentication**: `/api/v1/auth/login`, `/register`, `/refresh`, `/forgot-password`; JWT stored in `localStorage`; auto-refresh every 14 min; `AuthProvider` + `getRoleRoute()` redirect by role.
- **Backend API surface** is broad and tested (Vitest test files alongside nearly every route). Existing endpoint groups: auth, users, customers, vehicles, work-orders, mechanic-operations (inspections/labour/parts), front-desk (check-in/out, invoices, payments), customer-portal, admin-analytics (revenue/KPIs/services/expenses/attendance), purchasing (suppliers/POs), settings, audit-logs, notifications, feedback, uploads, pesapal (online payments).
- **Notifications bell** in the dashboard shell calls `GET /api/v1/notifications` for real.
- **RBAC**: middleware enforces roles per route (`adminOnly`, `frontDeskOnly`, `mechanicOrAdmin`, `requireRoles(...)`).

### 1.3 What is dummy / not wired (the core problem)

Every role dashboard renders from **hardcoded mock arrays and local component state** — it does not read or write the backend:

| Page | State | Evidence |
|------|-------|----------|
| `app/(dashboard)/front-desk/page.tsx` | **Dummy** | `initialCustomers`, `initialVehicles`, `initialWorkOrders`, `initialAppointments`; all CRUD mutates `useState` only (only the "manual notification" call hits the API). |
| `app/(dashboard)/admin/page.tsx` (1,547 lines) | **Dummy** | `const initial...` mock data; no live KPIs. |
| `app/(portal)/customer/page.tsx` (888 lines) | **Dummy** | Mock data; only minimal API use. |
| `app/(dashboard)/mechanic/*` | **Dummy** | Local mechanic store (`lib/mechanic-store.tsx`). |

**Net:** the backend can do the work, the frontend looks finished, but they are not connected. Forms reset local state instead of persisting.

### 1.4 The responsiveness defect (explicit user complaint)

In [globals.css](./apps/web/src/app/globals.css):
- `.garage-content` is `width: min(100%, 1280px)` **with no horizontal centering** and lives inside a much wider `.garage-main` grid column. On large monitors the whole content column hugs the left, leaving a large empty band on the right → "cards occupy ~60% of viewport width."
- Grids like `.operations-grid` (2-up) and `.ds-stat-grid` (3-up) are capped and don't expand, compounding the wasted space.
- Mantine's responsive primitives (`SimpleGrid`, `Grid`, `Container`, `AppShell`) are largely bypassed in favor of hand-rolled CSS grid + a custom `DashboardShell`.

**Fix direction (to confirm in tasks):** center/fluidly cap the content column (e.g. `margin-inline: auto` with a sensible `max-width`, or a Mantine `Container size="xl"`/responsive), and let grids breathe with `auto-fit`/`SimpleGrid` breakpoints — while keeping Mantine and the current visual language.

### 1.5 Current data model (Prisma) — 20 models

`User` (roles: **admin, mechanic, front_desk, customer**), `CustomerProfile`, `Vehicle`, `WorkOrder`, `Inspection`, `LabourLog`, `PartsRequest`, `Invoice`, `Payment`, `PesapalTransaction`, `Appointment`, `Supplier`, `PurchaseOrder`, `Feedback`, `AuditLog`, `SystemSetting`, `Notification`, `Expense`, `Service`, `Attendance`.

`WorkOrderStatus` enum (current): `created → assigned → in_progress → awaiting_parts → completed → quality_check → invoiced → paid → collected`.

---

## 2. Target State (from system-design.md)

system-design.md describes a **leaner, front-desk-centric** model. Key principles:

1. **Three roles only**: `front_desk`, `customer`, `admin`. **Mechanics have NO accounts** — the front desk enters all mechanic findings on their behalf.
2. **Job (not "work order") status flow**: `registered → awaiting_approval → in_repair ⇄ quality_check → ready_for_pickup → completed`, plus terminals `completed` / `cancelled`.
3. **Phone-based approval**: customers review the report/footage in the portal, then **call** the front desk; the front desk **logs** approve/decline. Customers cannot approve in-app.
4. **No online payment**: customers can **view/download** invoices only. All payments recorded manually by front desk. (Diverges from current Pesapal integration.)
5. **Signup-by-link**: front desk registers a customer and emails a short-lived (48h) signed signup link tied to the job.
6. **Footage upload**: front desk uploads video/image findings (≤100MB; mp4/mov/jpg/png); customers view via secure URL.
7. **Service catalog + parts inventory** with stock + pricing; invoices auto-pull line items from `job_parts` + `job_services`, totaled server-side.
8. **Service reminders** scheduled on job completion (front desk sets the due date), delivered via **in-app + email + SMS**; reviews after pickup.
9. **Notifications** (in-app/email/SMS) on defined triggers (registered, awaiting_approval, cancelled, ready_for_pickup, reminder, completed). **SMS provider: EgoSMS** (https://egosms.co) via its JSON API.

### 2.1 Target schema (system-design.md) — 11 tables

`users`, `vehicles`, `jobs`, `job_findings`, `job_parts`, `job_services`, `parts`, `services`, `invoices`, `notifications`, `reviews`, `service_reminders`.

---

## 3. Gap Analysis — Current vs. Target

This is the heart of the document. Each row is a decision point.

### 3.1 Conceptual / model divergences (need a decision)

| # | Topic | Current | Target (system-design.md) | Proposed resolution |
|---|-------|---------|---------------------------|---------------------|
| G-1 | **Mechanic role** | `mechanic` is a full role with login, dashboard, labour logging, parts requests | **No mechanic accounts**; front desk enters findings | **Remove/retire mechanic role & dashboard.** Re-home inspection/findings entry under front desk. Decide: hard-delete vs. feature-flag-off. |
| G-2 | **Status vocabulary** | "Work order", statuses `created…collected` | "Job", statuses `registered…completed`/`cancelled` | **Adopt target status machine.** Rename concept to "Job" in UI; map/migrate enum; enforce `canTransition()` server-side with QC→in_repair loopback. |
| G-3 | **Approval** | Implicit in status flow; no phone-call logging | Customer calls; front desk logs approved/declined → `approval_status` | **Add explicit approval step + endpoint** `PATCH /jobs/:id/approval`. Portal is read-only for approval. |
| G-4 | **Online payment** | Pesapal integration (`PesapalTransaction`, IPN, redirect) | **No online payment** — view/download only | **Disable/remove Pesapal from the customer flow.** Keep manual `Payment` recording by front desk. (Confirm whether to delete Pesapal code or just hide it.) |
| G-5 | **Signup link** | Standard self-register endpoint | Emailed 48h signed token pre-filling email + tied to job | **Add signup-link issuance + token-gated signup.** |
| G-6 | **Parts model** | `PartsRequest` (free-text part name) + `PurchaseOrder`/`Supplier` procurement | `parts` inventory (stock, price) + `job_parts` line items | **Introduce `parts` inventory + `job_parts`.** Decide fate of supplier/PO procurement module (not in target — keep as admin extra or retire). |
| G-7 | **Services** | `Service` catalog exists (admin) | `services` + `job_services` line items on invoice | **Add `job_services` link + invoice auto-pull.** |
| G-8 | **Footage** | `Inspection.photos` (Json) | `job_findings.footage_urls` (array), video support, 100MB, secure customer view | **Extend uploads to video + larger size; expose secure customer view.** |
| G-9 | **Reviews/feedback** | `Feedback` model exists | `reviews` (post-pickup prompt) | **Reuse `Feedback` as reviews; add completion-triggered prompt.** |
| G-10 | **Service reminders** | Not modeled | `service_reminders` auto-scheduled on completion | **Add `service_reminders` + scheduler (BullMQ).** Front desk sets the reminder date at job completion; delivered via **in-app + email + SMS**. |
| G-11 | **Appointments** | Full appointments module (front desk + customer booking) | Not in target scope | **Keep as-is or de-scope?** Decision needed — target omits appointments. |

### 3.2 Frontend wiring gaps (mechanical, per page)

For every role page: **replace mock arrays with live API data** (React Query recommended by system-design.md), wire forms to real endpoints, handle loading/empty/error states, and enforce the target status flow in the UI.

| Surface | Mock today | Endpoints to wire (existing ✓ / new ✗) |
|---------|-----------|------------------------------------------|
| Front desk — register customer | mock | `POST /customers` ✓, signup-link issuance ✗ |
| Front desk — add vehicle | mock | `POST /customers/:id/vehicles` (or `POST /vehicles`) ✓ |
| Front desk — job/findings entry | mock | `POST /jobs/:id/findings` ✗ (current = inspections under mechanic) |
| Front desk — approval log | n/a | `PATCH /jobs/:id/approval` ✗ |
| Front desk — status advance + QC | local | `PATCH /jobs/:id/status` ✓ (rename/adapt), `PATCH /jobs/:id/qc` ✗ |
| Front desk — invoice generate | mock totals | `POST /jobs/:id/invoice` (auto line items) ✗ (current is manual totals) |
| Front desk — record payment | mock | `POST /payments` ✓ |
| Customer portal — jobs/report/footage | mock | `GET /portal/jobs`, `/portal/jobs/:id` ✓-ish (customer-portal exists; adapt) |
| Customer portal — invoices view/PDF | mock | `GET /portal/invoices` ✓, `GET /invoices/:id/pdf` ✓ |
| Customer portal — reviews | mock | `POST /portal/reviews` ✓ (feedback) |
| Admin — dashboard KPIs | mock | `GET /reports/dashboard-kpis`, `/reports/revenue` ✓ |
| Admin — staff mgmt | mock | `GET/POST/PATCH/DELETE /users` ✓ |
| Admin — inventory (parts) | mock | `GET/PATCH /admin/inventory` ✗ (parts model new) |
| Admin — service catalog | mock | `GET/POST /services` ✓ |
| Admin — notification log | partial | `GET /notifications` ✓ |

### 3.3 UI / responsiveness gaps

- Content column not centered/fluid on large screens (G — primary complaint).
- Hand-rolled CSS grids should lean on Mantine responsive primitives where it improves maintainability — **without abandoning Mantine or the current look**.
- Per old PRD acceptance criteria: usable at 1024px+, 768px+, 360px+.

---

## 4. Scope & guardrails for the transformation

**In scope**
- Reconcile data model + status machine to system-design.md.
- Wire every role page to the real API; remove mock data.
- Implement the missing pieces (signup link, approval logging, QC loopback, parts inventory + job line items, auto-invoice, footage video, reminders, reviews).
- Fix responsiveness across all dashboards while keeping **Mantine UI** and **react-icons (Phosphor)**.

**Explicitly preserved (your instruction)**
- Mantine UI as the component framework (override system-design.md's Tailwind suggestion).
- Existing monorepo, Fastify, Prisma, JWT auth, the working backend, and the current visual language.

**Decisions required from you before tasking (see §6).**

---

## 5. Proposed transformation strategy (sequencing preview)

Ordered from most-essential functionality outward. Detail becomes tasks/subtasks in `transform.md` after approval.

- **Phase 0 — Foundations & reconciliation:** lock the role set (drop mechanic?), the Job status machine + `canTransition()`, and the schema migration plan (Prisma) toward the target tables. Add a typed API client layer (React Query) so subsequent wiring is uniform.
- **Phase 1 — Core front-desk loop (the spine):** register customer (+ signup link) → register vehicle → create job → enter findings/footage → set `awaiting_approval` → log approval → `in_repair` → QC → `ready_for_pickup`. Wire to real endpoints, remove front-desk mock data.
- **Phase 2 — Billing:** parts inventory + service catalog → `job_parts`/`job_services` → server-side invoice generation → manual payment recording → invoice PDF/view. Remove online-payment path.
- **Phase 3 — Customer portal:** live jobs, report + footage viewer, invoice view/download, post-pickup review. Read-only approval (call-to-action to phone).
- **Phase 4 — Admin:** live KPIs/revenue, staff management, inventory & service catalog management, notification log, audit trail.
- **Phase 5 — Notifications & reminders:** wire the six triggers (email/SMS) and auto-scheduled service reminders via the existing BullMQ worker.
- **Phase 6 — Responsiveness & polish pass:** fix the content-width/centering defect, make all grids fluid, verify 1024/768/360 breakpoints, keep Mantine look.

> Each phase ends connected and demoable; mock data is deleted as each surface goes live (no half-wired pages left behind).

---

## 6. Decisions (confirmed 23 May 2026)

All resolved in favor of strict adherence to system-design.md:

1. **Mechanic role** — **Remove entirely.** Delete the mechanic dashboard, role, and its routes; re-home findings/inspection entry under front desk.
2. **Pesapal / online payments** — **Delete entirely.** Remove the Pesapal integration, `PesapalTransaction` model, and IPN routes. Payments are recorded manually by front desk only.
3. **Appointments module** — **De-scope.** Retire the appointments module (front desk + customer).
4. **Supplier / Purchase-order procurement** — **De-scope.** Retire suppliers + purchase orders.
5. **Schema approach** — **Adapt in place.** Extend/rename the existing schema toward the target via incremental Prisma migrations; preserve the working backend.
6. **"Work order" → "Job" terminology** — **Rename everywhere** (DB, API, UI) to "Job" with the target status values.
7. **Server state library** — **Adopt React Query** (`@tanstack/react-query`) for all data fetching across every page.

---

## 7. Acceptance criteria for "transformed"

1. No dashboard/portal page renders from hardcoded mock arrays — all data is live from `/api/v1/*`.
2. The Job status machine matches system-design.md (incl. QC→in_repair loopback) and is enforced server-side.
3. The full front-desk loop works end-to-end against the real DB (register → … → completed).
4. Customer portal shows real jobs, report, footage, and downloadable invoices; approval is phone-only.
5. Invoices are generated server-side from job parts + services; payments recorded manually.
6. Every system-design.md feature in §82–151 is represented by a working surface (nothing left out).
7. UI is responsive and uses the viewport sensibly at 1024px+, 768px+, 360px+ — content centered/fluid, no 60%-width dead band on large screens — while keeping Mantine + Phosphor icons.
8. RBAC holds (three roles); type-check, lint, unit, and E2E suites pass.

---

*Next step: you review this PRD. Once you confirm the §6 decisions and any scope edits, I generate `transform.md` with sequenced tasks and subtasks following the Phase 0–6 strategy above.*
