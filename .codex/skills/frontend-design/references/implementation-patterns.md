# GarageOS Implementation Patterns

Use these patterns for `apps/web` unless the repo later adopts a component library or Tailwind.

## Next.js / React Workflow

- Build App Router pages under `apps/web/src/app`.
- Keep page components role-focused; extract repeated UI only after a second real use.
- Prefer plain CSS classes in `globals.css` or route-scoped CSS modules if the screen grows large.
- Put repeated data such as statuses, tabs, filters, and nav items in typed arrays before mapping.
- Use native form controls first. Add custom controls only when they improve speed or clarity.
- For API-backed UI, show loading, empty, error, unauthorized, and success states near the affected surface.

## Theme Tokens

Start CSS with GarageOS tokens and aliases:

```css
:root {
  color-scheme: light;
  --brand-primary: #3857a3;
  --brand-primary-dark: #1c2d5c;
  --brand-accent: #ee1e24;
  --success: #16a34a;
  --warning: #f59e0b;
  --bg: #f8fafc;
  --surface: #ffffff;
  --surface-muted: #f1f5f9;
  --line: #cbd5e1;
  --text: #0f172a;
  --muted: #64748b;
  --radius: 8px;
  --ease: cubic-bezier(0.2, 0.8, 0.2, 1);
}
```

Use red sparingly: destructive actions, overdue items, rejected states, urgent CTAs. Use blue for navigation, active states, links, and primary actions.

## Operational Layouts

### Queue + Inspector

Use for customers, vehicles, work orders, parts requests, notifications, audit logs.

- Left/main: searchable rows with status, owner, vehicle, time, and next action.
- Right: selected detail rail with timeline, notes, related records, and primary action.
- Mobile: list first, selected detail opens as a full-width section or route.

### Workbench

Use for mechanic job card detail, invoice editing, inspection forms, appointment booking.

- Top: compact context bar with ID, vehicle, customer, status, freshness.
- Center: task-specific form, tabs, checklist, or document preview.
- Side/bottom: actions, validation, totals, notes, or activity.

### Analytics Pair

Use for admin dashboard and reports.

- Combine a small KPI strip with chart + supporting table.
- Every chart needs date range, metric label, and last refreshed time.
- Avoid decorative charts that do not answer a decision.

### Customer Timeline

Use for portal tracking and service history.

- Lead with current vehicle/status.
- Use a vertical or horizontal lifecycle timeline.
- Keep invoice/payment/action close to the relevant service event.

## Component Patterns

### Status Badge

- Small, stable width where possible.
- Semantic color, not arbitrary role color.
- Text must match backend states exactly enough for operators to recognize it.

Suggested mapping:

- `created`, `assigned`: blue/neutral.
- `in_progress`: blue.
- `awaiting_parts`, `quality_check`: amber.
- `completed`, `paid`, `collected`: green.
- `invoiced`: primary blue.
- rejected/overdue/error: red.

### Tables and Rows

- First columns should answer identity: customer, vehicle, plate, work order.
- Middle columns should answer status and owner.
- Last columns should answer recency and next action.
- Keep row actions visible on hover/focus for desktop; visible or menu-based on mobile.

### Forms

- Group by real-world step: customer, vehicle, service concern, photos, payment.
- Show inline validation beside the field and summary errors at submit when useful.
- Disable submit only when truly impossible; otherwise allow submit and report validation.
- Use confirmation for checkout, invoice finalization, payment recording, deletion, and role changes.

### Photo and Document UI

- Inspection/check-in photos need upload progress, preview, remove, retry, and empty state.
- Invoice/report previews need amount, status, generated time, and print/download actions.

## Motion

Use 2-3 motions only when they improve comprehension:

- Entrance: page toolbar/content fade and translate in under 300ms.
- Selection: selected row highlights and detail rail slides/fades in.
- Workflow feedback: save, upload, timer, status transition, or export progress.

Always include:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    scroll-behavior: auto !important;
    transition-duration: 0.01ms !important;
  }
}
```

## Responsive Rules

- Desktop: favor split panes, sticky toolbars, and visible filters.
- Tablet: keep primary workspace first; collapse secondary context below or into a drawer.
- Mobile: single column, sticky bottom action when the main task is form completion or approval.
- Preserve 44px tap targets and avoid hover-only affordances.
- Tables may become row cards only when columns cannot remain readable.

## Accessibility and QA

- One `h1`, landmarked `main`, logical headings.
- Visible focus for every interactive control.
- Labels for every input, select, textarea, upload, and search field.
- `aria-live` for async save, upload, export, and status-update feedback.
- Color contrast AA minimum; do not rely on color alone for statuses.
- Run `npm run type-check --workspace=@garage-os/web` after meaningful TSX changes when feasible.
- Run `npm run test --workspace=@garage-os/web` or targeted Playwright tests after workflow changes when feasible.
