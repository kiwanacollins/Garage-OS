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

The following patterns make a design immediately identifiable as AI-generated. They indicate a "technically sound but intentionally vacant" aesthetic — polished on first glance, but after 30 seconds nothing feels memorable, intentional, or connected to what GarageOS actually does. Every pattern below is banned.

### Color
- **Banned:** indigo/purple neon (`#6366F1`, `#8B5CF6`, Tailwind indigo defaults), pastel gradients as background fills, glowing colored shadows (`box-shadow: 0 0 20px rgba(99,102,241,0.5)`).
- **GarageOS:** primary steel blue `#3857A3`, accent red `#EE1E24`, neutral slate. Colored shadows do not exist. Backgrounds are flat `#F8FAFC` / `#FFFFFF`.

### Shape & Effects
- **Banned:** `border-radius` 24px+ on layout containers, navbars, hero sections, or panels. Glassmorphism. Frosted-glass cards stacked on each other. Animated blobs. Neon glow borders. Floating cards with heavy drop shadows.
- **GarageOS:** 8px on controls, 12-16px on cards, pill (`9999px`) only for status badges and segmented controls. Elevation is subtle neutral grey only (`0 1px 3px rgb(0 0 0/0.04)`). Backdrop blur only in the topbar.

### Layout
- **Banned as default patterns:**
  - Hero → badge → headline → subheadline → dual CTA → 3-column feature grid.
  - "Trusted by logos" strip after the hero.
  - Testimonials section → pricing section → FAQ → CTA footer repeated on every page.
  - Bento grid layouts used for operational data.
  - 3-column feature grid → another 3-column grid → another 3-column pricing grid (repetitive algorithmic sections).
  - Perfect symmetry everywhere: equally weighted cards, identical column widths, everything centered.
- **GarageOS:** operational screens start from the task surface — queue, table, form, job card. Section patterns above are only permitted on explicitly requested marketing pages. Asymmetric hierarchy is intentional: not everything deserves equal visual weight.

### Space & Hierarchy
- **Banned:** excessive hollow whitespace used as decoration to feel "premium." Uniform mechanical spacing where every section, card, and padding value is identical — making everything equally important and therefore nothing scannable.
- **GarageOS:** density is a feature. Whitespace is used to group, separate, and direct attention — not to fill screen. Intentional visual imbalance creates hierarchy: primary data is large, secondary is smaller, metadata is muted.

### Copy
- **Banned generic headings:** "Unlock Productivity", "Streamline Your Experience", "Next-Generation Platform", "Powerful and Flexible", "Everything You Need", "Seamless Digital Experiences", "Empowering businesses with innovative solutions", "Transform your workflow."
- **Banned generic CTAs:** "Get Started", "Learn More", "Discover", "Explore."
- **The copy test:** after reading a heading, you must know what this screen does, who it is for, and why it matters. If you cannot answer all three, rewrite it.
- **GarageOS:** every heading names a task, status, or entity. Every button says exactly what happens on click.

### Interactions & Animation
- **Banned:** scroll-reveal fade-in on every section. Floating animated elements. Hover effects on static text or decorative icons. Every section animating. Excessive transitions that trigger on page load without user action.
- **GarageOS:** motion only when it orients the user (row selection reveal, detail rail slide, upload progress). 2-3 intentional motions per surface maximum. If removing an animation makes no difference to usability, it should not exist.

### Imagery
- **Banned:** floating 3D object renders, abstract gradient blobs as "illustration," AI-generated people with slightly wrong hands or overly smooth skin, generic office scenes with no garage context, team photos that have no presence elsewhere.
- **GarageOS:** real automotive photography, actual workshop context, or no imagery at all on operational screens.

### Cross-Page Consistency
- **Banned:** sections generated independently that produce inconsistent typography, mixed icon sets (Phosphor on one page, Heroicons on another), different spacing systems between pages, random UX decisions that break patterns established elsewhere.
- **GarageOS:** every page uses the same DashboardShell, the same Mantine theme tokens, the same Phosphor icons, the same spacing scale. Consistency is non-negotiable.

### The Soulless-Perfection Test

The single strongest tell of AI-generated UI: **the site looks impressive on first load, but after 30 seconds nothing feels memorable, intentional, or connected to what the business actually does.**

Before shipping any surface, run this check:

1. **Memorability:** Would an operator remember this screen's layout after using it once, because it fits the task so precisely? If not, it is too generic.
2. **Specificity:** Does every label, heading, and button refer to something real in GarageOS — a job, a vehicle, a customer, a part, an invoice? If it could apply to any SaaS product, rewrite it.
3. **Hierarchy:** Is there intentional visual imbalance — one dominant element per surface, supporting details smaller, metadata muted? If everything is equally weighted, break the symmetry deliberately.
4. **Wiring:** Is every button, link, and interaction backed by a real implementation? If not, remove or implement it.
5. **Pattern check:** Remove all color and shadow. Does the layout still communicate structure through spacing, size, and type weight alone? If structure collapses without decoration, the composition is weak.
6. **Copy check:** Read every heading aloud. Does it tell you what this screen does, who it serves, and why it matters in under 5 seconds? If not, it is AI copy.
7. **Shadow/glow check:** Does any shadow use a color other than grey or have a spread above 8px? Remove it.
8. **Repetition check:** Count how many times the same card layout or column pattern appears in sequence. If 3+ identical grid patterns stack, the layout is algorithmic. Vary it.
