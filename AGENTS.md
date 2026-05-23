# GarageOS — Agent & Copilot Instructions

Use these rules whenever building or modifying code in this repository. They apply to Claude Code, GitHub Copilot, and any other AI agent working in this codebase.

---

## System Overview

GarageOS is a role-based garage management system. **Three roles only:**

| Role | Responsibility |
|------|---------------|
| `front_desk` | Registers customers, enters findings, drives every job stage, invoices, records payment, schedules reminders |
| `customer` | Self-service portal — tracks job, views report/footage, downloads invoices, submits reviews |
| `admin` | Full oversight — staff, operations, finance, inventory, settings |

> **Mechanics have no system accounts.** All mechanic findings are entered by front desk on their behalf. Do not build or reference a mechanic role, mechanic dashboard, or mechanic-specific routes.

---

## Job Status Machine

Jobs move through exactly these statuses. Enforce server-side via `canTransition()`:

```
registered → awaiting_approval → in_repair ⇄ quality_check → ready_for_pickup → completed
```

- QC **failed** loops `quality_check → in_repair`.
- **Cancel** only from `awaiting_approval` → `cancelled`.
- Terminals: `completed`, `cancelled`.
- Status history must be logged on every transition (audit trail).

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router), React 18, TypeScript |
| UI framework | **Mantine 8** — use first, always |
| Icons | `react-icons/pi` (Phosphor) — no Lucide React |
| Server state | **React Query** (`@tanstack/react-query`) — no raw `useEffect` + `useState` for server data |
| Backend | Fastify + TypeScript |
| ORM / DB | Prisma + PostgreSQL |
| Auth | JWT (access + refresh), bcrypt, RBAC middleware |
| Workers | BullMQ (notifications, reminders, PDF) |
| SMS | **EgoSMS** — `POST https://www.egosms.co/api/v1/json/` — creds: `EGOSMS_USERNAME`, `EGOSMS_PASSWORD`, `EGOSMS_SENDER_ID` |
| Email | Nodemailer |
| Timezone | Store UTC; display Africa/Kampala (UTC+3) everywhere |

---

## Hard Rules

### UI Framework
- **Mantine is mandatory** for dashboards, forms, tables, tabs, segmented controls, badges, modals, drawers, notifications, date inputs, dropzones, and layout primitives.
- Do not introduce another UI framework. Do not use Tailwind CSS. Map GarageOS brand tokens into the Mantine theme (`apps/web/src/theme.ts`).
- Keep custom CSS in `globals.css` limited to layout composition, selected-row affordances, and responsive polish.

### Icons
- Use `react-icons/pi` (Phosphor) for all new icons.
- Do not add or use Lucide React.
- Icons must communicate action or state — no ornamental icons.

### Data Fetching
- Use React Query (`useQuery`/`useMutation`) for all server data.
- No hardcoded mock arrays in page components — delete them as pages are wired to the API.
- Show loading, empty, error, and success states near every affected surface.

### Responsiveness
- Content must be **centered and fluid** — `margin-inline: auto` on capped width columns.
- Never left-anchor content in a wider grid leaving a dead band on the right.
- Use `SimpleGrid` with `cols={{ base: 1, sm: 2, lg: 3 }}` rather than fixed CSS grid columns.
- Verify at 1024px+, 768px, and 360px.

### Loading States
- Use the **GarageOS global analyzer loader** for all indeterminate loading.
- Do not use generic spinners, bouncing dots, pulse blobs, or framework-default loaders.

### Customer Portal — Approval
- Approval is **phone-only**. The customer portal must show a "Call us to approve or decline" callout.
- Never add an in-app approve/decline button on the customer portal.

### Notifications (three channels)
- Service reminders and event notifications are delivered via **in-app + email + SMS (EgoSMS)**.
- Reminder date is set by front desk at job completion.
- In-app: write a `Notification` row; the bell in `DashboardShell` already reads `/api/v1/notifications`.
- SMS body schema: `{ method: "SendSms", userdata: { username, password }, msgdata: [{ number, message, senderid }] }`.

### Invoice Generation
- Pull line items from `job_parts` + `job_services` **server-side**. Never trust client-calculated totals.
- Invoiceable only when job status ≥ `ready_for_pickup`.

### Footage Uploads
- Accepted: `mp4`, `mov`, `jpg`, `png`. Max: **100 MB per file**.
- Validate type + size before uploading to storage.
- Customer portal views footage via secure URL only.

### Signup Links
- Front desk triggers email; link uses a 48h signed JWT pre-filled with customer email + job ID.
- Show sent timestamp + resend affordance on the customer record.

### Timestamps
- Store UTC in the database.
- Display in Africa/Kampala (UTC+3) using `Intl.DateTimeFormat` with `timeZone: 'Africa/Kampala'`.
- Use JetBrains Mono for timestamp values in tables and detail rails.

### Security / RBAC
- Every route must check `req.user.role` via RBAC middleware before processing.
- `adminOnly`, `frontDeskOnly`, `requireRoles(...)` — no cross-role data leakage.
- Admin accounts created only by other admins — not via the signup-link flow.

---

## UI Framework — Mantine First

For app UI:

```tsx
// Layout primitives
import { AppShell, Container, SimpleGrid, Stack, Group, Paper } from '@mantine/core';

// Controls
import { Button, ActionIcon, TextInput, NumberInput, Select, Textarea, Badge, Tabs } from '@mantine/core';

// Overlays
import { Modal, Drawer, Menu, Tooltip } from '@mantine/core';

// Specialized
import { DateInput } from '@mantine/dates';
import { Dropzone } from '@mantine/dropzone';
import { notifications } from '@mantine/notifications';
import { useForm } from '@mantine/form';
```

Organize operational surfaces:
- **Primary workspace** — queue, table, form, job list.
- **Navigation** — left sidebar (240px, dark `#0F172A`).
- **Secondary context / inspector** — detail rail, timeline, notes.
- **One clear accent** — blue for action/state, red for urgent/destructive only.

Avoid: dashboard-card mosaics, thick borders on every region, decorative gradients behind routine product UI, multiple competing accent colors.

---

## Status Badge Pattern

```tsx
const STATUS_COLORS: Record<string, string> = {
  registered:        'gray',
  awaiting_approval: 'orange',
  in_repair:         'blue',
  quality_check:     'orange',
  ready_for_pickup:  'green',
  completed:         'teal',
  cancelled:         'red',
};

<Badge color={STATUS_COLORS[status]} variant="light">
  {status.replace(/_/g, ' ')}
</Badge>
```

---

## Out of Scope (do not build)

- Mechanic role, mechanic dashboard, mechanic-specific routes or UI.
- Pesapal / online payment integration.
- Appointment booking module.
- Supplier / purchase-order procurement module.

---

## Design Skill Reference

Full design guidance lives in `.codex/skills/frontend-design/`:
- `SKILL.md` — role definitions, job status machine, project defaults, Mantine rules, icon rules.
- `references/aesthetic-playbook.md` — visual directions per surface (Service Bay Command, Customer Portal, Admin Analytics, Notification surfaces, Brand moments).
- `references/implementation-patterns.md` — React Query patterns, responsive rules, component patterns, timestamp helpers, footage upload, loader markup, motion rules, accessibility and QA checklist.
