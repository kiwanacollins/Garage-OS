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

## Global Analyzer Loader

Use this loader for all indeterminate loading states. Do not introduce generic spinners, bouncing dots, pulse blobs, or framework-default loaders. For determinate work such as uploads or exports, pair this loader with a progress value when the value is available.

Markup:

```tsx
<div className="global-analyzer-loader" role="status">
  <div className="global-analyzer-loader__stage" aria-hidden="true">
    <div className="global-analyzer-loader__track">
      <div className="global-analyzer-loader__roller" />
      <div className="global-analyzer-loader__roller" />
    </div>
    <div className="global-analyzer-loader__track">
      <div className="global-analyzer-loader__roller" />
      <div className="global-analyzer-loader__roller" />
    </div>
    <div className="global-analyzer-loader__track">
      <div className="global-analyzer-loader__roller" />
      <div className="global-analyzer-loader__roller" />
    </div>
  </div>
  <span className="sr-only">Loading</span>
</div>
```

CSS:

```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.global-analyzer-loader {
  --loader-size: 148px;
  --loader-height: 100px;
  --loader-duration: 1.2s;
  --loader-dot: var(--brand-primary, #3857a3);
  --loader-dot-alt: var(--brand-accent, #ee1e24);
  --loader-shadow: rgb(28 45 92 / 28%);
  display: inline-grid;
  place-items: center;
  width: var(--loader-size);
  min-height: var(--loader-height);
}

.global-analyzer-loader__stage,
.global-analyzer-loader__track {
  position: relative;
  width: var(--loader-size);
  height: var(--loader-height);
}

.global-analyzer-loader__track {
  position: absolute;
  inset: 0;
}

.global-analyzer-loader__track:nth-child(2) {
  --loader-delay: 0.15s;
}

.global-analyzer-loader__track:nth-child(3) {
  --loader-delay: 0.3s;
}

.global-analyzer-loader__track::after {
  content: "";
  position: absolute;
  bottom: 0;
  left: 0;
  width: 1rem;
  height: 0.25rem;
  border-radius: 999px;
  background: var(--loader-shadow);
  animation: analyzer-shadow var(--loader-duration) infinite linear;
  animation-delay: var(--loader-delay, 0s);
}

.global-analyzer-loader__roller {
  position: absolute;
  top: 0;
  left: 0;
  width: 70px;
  height: 70px;
  transform: rotate(135deg);
  animation: analyzer-roller-a var(--loader-duration) infinite linear;
  animation-delay: var(--loader-delay, 0s);
}

.global-analyzer-loader__roller:nth-child(2) {
  right: 0;
  left: auto;
  transform: rotate(-45deg);
  animation-name: analyzer-roller-b;
}

.global-analyzer-loader__roller::before {
  content: "";
  display: block;
  width: 15px;
  height: 15px;
  border-radius: 50%;
  background: var(--loader-dot);
  box-shadow: 0 0 0 4px rgb(56 87 163 / 10%);
}

.global-analyzer-loader__track:nth-child(2n) .global-analyzer-loader__roller::before {
  background: var(--loader-dot-alt);
  box-shadow: 0 0 0 4px rgb(238 30 36 / 10%);
}

@keyframes analyzer-roller-a {
  0% { transform: rotate(135deg); opacity: 1; }
  8% { transform: rotate(240deg); }
  20% { transform: rotate(300deg); }
  40% { transform: rotate(380deg); }
  45% { transform: rotate(440deg); }
  50% { transform: rotate(495deg); opacity: 1; }
  50.1%, 100% { transform: rotate(495deg); opacity: 0; }
}

@keyframes analyzer-roller-b {
  0%, 49.9% { opacity: 0; }
  50% { transform: rotate(-45deg); opacity: 1; }
  58% { transform: rotate(-160deg); }
  70% { transform: rotate(-240deg); }
  80% { transform: rotate(-300deg); }
  90% { transform: rotate(-340deg); }
  100% { transform: rotate(-405deg); opacity: 1; }
}

@keyframes analyzer-shadow {
  0% { transform: translateX(65px) scale(0.5); opacity: 0.3; }
  8% { transform: translateX(30px) scale(2); }
  13% { transform: translateX(0) scale(1.3); }
  30% { transform: translateX(-15px) scale(0.5); opacity: 0.1; }
  50% { transform: translateX(60px) scale(1.2); opacity: 0.3; }
  60% { transform: translateX(130px) scale(2); opacity: 0.05; }
  65% { transform: translateX(145px) scale(1.2); }
  80% { transform: translateX(120px) scale(0.5); opacity: 0.1; }
  90% { transform: translateX(80px) scale(0.8); }
  100% { transform: translateX(60px); opacity: 0.3; }
}
```

For full-page loading, center this inside the existing page shell. For local panel loading, keep the loader inside the affected region so operators know which data is pending.

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
