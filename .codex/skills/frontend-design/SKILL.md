---
name: frontend-design
description: Build or refine GarageOS web UI for a role-based garage management system. Use for Next.js/React screens, dashboards, forms, portals, operational workflows, landing pages, motion, responsive polish, accessibility, and visual quality. Prefer Mantine components first for app UI, with calm, dense product surfaces for garage operations over generic SaaS or decorative marketing layouts.
---

# Frontend Design

## GarageOS Design Intent

GarageOS is an operational workspace for automotive garages: admin, front desk, mechanics, and customers need speed, clarity, trust, and strong role boundaries. Design for people checking in vehicles, assigning work, logging inspections, requesting parts, collecting payment, and tracking service status.

Default mode is product UI, not landing-page theatre. Start from the task surface: tables, status, forms, queues, job cards, filters, timelines, documents, and notifications.

## Before Building

Write these three lines before any substantial visual work:

- **Visual thesis:** one sentence describing the surface, mood, materials, and energy.
- **Content plan:** primary workspace, navigation, secondary context, primary action.
- **Interaction thesis:** 2-3 motions or state changes that improve orientation, not decoration.

## Project Defaults

- Stack: Next.js 14 App Router, React 18, TypeScript, Mantine 8 for app UI, and plain CSS modules/global CSS only for GarageOS-specific layout polish.
- Existing path: `apps/web/src/app` with shared CSS in `apps/web/src/app/globals.css`.
- Brand tokens from `tasks/prd.md`: primary `#3857A3`, accent `#EE1E24`, neutrals, success `#16A34A`, warning `#F59E0B`.
- Typography: Inter/system for UI, JetBrains Mono only for IDs, plates, timestamps, invoice numbers, metrics, or technical values.
- Radius: 6-8px for routine controls and panels. Avoid pill-heavy interfaces unless the element is a status badge or segmented control.
- Component priority: use Mantine first for buttons, inputs, selects, tables, tabs, segmented controls, badges, modals, drawers, notifications, date/time inputs, dropzones, overlays, and layout primitives. Add custom React/CSS only when the workflow needs a GarageOS-specific composition that Mantine does not provide directly.
- Mantine packages: prefer `@mantine/core`, `@mantine/hooks`, `@mantine/form`, `@mantine/dates`, `@mantine/notifications`, `@mantine/modals`, and `@mantine/dropzone` before adding new UI dependencies.
- Icons: use an installed icon library when present; otherwise keep controls textual and clear instead of adding custom decorative SVGs. Do not add an icon library solely for ornament.
- Motion: plain CSS transitions by default. Add Framer Motion only if the project already has it or the user explicitly wants it.
- Loading indicators: use the GarageOS global analyzer loader only. Do not add generic spinners, bouncing dots, pulse blobs, or framework-default loaders. See `references/implementation-patterns.md`.

## Mantine Implementation Rule

For dashboards and operational screens, Mantine is the default UI framework. When building or refactoring UI:

- Start with Mantine primitives (`AppShell`, `Container`, `Grid`, `Stack`, `Group`, `Paper`, `Table`, `Tabs`, `Button`, `ActionIcon`, `TextInput`, `NumberInput`, `Select`, `Textarea`, `Badge`, `Modal`, `Drawer`, `Menu`, `Tooltip`, `SegmentedControl`, `ScrollArea`, `Notification`, `Dropzone`) before custom elements.
- Use `MantineProvider` theme tokens for GarageOS brand color, radius, spacing, headings, focus rings, and component defaults.
- Keep operational density: compact sizes, predictable alignment, sticky/detail rails, readable tables, and restrained borders.
- Avoid Mantine demos copied verbatim. Adapt components to GarageOS workflows and copy.
- Prefer Mantine Forms for complex forms and Zod-compatible validation paths; simple `FormData` forms are acceptable only for prototypes or very small surfaces.
- Keep custom CSS focused on layout composition, selected-row affordances, responsive grids, and GarageOS-specific states.

## Product UI Workflow

### 1) Identify the Role and Job

Anchor the screen to one role and one operational job:

- **Admin:** business visibility, staff workload, assignment, approvals, audit, settings.
- **Front desk:** customer lookup, vehicle intake, appointments, invoices, payment, collection.
- **Mechanic:** assigned job cards, inspection, labour timer, parts requests, completion notes.
- **Customer:** appointment booking, service status, invoices, service history, feedback.

Prefer utility copy: headings, labels, counts, freshness, filters, and next actions. Avoid campaign language inside operational screens.

### 2) Compose the Working Surface

- Lead with the active workflow, queue, table, form, or status board.
- Use persistent navigation plus one secondary context area when useful: inspector, detail rail, timeline, or activity log.
- Use cards only when the card is the interaction, such as a job card, invoice preview, customer result, or photo tile.
- Prefer plain layout, dividers, tables, list rows, sticky toolbars, and split panes over dashboard-card mosaics.
- Keep density high enough for real garage work, but make scan points obvious: status, owner, vehicle, time, amount, next action.

### 3) Build States, Not Just Screens

Include expected states for real workflows:

- loading, empty, error, unauthorized, stale/offline, success, pending approval, and disabled states.
- indeterminate loading uses the global analyzer loader with an accessible status label.
- status badges for work order lifecycle: created, assigned, in progress, awaiting parts, completed, quality check, invoiced, paid, collected.
- timestamps and freshness where operational decisions depend on recency.
- confirmation for destructive or irreversible actions.

### 4) Polish and Verify

- Accessibility: one `h1`, logical headings, visible focus, labeled fields, readable tables, `aria-live` for save/status changes.
- Responsive: desktop split panes collapse into stacked sections; primary action remains reachable on mobile; tap targets are at least 44px.
- Copy check: if headings/labels/numbers alone cannot orient the operator, tighten the UI.
- Visual check: brand blue should carry structure; red is reserved for urgent, destructive, overdue, or strong CTA states.
- Test after frontend groups with Playwright when user flows are changed.

## Landing and Brand Pages

Use this mode only for public pages, auth-adjacent brand moments, or explicitly requested landing pages.

- Full-bleed hero or dominant visual plane; brand first, promise second, action third.
- One strong real-looking automotive/service image or generated bitmap visual if imagery is needed.
- Short copy, one visual idea per section, no hero cards, no stat-strip clutter.
- Hero must fit first viewport with any persistent header counted.
- Keep the offer grounded in garage operations, service trust, vehicle care, appointment booking, or customer visibility.

## References

- `references/aesthetic-playbook.md`: GarageOS-specific visual directions and when to use each.
- `references/implementation-patterns.md`: Next.js/React patterns, operational layouts, CSS tokens, states, responsive checks, and QA.
