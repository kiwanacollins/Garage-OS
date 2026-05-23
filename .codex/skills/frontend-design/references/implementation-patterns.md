# GarageOS Implementation Patterns

Use these patterns for `apps/web` unless the repo later changes its stack.

## Stack

- Next.js 14 App Router, React 18, TypeScript
- Mantine 8 for all component UI
- React Query (`@tanstack/react-query`) for all server state
- Plain global CSS (`globals.css`) + CSS modules for GarageOS-specific layout polish only
- `react-icons/pi` (Phosphor) for all icons

---

## Anti-AI-Slop Code Rules

These catch the "under the hood" tells that reveal AI-generated code. Every item below is a bug — fix it on sight.

### Comments
- Write **no comments** that describe what code does. `// Create a button` or `// Handle click` are banned.
- Comments exist only for non-obvious constraints, business-rule workarounds, or subtle invariants a future reader would not infer from the code alone.
- No multi-line comment blocks describing what a component renders.

### Console
- **No emoji in `console.log`** or anywhere in source code. `console.log('🚀 Server started')` is banned.
- Remove all debug `console.log` statements before committing.

### Logic
- No redundant variable declarations (`const x = x`).
- No deeply nested conditionals (3+ levels) for simple tasks — extract a helper or simplify the condition.
- No copy-pasted Mantine demo code adapted verbatim. Every component must be adapted to a real GarageOS workflow, label, and data shape.
- No unused imports after refactoring — clean them up in the same change.

### Interactions
- Every button, link, and `onClick` must have a real implementation. No `href="#"`, no empty `onClick={() => {}}`, no `// TODO: implement`.
- No toast notifications for synchronous local-state changes (tab switch, filter toggle, row select). Toasts only for async outcomes: save succeeded, save failed, SMS sent, upload complete.

### CSS
- No `box-shadow` with a colored glow (`rgba(99,102,241,0.5)` etc). Shadows are neutral grey only.
- No `border-radius` above 16px on layout containers. Pill radius (`9999px`) only on status badges and segmented controls.
- No background gradients on full-page or panel backgrounds — flat `#F8FAFC` / `#FFFFFF` only.
- No hardcoded color values that are not GarageOS brand tokens — use CSS custom properties from `:root` in `globals.css`.

---

## Next.js / React Workflow

- Build App Router pages under `apps/web/src/app`.
- Role routes: `(auth)/`, `(dashboard)/front-desk/`, `(dashboard)/admin/`, `(portal)/customer/`.
- Keep page components role-focused; extract repeated UI only after a second real use.
- No hardcoded mock arrays in pages — all data from React Query hooks backed by `/api/v1/*`.
- Use `@mantine/form` with Zod for multi-field forms. Plain `FormData` only for single-field trivial forms.
- Put typed arrays for statuses, nav items, and tab labels near the component that uses them.

## React Query Pattern

Mount `QueryClientProvider` once in `app/layout.tsx`. Build typed hooks per resource:

```tsx
// Typed query key convention
const jobKeys = {
  all: ['jobs'] as const,
  list: (filters?: JobFilters) => [...jobKeys.all, 'list', filters] as const,
  detail: (id: string) => [...jobKeys.all, 'detail', id] as const,
};

// Example query hook
export function useJobs(filters?: JobFilters) {
  const { accessToken } = useAuth();
  return useQuery({
    queryKey: jobKeys.list(filters),
    queryFn: () => apiRequest<JobsResponse>('/api/v1/jobs', {
      headers: { authorization: `Bearer ${accessToken}` },
    }),
    enabled: !!accessToken,
  });
}

// Example mutation hook
export function useCreateJob() {
  const queryClient = useQueryClient();
  const { accessToken } = useAuth();
  return useMutation({
    mutationFn: (body: CreateJobInput) =>
      apiRequest<Job>('/api/v1/jobs', {
        method: 'POST',
        headers: { authorization: `Bearer ${accessToken}` },
        body: JSON.stringify(body),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: jobKeys.all }),
  });
}
```

Always show loading, empty, error, and success states near the affected surface — never silently swallow errors.

## Theme Tokens

GarageOS CSS custom properties (in `globals.css`):

```css
:root {
  color-scheme: light;
  --brand-primary:      #3857a3;
  --brand-primary-dark: #1c2d5c;
  --brand-accent:       #ee1e24;
  --success:            #16a34a;
  --warning:            #f59e0b;
  --bg:                 #f8fafc;
  --surface:            #ffffff;
  --surface-muted:      #f1f5f9;
  --line:               #e5e7eb;
  --line-subtle:        #f1f5f9;
  --ink:                #0f172a;
  --muted:              #64748b;
  --muted-light:        #94a3b8;
  --radius-card:        16px;
  --radius-md:          12px;
  --shadow-card:        0 1px 3px rgb(0 0 0 / 0.04), 0 1px 2px rgb(0 0 0 / 0.02);
  --shadow-card-hover:  0 8px 25px rgb(0 0 0 / 0.07), 0 2px 6px rgb(0 0 0 / 0.04);
  --transition:         180ms ease;
  --font:               'Plus Jakarta Sans', Inter, ui-sans-serif, system-ui, sans-serif;
}
```

Use red sparingly: destructive actions, overdue items, rejected/cancelled states, urgent CTAs. Blue for navigation, active states, links, and primary actions.

## Responsiveness Rule

Content must be centered and fluid. Never left-anchor a capped column inside a wider layout:

```css
/* Correct — content centers on large screens */
.garage-content {
  width: min(100%, 1280px);
  margin-inline: auto;
  padding: 32px 40px 56px;
}
```

Use `SimpleGrid` with responsive `cols` rather than fixed CSS grid columns that leave empty space:

```tsx
<SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
  {stats.map(stat => <StatCard key={stat.label} {...stat} />)}
</SimpleGrid>
```

Target breakpoints: 1024px+ (full split pane), 768px (collapse secondary), 360px (single column, sticky bottom action).

## Operational Layouts

### Queue + Inspector

Use for: job list, customer register, invoice list, notification log, audit log.

- Left/main: searchable rows — status badge, vehicle plate (mono), customer name, job ID (mono), time (UTC+3), next action.
- Right rail: selected detail — findings summary, timeline, related records, primary action.
- Mobile: list first, detail opens as full-width section below or as a drawer.
- Sticky header row with sort/filter; keyboard-navigable rows; selected row gets `box-shadow: inset 3px 0 0 var(--brand-primary)`.

### Workbench

Use for: findings entry, invoice editing, QC decision, approval logging, payment recording.

- Top: compact context bar — job ID (mono), vehicle plate (mono), customer name, status badge, elapsed time.
- Center: task-specific form, tabs, footage upload, or document preview.
- Side/bottom: totals, action buttons, validation errors, activity log.

### Customer Portal Timeline

Use for: job tracking, service history.

- Lead with current vehicle + status badge.
- Horizontal stepper on desktop (7 job stages), vertical on mobile.
- Each step: label, sublabel, done/current/upcoming state.
- Invoice and footage accessible from the relevant stage.
- Approval step shows a blue callout: "Call us to approve or decline" — no action button.

### Analytics Pair (Admin)

Use for: dashboard KPIs, revenue reports, staff performance.

- Small KPI strip with counts/amounts, then chart + supporting table below.
- Every chart: date range selector, metric label, last refreshed timestamp.
- Avoid decorative charts that do not answer a decision.

## Job Status Badge

```tsx
const STATUS_COLORS: Record<JobStatus, string> = {
  registered:        'gray',
  awaiting_approval: 'orange',
  in_repair:         'blue',
  quality_check:     'orange',
  ready_for_pickup:  'green',
  completed:         'teal',
  cancelled:         'red',
};

<Badge color={STATUS_COLORS[job.status]} variant="light">
  {job.status.replace(/_/g, ' ')}
</Badge>
```

## Timestamp Display

Always display in Africa/Kampala (UTC+3). Do not display raw UTC strings:

```ts
export function formatKampala(utc: string) {
  return new Intl.DateTimeFormat('en-UG', {
    timeZone: 'Africa/Kampala',
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(utc));
}
```

Use JetBrains Mono for rendered timestamps in tables and detail rails.

## Signup-Link UI (Front Desk)

On the customer record, after registration:

```tsx
// Show sent state + resend action
<Group gap="sm">
  <Text size="sm" c="dimmed">Signup link sent {formatKampala(customer.linkSentAt)}</Text>
  <Button variant="subtle" size="compact-sm" onClick={resendLink}>Resend link</Button>
</Group>
```

On error, surface inline: "Failed to send — check email address". On success: Mantine notification toast.

## Service Reminder Scheduling (Job Completion)

At the "Mark collected / completed" step, show a date picker for the next service reminder:

```tsx
<DateInput
  label="Schedule next service reminder (optional)"
  placeholder="Pick a date"
  minDate={new Date()}
  clearable
  value={remindAt}
  onChange={setRemindAt}
/>
```

On submission, `POST /jobs/:id/complete` with `{ remindAt: isoString | null }`. Show a success toast: "Job completed. Reminder set for [date] via in-app, email & SMS."

## Footage Upload (Findings Entry)

Use `@mantine/dropzone` with video + image accept:

```tsx
<Dropzone
  accept={['video/mp4', 'video/quicktime', 'image/jpeg', 'image/png']}
  maxSize={100 * 1024 ** 2} // 100 MB
  onDrop={handleDrop}
>
  <Group justify="center" gap="xl" mih={120}>
    <PiVideoCamera size={32} />
    <div>
      <Text size="sm" fw={600}>Drop footage here or click to browse</Text>
      <Text size="xs" c="dimmed">mp4, mov, jpg, png — max 100 MB per file</Text>
    </div>
  </Group>
</Dropzone>
```

Show upload progress per file; preview thumbnails after upload; allow remove/retry; display empty state when no footage yet.

## Component Patterns

### Tables and Rows

- Identity columns first: customer name, vehicle plate (mono), job ID (mono).
- Status and owner in middle columns.
- Recency and next action in last columns.
- Row hover: `background: var(--accent-light); box-shadow: inset 3px 0 0 var(--brand-primary)`.
- Selected row: same, persistent.
- Mobile: rows may stack as cards only when columns cannot remain readable.

### Forms

- Group by real-world step: customer info → vehicle → job/service details → footage → confirmation.
- Inline validation beside the field; summary errors at submit for longer forms.
- Confirmation modal for: cancel job, delete record, mark collected, send signup link, record payment.
- Disable submit only when truly impossible; otherwise allow and report validation errors.

### Photo and Footage UI

- Upload: progress bar, file name, size, remove button, retry on failure.
- Preview: thumbnail grid (images), video player (video), secure URLs for customer portal.
- Invoice/report: amount, status badge, generated timestamp, print + download PDF buttons.

## Notification Bell

The `DashboardShell` bell already calls `GET /api/v1/notifications`. Unread count badge shows on top-right of the bell icon. Each item shows title + body + timestamp; click marks as read via `PATCH /api/v1/notifications/:id/read`.

For service reminders surfaced as in-app notifications, use type `service_reminder` and body: "Your [vehicle plate] is due for a service on [date]."

## Global Analyzer Loader

Use for all indeterminate loading. Do not introduce generic spinners, bouncing dots, or pulse blobs.

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

For full-page loading, center inside the existing page shell. For panel loading, keep it inside the affected region.

## Motion

Use 2-3 motions only when they improve comprehension:

- Entrance: toolbar/content fade + translate-up under 300ms.
- Selection: selected row highlights; detail rail slides/fades in.
- Workflow feedback: save, upload progress, status transition, export progress.

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

## Accessibility and QA

- One `h1` per page, landmarked `<main>`, logical heading hierarchy.
- Visible focus for every interactive control.
- Labels for every input, select, textarea, upload, and search field.
- `aria-live` for async save, upload, export, and status-update feedback.
- Color contrast AA minimum; never rely on color alone for status.
- 44px minimum tap targets on all interactive elements.
- Run `npm run type-check --workspace=@garage-os/web` after meaningful TSX changes.
- Run `npm run test --workspace=@garage-os/web` or targeted Playwright tests after workflow changes.
