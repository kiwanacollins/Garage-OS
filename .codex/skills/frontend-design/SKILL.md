---
name: frontend-design
description: Build or refine GarageOS web UI for a role-based garage management system. Use for Next.js/React screens, dashboards, forms, portals, operational workflows, landing pages, motion, responsive polish, and visual quality. Three roles only — admin, front_desk, customer. Prefer Mantine components for all app UI with calm, dense product surfaces for garage operations.
---

# Frontend Design

## GarageOS Design Intent

GarageOS is an operational workspace for automotive garages. Three roles drive the system:

- **Front desk** — the central operator: registers customers, enters mechanic findings, drives every job stage, invoices, records payment.
- **Customer** — self-service portal: tracks job status, views footage and report, downloads invoices, submits reviews.
- **Admin** — full oversight: staff, operations, finance, inventory, settings.

> Mechanics do **not** have system accounts. All findings are entered by the front desk on their behalf.

Default mode is product UI, not landing-page theatre. Start from the task surface: tables, status flows, forms, job cards, findings entry, invoice previews, timelines, and notifications.

## Job Status Flow (enforce in UI and backend)

```
registered → awaiting_approval → in_repair ⇄ quality_check → ready_for_pickup → completed
                                                ↑ QC failed loops back
terminals: completed / cancelled (cancel only from awaiting_approval)
```

Status badge colors:
- `registered`: neutral/slate
- `awaiting_approval`: amber — customer needs to call
- `in_repair`: blue — work in progress
- `quality_check`: amber — pending QC decision
- `ready_for_pickup`: green — car ready
- `completed`: green/muted — closed
- `cancelled`: red/muted — declined

## Before Building

Write these three lines before any substantial visual work:

- **Visual thesis:** one sentence describing the surface, mood, materials, and energy.
- **Content plan:** primary workspace, navigation, secondary context, primary action.
- **Interaction thesis:** 2-3 motions or state changes that improve orientation, not decoration.

## Project Defaults

- Stack: Next.js 14 App Router, React 18, TypeScript, Mantine 8 for app UI, plain CSS modules/global CSS only for GarageOS-specific layout polish.
- Existing path: `apps/web/src/app` with shared CSS in `apps/web/src/app/globals.css`.
- Server state: **React Query** (`@tanstack/react-query`) for all data fetching. Use `useQuery`/`useMutation` with typed query keys. No raw `useEffect` + `useState` for server data.
- Brand tokens from `new-system-design.md` and `tasks/prd.md`: primary `#3857A3`, accent `#EE1E24`, neutrals, success `#16A34A`, warning `#F59E0B`.
- Typography: Plus Jakarta Sans / Inter for UI; JetBrains Mono only for IDs, plates, timestamps, invoice numbers, metrics, or technical values.
- Radius: 6-8px for routine controls and panels; 12-16px for cards; pill only for status badges and segmented controls.
- Component priority: Mantine first for buttons, inputs, selects, tables, tabs, segmented controls, badges, modals, drawers, notifications, date/time inputs, dropzones, overlays, and layout primitives. Custom React/CSS only for GarageOS-specific composition Mantine cannot provide.
- Mantine packages: `@mantine/core`, `@mantine/hooks`, `@mantine/form`, `@mantine/dates`, `@mantine/notifications`, `@mantine/modals`, `@mantine/dropzone`.
- Icons: `react-icons/pi` (Phosphor) as default. Do not use Lucide React. Keep icons functional.
- Motion: plain CSS transitions by default. Framer Motion only if already in the project.
- Loading: use the GarageOS global analyzer loader. No generic spinners or bouncing dots.
- Timezone: display all timestamps in Africa/Kampala (UTC+3). Store UTC in the DB.

## Mantine Implementation Rule

For dashboards and operational screens, Mantine is the default UI framework:

- Start with Mantine primitives (`AppShell`, `Container`, `Grid`, `SimpleGrid`, `Stack`, `Group`, `Paper`, `Table`, `Tabs`, `Button`, `ActionIcon`, `TextInput`, `NumberInput`, `Select`, `Textarea`, `Badge`, `Modal`, `Drawer`, `Menu`, `Tooltip`, `SegmentedControl`, `ScrollArea`, `Notification`, `Dropzone`) before custom elements.
- Use `MantineProvider` theme tokens for brand color, radius, spacing, headings, focus rings, and component defaults. Theme is at `apps/web/src/theme.ts`.
- Keep operational density: compact sizes, predictable alignment, sticky detail rails, readable tables, restrained borders.
- Avoid Mantine demos copied verbatim — adapt to GarageOS workflows and copy.
- Use `@mantine/form` with Zod validation for all multi-field forms.
- Keep custom CSS focused on layout composition, selected-row affordances, responsive grids, and GarageOS-specific states.

## Responsiveness Rule

The primary defect to avoid: content must be **centered and fluid**, not left-anchored in a capped column. Use `margin-inline: auto` or Mantine `Container` responsive sizing so large screens don't produce a dead band on the right. Grids must use `auto-fit`/`SimpleGrid` breakpoints rather than fixed column counts that leave empty space.

Breakpoints:
- 1024px+: split panes, sticky toolbars, visible filters, full sidebar.
- 768px: collapse secondary context below or into a drawer; sidebar may become top-nav.
- 360px: single column, sticky bottom action for primary task, sidebar hidden.

## Icon Rule

```tsx
import { PiCarProfile, PiCalendarCheck, PiReceipt, PiCreditCard, PiWrench, PiClipboardText } from 'react-icons/pi';
```

GarageOS icon guidance:
- Vehicles/register: `PiCarProfile`, `PiIdentificationCard`, `PiGauge`
- Jobs/findings: `PiWrench`, `PiClipboardText`, `PiCamera`, `PiVideoCamera`
- Invoices/payments: `PiReceipt`, `PiCreditCard`, `PiMoney`
- Notifications/reminders: `PiBell`, `PiCalendarCheck`, `PiClock`
- Status/actions: `PiWarning`, `PiCheckCircle`, `PiSealCheck`, `PiProhibit`
- Admin/staff: `PiUsers`, `PiGear`, `PiChartBar`
- Keep icon size consistent: 16-18px inside compact controls, 20-24px for section affordances.

## Product UI Workflow

### 1) Identify the Role and Job

Anchor the screen to one role and one operational job:

- **Admin:** business visibility, staff management, job oversight, inventory, finance, settings.
- **Front desk:** customer registration (+ signup link dispatch), job creation, findings entry, approval logging, QC, invoice generation, payment recording, collection confirmation, reminder scheduling.
- **Customer portal:** job status timeline, footage/report viewer, invoice download, review submission, service reminder awareness.

Approval is **phone-only** in the customer portal — show a "call us to approve" callout, never an in-app approve button.

### 2) Compose the Working Surface

- Lead with the active workflow, queue, table, form, or status board.
- Use persistent navigation plus one secondary context area when useful: detail rail, timeline, or activity log.
- Use cards only when the card is the interaction (job card, invoice preview, footage tile).
- Prefer plain layout, dividers, tables, list rows, sticky toolbars, and split panes over dashboard-card mosaics.
- Scan points: status badge, vehicle plate (mono), customer name, job ID (mono), time (UTC+3), next action.

### 3) Build States, Not Just Screens

Include expected states:

- loading (global analyzer loader), empty, error, unauthorized, stale/offline, success, pending approval, disabled.
- Job status badges for all 7 states: `registered`, `awaiting_approval`, `in_repair`, `quality_check`, `ready_for_pickup`, `completed`, `cancelled`.
- Timestamps formatted to Africa/Kampala.
- Confirmation for destructive or irreversible actions (cancel job, delete record, mark collected).
- Signup-link sent / resend affordance on the customer record.
- Service reminder scheduled confirmation when completing a job.

### 4) Polish and Verify

- Accessibility: one `h1`, logical headings, visible focus, labeled fields, readable tables, `aria-live` for status changes.
- Responsive: content centered/fluid at 1024/768/360 — no left-anchored dead band on large screens.
- Copy: utility language throughout. No campaign copy inside operational screens.
- Brand blue carries structure; red reserved for urgent, destructive, overdue, or strong CTA.
- After workflow changes, run type-check (`npm run type-check --workspace=@garage-os/web`) and Playwright E2E.

## Landing and Brand Pages

Use only for public pages, auth-adjacent brand moments, or explicitly requested marketing pages:

- Full-bleed hero or dominant visual plane; brand first, promise second, action third.
- One strong real-looking automotive/service image.
- Short copy, one visual idea per section, no hero cards.
- Hero must fit first viewport with any persistent header counted.

## References

- `references/aesthetic-playbook.md`: GarageOS-specific visual directions and when to use each.
- `references/implementation-patterns.md`: Next.js/React patterns, operational layouts, CSS tokens, states, responsive checks, and QA.
- `new-system-design.md`: canonical roles, job status machine, DB schema, API routes, and business rules.
