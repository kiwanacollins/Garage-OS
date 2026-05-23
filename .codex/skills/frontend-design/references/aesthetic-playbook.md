# GarageOS Aesthetic Playbook

Pick one direction per surface. GarageOS should feel capable, current, and operational — not like a generic SaaS template.

## Service Bay Command

Best for front desk job queue, job list, findings entry, approval logging, QC, and any operational workflow screen.

- Mood: controlled service floor, clean tools, crisp lighting, steady pace.
- Palette: `#F8FAFC` background, `#FFFFFF` surfaces, `#3857A3` structure, `#EE1E24` urgent accents, slate neutrals.
- Layout: left sidebar nav (240px), dense topbar with search, split workspace (queue + detail rail), sticky action rail, tables/list rows with strong scan columns (status → plate → customer → time → next action).
- Typography: Plus Jakarta Sans / Inter, 600-700 headings, JetBrains Mono for job IDs, number plates, invoice numbers, timestamps, and amounts.
- Motion: row selection reveal, detail rail slide-in, quiet save/status transition.
- Status badges: neutral (registered), amber (awaiting_approval, quality_check), blue (in_repair), green (ready_for_pickup, completed), red-muted (cancelled).

## Customer Self-Service Portal

Best for job status tracking, footage/report view, invoice download, review submission, and service reminder awareness.

- Mood: reassuring, transparent, polished — less dense than staff tools.
- Palette: white and soft primary tints, `#3857A3` for trust, red only for payment due or urgent notice.
- Layout: status timeline (horizontal on desktop, vertical on mobile), vehicle selector, report/footage viewer, invoice list, approval callout (phone-only, no in-app button).
- Typography: slightly more spacious line height and section spacing than staff screens.
- Motion: step progress on the job timeline, footage thumbnail load, status update reveal.
- Approval: show a blue info callout — "To approve or decline, call the front desk" — never an in-app action button.

## Owner Analytics (Admin)

Best for revenue dashboard, KPIs, staff management, inventory, finance audit, and settings.

- Mood: executive clarity without glossy decoration.
- Palette: `#3857A3` navigation, neutral chart surfaces, semantic colors for status; avoid rainbow dashboards.
- Layout: KPI strip only when it supports decisions, chart + table pairing, date-range filters, staff list, inventory table, export/download actions.
- Typography: strong numeric hierarchy (JetBrains Mono for amounts/counts), restrained headings.
- Motion: filter transition, chart redraw, export progress.

## Notification & Reminder Surfaces

Best for the notification bell dropdown, notification log, and service-reminder scheduling UI.

- Mood: calm, informational, never alarming by default.
- In-app notifications: compact dropdown with title + body, unread indicator (blue dot), mark-read on click.
- Service reminder scheduling (at job completion): date picker + channel confirmation; show "Reminder set for [date]" toast on save.
- Reminder delivery: in-app bell, email, and SMS (EgoSMS). UI shows channel icons next to each reminder.

## Public Brand Moment

Best for login page, signup-via-link flow, password reset, and any explicitly requested marketing page.

- Mood: modern auto-service confidence, real workshop context, trustworthy.
- Palette: `#3857A3` dominant, `#EE1E24` as action or highlight, dark overlay only when imagery needs contrast.
- Layout: full-bleed automotive/service imagery, narrow text column on a calm image area, one CTA.
- Typography: brand/product name is loudest; support copy stays short.
- Motion: hero entrance, subtle image depth, CTA focus transition.
- Signup-via-link: pre-filled email (read-only), clear password/name fields, brand trust signals.

## Avoid (general)

- Generic dashboard mosaics made only of cards.
- Decorative gradients behind routine operator screens.
- Multiple accent colors competing with status semantics.
- Stock-like imagery that does not show vehicles, service, people, or garage context.
- Campaign/marketing copy inside staff workflows.
- In-app approve/decline buttons on the customer portal — approval is phone-only.
- Left-anchored content with a dead band on the right side of large screens — content must be centered/fluid.
- Mechanic-role UI — mechanics have no accounts in this system.

---

## Anti-AI-Slop Visual Reference

The following patterns make a design immediately identifiable as AI-generated. They indicate a "technically sound but intentionally vacant" aesthetic — polished but personality-free. Every one of them is banned in GarageOS.

### Color
- **Banned:** indigo/purple neon (#6366F1, #8B5CF6, Tailwind indigo defaults), pastel gradients as background fills, glowing colored shadows (`box-shadow: 0 0 20px rgba(99,102,241,0.5)`).
- **GarageOS:** primary steel blue `#3857A3`, accent red `#EE1E24`, neutral slate. Colored shadows do not exist. Backgrounds are flat.

### Shape
- **Banned:** oversized rounding (`border-radius` 24px+) on layout containers, navbars, hero sections, and panels.
- **GarageOS:** 8px on controls, 12-16px on cards, pill only for status badges and segmented controls.

### Layout
- **Banned:** hero → badge → headline → subheadline → dual CTA → 3-card feature grid as a default pattern for any screen.
- **GarageOS:** operational screens start from the task surface — queue, table, form, or job card. The hero pattern is only for explicitly requested marketing pages.

### Effects
- **Banned:** glowing borders, luminous card edges, frosted glass panels stacked on top of each other, heavy backdrop-blur on routine panels.
- **GarageOS:** elevation via subtle grey shadow only (`0 1px 3px rgb(0 0 0/0.04)`). Blur only in the topbar backdrop.

### Space
- **Banned:** excessive whitespace used decoratively, making the page feel hollow or "premium by emptiness."
- **GarageOS:** density is a feature. Every pixel of whitespace must earn its place by aiding scan, grouping, or breathing room between distinct sections.

### Copy
- **Banned generic headings:** "Unlock Productivity", "Streamline Your Experience", "Next-Generation Platform", "Powerful and Flexible", "Everything You Need."
- **Banned generic CTAs:** "Get Started", "Learn More", "Discover", "Explore."
- **GarageOS:** every heading names a task or status. Every button says exactly what it does.

### Interactions
- **Banned:** hover animations on static text; toast for every click; shimmer skeleton on every element regardless of whether data is pending; buttons that go nowhere.
- **GarageOS:** motion only when it orients the user. Toasts only for async outcomes. Loader only when genuinely fetching.

### Imagery
- **Banned:** floating 3D object renders, abstract gradient blobs as "illustration," stock photo people who are clearly not mechanics or service staff.
- **GarageOS:** real automotive photography, actual workshop context, or no imagery at all on operational screens.

### The Litmus Test

Before shipping any surface, ask:
1. Could this layout have been produced by clicking "Generate UI" in any AI tool? If yes, make a specific design decision that breaks the pattern.
2. Does every heading describe exactly what the operator can do or see? If not, rewrite it.
3. Is there a button, link, or interaction with no real destination? Remove it or implement it.
4. Does any shadow glow, pulse, or use a color other than grey? Remove it.
5. Is there a badge + headline + CTA above a card grid on a non-marketing screen? Rethink the layout.
