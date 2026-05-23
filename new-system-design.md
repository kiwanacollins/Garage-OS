# Garage Management System — System Design

## Overview

A web-based garage management system serving three roles: **Front Desk**, **Customer**, and **Admin**. The front desk is the central operator — they register customers, enter mechanic reports, manage invoices, and drive the job through every stage. Customers have a self-service portal for tracking jobs and viewing invoices. Admin has full operational and financial oversight.

---

## Roles & Access

| Role | Description |
|------|-------------|
| `front_desk` | Registers customers, enters mechanic findings, logs approvals, generates invoices, manages job stages |
| `customer` | Views job status, mechanic report & footage, invoices, service history; approves/declines via phone call |
| `admin` | Full system access — staff management, operations dashboard, finance reports, system settings |

> **Note:** Mechanics do not have system accounts. All mechanic findings are entered by the front desk on their behalf.

---

## Job Status Flow

Jobs move through exactly these statuses in order. The status field can move backwards only at the QC stage (fail loops back to `in_repair`).

```
registered
    ↓
awaiting_approval
    ↓
in_repair ←──────────────┐
    ↓                    │ (QC failed)
quality_check ───────────┘
    ↓ (QC passed)
ready_for_pickup
    ↓
completed
```

**Terminal statuses:**
- `completed` — job closed after customer picks up vehicle
- `cancelled` — customer declined repairs during approval stage

### Stage-by-Stage Detail

#### Stage 1 — Registration
- **Actor:** Front desk
- **Actions:** Register customer (name, email, phone), add car details (name, model, plate number), send signup link to customer's email
- **Outcome:** Job record created with status `registered`. Customer portal shows vehicle.

#### Stage 2 — Inspection
- **Actor:** Front desk
- **Actions:** Upload footage of findings, enter mechanic's report & recommendations, log spare parts needed, log services required
- **Outcome:** Status set to `awaiting_approval`. Customer can view report & footage on portal.

#### Stage 3 — Approval
- **Actors:** Customer (phone call) + Front desk (logs outcome)
- **Actions:** Customer reviews report/footage on portal, calls front desk, front desk logs approved or declined
- **Outcome:** If approved → `in_repair`. If declined → `cancelled`, customer notified.

#### Stage 4 — Repairs
- **Actor:** Front desk (tracks progress)
- **Actions:** Mechanic carries out repairs, front desk updates progress, spare parts usage recorded
- **Outcome:** When done, front desk advances status to `quality_check`

#### Stage 5 — Quality Check
- **Actor:** Front desk
- **Actions:** Marks QC as passed or failed. If failed → loops back to `in_repair`
- **Outcome:** QC passed → status `ready_for_pickup`, pick-up notification sent to customer

#### Stage 6 — Invoice & Payment
- **Actors:** Front desk + Customer
- **Actions:** Front desk generates invoice from job record, customer views/downloads invoice on portal, front desk records payment received
- **Outcome:** Payment recorded, invoice marked paid, admin can audit in finance dashboard

#### Stage 7 — Pick-up & Reminder
- **Actors:** Customer + Front desk
- **Actions:** Customer collects vehicle, front desk marks job `completed`, customer receives review prompt, service reminder scheduled
- **Outcome:** Job closed. Full history saved against vehicle. Visible in admin analytics.

---

## Features by Role

### Front Desk

**Customer Registration**
- Register new customer (name, email, phone number)
- Add car details (car name, car model, number plate)
- Send web-app signup link to customer via email

**Mechanic Report Entry**
- Upload video/image footage of findings
- Enter mechanic's report and recommendations
- Log spare parts needed (linked to inventory)
- Log services required (linked to service catalog)
- Record customer approval or rejection (outcome of phone call)

**Billing & Workflow**
- Generate invoice from job record (auto-pulls parts + services)
- Record payment received
- Mark quality check as passed or failed
- Send pick-up notification to customer
- Schedule next service reminder

---

### Customer

**Account & Vehicles**
- Sign up via emailed link and manage profile
- View all registered vehicles

**Job Tracking**
- View real-time job status
- View mechanic footage of findings
- Read mechanic report and recommendations
- Call front desk to approve or decline repairs (off-system, phone only)

**Invoices & History**
- View and download invoices (view only — no online payment)
- View full service history per vehicle

**Notifications**
- Receive pick-up ready notification (email/SMS)
- Receive scheduled service due reminders
- Rate and review service after pick-up

---

### Admin

**Staff Management**
- Create and manage staff accounts (front desk users)
- Assign and edit role permissions

**Operations Oversight**
- Dashboard of all active and past jobs
- Access all mechanic reports and footage
- Manage spare parts inventory and pricing
- Define service catalog and pricing

**Finance**
- Revenue reports (daily, weekly, monthly)
- Audit all invoices and recorded payments
- Customer and vehicle analytics

**System Settings**
- Configure notification templates (email/SMS)
- Manage garage profile and working hours

---

## Database Schema

### `users`
```
id              uuid PRIMARY KEY
name            varchar
email           varchar UNIQUE
phone           varchar
role            enum('front_desk', 'customer', 'admin')
password_hash   varchar
created_at      timestamp
```

### `vehicles`
```
id              uuid PRIMARY KEY
customer_id     uuid REFERENCES users(id)
car_name        varchar
car_model       varchar
number_plate    varchar UNIQUE
created_at      timestamp
```

### `jobs`
```
id              uuid PRIMARY KEY
vehicle_id      uuid REFERENCES vehicles(id)
customer_id     uuid REFERENCES users(id)
created_by      uuid REFERENCES users(id)   -- front desk user
status          enum('registered', 'awaiting_approval', 'in_repair',
                     'quality_check', 'ready_for_pickup', 'completed', 'cancelled')
approval_status enum('pending', 'approved', 'declined')
qc_status       enum('pending', 'passed', 'failed')
notes           text
created_at      timestamp
updated_at      timestamp
```

### `job_findings`
```
id              uuid PRIMARY KEY
job_id          uuid REFERENCES jobs(id)
report_text     text
recommendation  text
footage_urls    text[]   -- array of uploaded file URLs
created_by      uuid REFERENCES users(id)
created_at      timestamp
```

### `job_parts`
```
id              uuid PRIMARY KEY
job_id          uuid REFERENCES jobs(id)
part_id         uuid REFERENCES parts(id)
quantity        integer
unit_price      decimal
```

### `job_services`
```
id              uuid PRIMARY KEY
job_id          uuid REFERENCES jobs(id)
service_id      uuid REFERENCES services(id)
price           decimal
```

### `parts`
```
id              uuid PRIMARY KEY
name            varchar
description     text
unit_price      decimal
stock_quantity  integer
created_at      timestamp
```

### `services`
```
id              uuid PRIMARY KEY
name            varchar
description     text
price           decimal
created_at      timestamp
```

### `invoices`
```
id              uuid PRIMARY KEY
job_id          uuid REFERENCES jobs(id)
customer_id     uuid REFERENCES users(id)
total_amount    decimal
payment_status  enum('unpaid', 'paid')
payment_method  varchar    -- cash, bank transfer, etc.
paid_at         timestamp
generated_by    uuid REFERENCES users(id)
created_at      timestamp
```

### `notifications`
```
id              uuid PRIMARY KEY
user_id         uuid REFERENCES users(id)
type            enum('pickup_ready', 'service_reminder', 'signup_link', 'general')
channel         enum('email', 'sms')
message         text
sent_at         timestamp
status          enum('pending', 'sent', 'failed')
```

### `reviews`
```
id              uuid PRIMARY KEY
job_id          uuid REFERENCES jobs(id)
customer_id     uuid REFERENCES users(id)
rating          integer   -- 1 to 5
comment         text
created_at      timestamp
```

### `service_reminders`
```
id              uuid PRIMARY KEY
vehicle_id      uuid REFERENCES vehicles(id)
customer_id     uuid REFERENCES users(id)
remind_at       timestamp
sent            boolean DEFAULT false
```

---

## Tech Stack Recommendation

### Backend
- **Runtime:** Node.js with TypeScript
- **Framework:** Express.js or Fastify
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Auth:** JWT (access token + refresh token), bcrypt for password hashing
- **File uploads:** Multer → stored in Cloudinary or AWS S3 (footage & images)
- **Email:** Nodemailer or Resend
- **SMS:** Africa's Talking (suitable for Uganda) or Twilio

### Frontend
- **Framework:** Next.js (React) with TypeScript
- **Styling:** Tailwind CSS
- **State management:** Zustand or React Query for server state
- **PDF generation:** React-PDF or jsPDF (for invoice download)

### Infrastructure
- **Hosting:** Railway, Render, or VPS (DigitalOcean)
- **Database hosting:** Supabase (PostgreSQL) or Railway
- **File storage:** Cloudinary or AWS S3
- **Environment:** `.env` for secrets, never committed

---

## API Route Structure

### Auth
```
POST   /api/auth/login
POST   /api/auth/logout
POST   /api/auth/signup          -- customer signup via link
POST   /api/auth/refresh
```

### Jobs (front desk + admin)
```
GET    /api/jobs                 -- list all jobs (admin) or front desk's jobs
POST   /api/jobs                 -- create new job (register customer visit)
GET    /api/jobs/:id             -- get job detail
PATCH  /api/jobs/:id/status      -- advance or update job status
POST   /api/jobs/:id/findings    -- upload report, footage, parts, services
PATCH  /api/jobs/:id/approval    -- log customer approval/decline
PATCH  /api/jobs/:id/qc          -- mark QC passed or failed
```

### Invoices
```
POST   /api/jobs/:id/invoice     -- generate invoice
PATCH  /api/invoices/:id/pay     -- record payment received
GET    /api/invoices/:id         -- view invoice (customer + admin + front desk)
GET    /api/invoices/:id/pdf     -- download invoice as PDF
```

### Customers & Vehicles (front desk + admin)
```
GET    /api/customers            -- list customers
POST   /api/customers            -- create customer
GET    /api/customers/:id        -- customer profile + vehicles
POST   /api/customers/:id/vehicles   -- add vehicle
```

### Customer Portal (customer role only)
```
GET    /api/portal/jobs          -- my jobs
GET    /api/portal/jobs/:id      -- job detail with report & footage
GET    /api/portal/vehicles      -- my vehicles
GET    /api/portal/invoices      -- my invoices
POST   /api/portal/reviews       -- submit review after completion
```

### Admin
```
GET    /api/admin/dashboard      -- active jobs summary
GET    /api/admin/reports/revenue -- revenue by period
GET    /api/admin/staff          -- list staff
POST   /api/admin/staff          -- create staff account
GET    /api/admin/inventory      -- parts inventory
PATCH  /api/admin/inventory/:id  -- update part stock/price
GET    /api/admin/services       -- service catalog
POST   /api/admin/services       -- add service
```

### Notifications
```
POST   /api/notifications/send   -- manual trigger (internal)
GET    /api/notifications        -- notification log (admin)
```

---

## Notification Triggers (Automated)

| Event | Recipient | Channel | Template |
|-------|-----------|---------|----------|
| Customer registered | Customer | Email | Signup link |
| Status → `awaiting_approval` | Customer | Email/SMS | "Your report is ready — please call us" |
| Status → `cancelled` | Customer | Email/SMS | "Your job has been cancelled" |
| Status → `ready_for_pickup` | Customer | Email/SMS | "Your car is ready for collection" |
| Service reminder due | Customer | Email/SMS | "Your [car] is due for a service" |
| Job completed | Customer | Email | Review request |

---

## File Upload Handling

- Footage (video/images) uploaded by front desk during the findings entry step
- Stored in cloud storage (Cloudinary or S3), URL saved in `job_findings.footage_urls`
- Customers can view footage via secure URL from their portal
- Max file size: 100MB per file, accepted formats: mp4, mov, jpg, png

---

## Business Rules

1. Only front desk and admin can create or modify job records.
2. Customer approval/rejection is recorded by front desk after a phone call — customers cannot approve via the portal.
3. Customers can view invoices but cannot pay online — all payments are recorded manually by front desk.
4. A job cannot be invoiced until it reaches `ready_for_pickup` status.
5. QC failure loops the job back to `in_repair` — status history should be logged for audit trail.
6. A vehicle can only have one active (non-completed, non-cancelled) job at a time.
7. Service reminders are automatically scheduled when a job is marked `completed`.
8. Admin accounts are created only by other admins — not via the signup link flow.

---

## Folder Structure (Suggested Monorepo)

```
garage-system/
├── apps/
│   ├── web/                  # Next.js frontend
│   │   ├── app/
│   │   │   ├── (auth)/       # Login, signup pages
│   │   │   ├── front-desk/   # Front desk dashboard & job management
│   │   │   ├── portal/       # Customer portal
│   │   │   └── admin/        # Admin dashboard
│   │   └── components/
│   └── api/                  # Express/Fastify backend
│       ├── src/
│       │   ├── routes/
│       │   ├── controllers/
│       │   ├── services/
│       │   ├── middleware/
│       │   └── prisma/
│       └── prisma/
│           └── schema.prisma
├── packages/
│   └── types/                # Shared TypeScript types
└── package.json
```

---

## Key Implementation Notes for Claude Code

- Use **Prisma** for all database access — define the full schema in `schema.prisma` matching the tables above before generating any routes.
- Implement **role-based middleware** early — every route must check `req.user.role` before processing. Front desk cannot access admin routes and vice versa.
- The **job status machine** should be enforced server-side: build a `canTransition(currentStatus, newStatus)` utility that rejects invalid transitions before hitting the database.
- **Invoice generation** should pull line items from `job_parts` and `job_services` and compute totals server-side — never trust client-calculated totals.
- **File uploads** should be validated (type + size) before upload to cloud storage.
- Customer **signup links** should use a short-lived signed token (JWT with 48h expiry) that pre-fills the customer's email and ties back to the job record.
- Build the **customer portal** as a completely separate layout/section from the front desk UI — same codebase, different routes, different nav.
- All timestamps should be stored in UTC; display in local time (Africa/Kampala, UTC+3) on the frontend.
