# DESIGN.md — ERP Frontend Design System & Build Spec

> Audience: AI coding agent. Build every ERP page (Login, Dashboard, Shipments, Orders, Inventory, etc.) so they look and behave like the reference "Shipments Monitor" screen. When in doubt, follow this file over your own defaults.

---

## 1. Design Character

- **Style:** Clean, modern, light-mode SaaS. Airy white surfaces, soft borders, almost no heavy shadows.
- **Density:** Medium-high. Data-rich but never cramped; generous inner padding on cards, tight text hierarchy.
- **Mood:** Professional logistics/operations tool. Status colors carry meaning; the ENTRIX brand blue is used sparingly as the accent.
- **Key traits:**
  1. App chrome (sidebar + header) is quiet and neutral.
  2. Color is reserved for **status** and **primary action/active state** (brand blue).
  3. Rounded corners everywhere (10–16px), 1px light-gray borders instead of shadows.
  4. Small, gray secondary text paired with bold primary values.

---

## 2. Tech Stack (recommended)

- React 18 + TypeScript + Vite (or Next.js App Router)
- Tailwind CSS with the tokens below in `tailwind.config`
- shadcn/ui (Radix) for primitives; `lucide-react` for icons
- TanStack Table (tables), TanStack Query (data), React Hook Form + Zod (forms)
- Map: MapLibre GL or Leaflet with a light, desaturated basemap (Carto Positron style)
- Charts: Recharts

---

## 3. Design Tokens

### 3.1 Colors

| Token | Hex | Usage |
|---|---|---|
| `--bg-app` | `#F4F6F9` | Page background behind main container |
| `--bg-surface` | `#FFFFFF` | Cards, panels, header, sidebar |
| `--bg-subtle` | `#F8FAFC` | Inputs, hover rows, table header |
| `--border` | `#E6E9EF` | All 1px borders and dividers |
| `--text-primary` | `#111827` | Titles, numbers, values |
| `--text-secondary` | `#6B7280` | Labels, captions, meta |
| `--text-muted` | `#9CA3AF` | Placeholders, timestamps |
| `--brand` | `#1765F5` | Primary brand blue: active nav icon, primary buttons, links |
| `--brand-deep` | `#073DB8` | Gradient end, pressed states |
| `--brand-navy` | `#071B49` | Logo tile, headings on marketing/login, dark surfaces |
| `--brand-soft` | `#E8F0FF` | Active nav pill background |
| `--info` | `#2F6BFF` | On Track, links, focus ring, map blue dots |
| `--info-soft` | `#E8F0FF` | Info tint |
| `--warning` | `#F5A623` | At Risk |
| `--warning-soft` | `#FFF4DB` | Warning tint |
| `--danger` | `#E5484D` | Delayed, errors, destructive |
| `--danger-soft` | `#FDECEC` | Danger tint |
| `--success` | `#16A34A` | Delivered / completed |
| `--success-soft` | `#E7F6EC` | Success tint |
| `--accent-purple-soft` | `#EEEBFF` | "Total/Overview" KPI icon bubble |

**Status mapping (use everywhere):**
- On Track → info (blue) · At Risk → warning (amber) · Delayed → danger (red) · Delivered → success (green) · Draft/Pending → neutral gray.

### 3.2 Typography
- Font: **Inter** (fallback `system-ui, sans-serif`).
- Scale:
  - Page title: 18px / 600
  - Section title (panel heading): 16px / 600
  - KPI number: 24px / 700
  - Body / card text: 13–14px / 400–500
  - Caption / meta: 11–12px / 400, `--text-secondary`
  - Badge text: 12px / 500
- Tabular numerals for IDs, quantities, weights, and times (`font-variant-numeric: tabular-nums`).

### 3.3 Spacing, Radius, Elevation
- Spacing base: 4px. Common: 8, 12, 16, 20, 24.
- Radius: inputs/buttons `10px`, cards `12px`, main container `16px`, badges `6px`, pills/avatars `999px`.
- Elevation: cards = `border 1px --border` only. Floating panels over maps = `0 4px 16px rgba(16,24,40,.08)`. Modals = `0 12px 40px rgba(16,24,40,.16)`.

### 3.4 Icons
- `lucide-react`, 20px in nav, 16px inline, stroke 1.75, color `--text-secondary` (inactive).

---

### 3.5 Brand & Logo (ENTRIX ERP)
- Asset: `entrix-logo.svg` (viewBox 1280×360). Emblem = navy `#071B49` rounded tile (radius ≈20%) holding four interlocking blocks (white / `#2D75FF` alternating) joined by a central white-dot hub, representing connected departments.
- Wordmark: "ENTRIX" Inter 800 navy + "ERP" Inter 500 in brand-blue gradient; optional tagline "CONNECTED SYSTEMS" 600, letter-spacing 0.3em, gray.
- Usage: full logo on Login and marketing; emblem-only in sidebar, favicon, and mobile header. Min emblem size 24px. Clear space = 25% of emblem width. On dark backgrounds, use white wordmark and keep the navy tile with a 1px `#2D75FF` outline.
- Extract the emblem group into `logo-mark.svg` and use `currentColor` where possible for theming.

---

## 4. App Shell (all authenticated pages)

```
┌────┬───────────────────────────────────────────────┐
│ S  │  Header: Page title            [toggle][btn][⬇]│
│ i  ├───────────────────────────────────────────────┤
│ d  │  KPI strip (optional)                          │
│ e  ├───────────────────────────────────────────────┤
│ b  │  Page content                                  │
│ a  │                                                │
│ r  │                                                │
└────┴───────────────────────────────────────────────┘
```

### 4.1 Sidebar (icon rail)
- Width **64px**, white, fixed, full height, no text labels (tooltip on hover, expand-on-hover optional).
- Top: the ENTRIX emblem (see §3.5) at 32×32, rounded 8px. Use the emblem only, no wordmark, in the rail.
- Nav items: 40×40 icon buttons, centered, 12px vertical gap.
- **Active item:** `--brand-soft` (blue tint) rounded-10 background + `--brand` icon. **Hover:** `--bg-subtle`.
- Bottom group: Settings, Export/Download.
- Nav order (matches reference): Dashboard · Orders (cart) · Procurement/Purchase · Dispatch (send) · **Shipments (truck)** · Warehouse/Inventory (box) · Organization/Hierarchy · Finance (wallet) · Reports/Config.
- Mobile (<768px): becomes a bottom tab bar or slide-over drawer with labels.

### 4.2 Main container
- Sits on `--bg-app` with 8–12px outer margin; the content area is a white, 16px-radius container with a 1px border.
- **Header (72px):** left = page title (18/600). Right = `Switch` with label ("Show KPIs"), secondary outlined button with leading `+` icon ("New Shipment"), and an icon-only outlined square button (download/export).
- Header sticks to top on scroll.

---

## 5. Component Specs

### 5.1 Buttons
- **Primary:** bg `--text-primary` or `--info`, white text, h-40, px-16, radius 10. Primary buttons use `--brand`; the login CTA may use the `--brand`→`--brand-deep` gradient.
- **Secondary (default in header):** white, 1px `--border`, text primary, hover `--bg-subtle`. Leading icon 16px.
- **Icon button:** 40×40 square, same as secondary.
- **Destructive:** `--danger`. **Disabled:** 50% opacity.
- Focus ring: 2px `--info` at 40% opacity, 2px offset.

### 5.2 KPI Stat Strip
- One white container, radius 12, 1px border, divided into **4 equal cells** by vertical 1px dividers.
- Each cell: `[icon bubble 40px circle] [label 12 gray / value 24 bold / caption 12 gray]`.
- Icon bubble colors: purple-soft (Total/trend), info-soft (check), warning-soft (clock), danger-soft (alert triangle). Icon uses the matching solid color.
- Example content: Total Active 36 / On Track 26 / At Risk 8 / Delayed 2.
- Clicking a KPI filters the list below. Toggle "Show KPIs" hides the strip (persist in localStorage).
- Responsive: 2×2 grid on tablet, horizontal scroll or stacked on mobile.

### 5.3 Search & Filter Bar
- Input: h-40, radius 10, 1px border, leading search icon, placeholder "Search shipment ID".
- Adjacent 40×40 filter icon button opening a popover/sheet with status, carrier, date range, origin/destination.

### 5.4 Segmented Toggle (Table | Map)
- Floating pill, white, 1px border, radius 10, two segments with icons; active segment has `--bg-subtle` fill and bold text. Reuse for any view switcher (List/Board/Calendar).

### 5.5 Status Badge
- Outlined style: 1px colored border, soft tinted background, colored text, radius 6, px-8, h-22, 12/500.
- Variants: `Delay (2h)` red, `On Track` blue, `At Risk` amber, `Delivered` green.

### 5.6 Shipment Card (list item)
Structure (top → bottom), padding 12, radius 12, 1px border, 12px gap between cards, hover raises border to `--info` at 30%:
1. **Row 1:** vehicle thumbnail (48×48, radius 8, light-gray bg) · `SHP - 48207` (14/600) + copy icon button · status badge (right-aligned).
2. **Meta:** truck-icon `Carrier: FedEx`; pin-icon `Current Location: Near Zurich, CH` (12 gray).
3. **Route block:** origin city bold + country code gray (`Frankfurt,DE`) on left, destination right-aligned (`Milan,IT`); datetime under each (11 gray).
4. **Progress track:** 4px gray line with start/end nodes; progress segment colored by status; small truck glyph at current position; red dots for incident markers; ETA chip (`in 4h`) at the end, pill with 1px border.
5. **Footer:** box-icon `24 units • 320 kg` left; refresh-icon `Updated 5 mins ago` right (11 muted).

### 5.7 Left Floating Panel (list + map layout)
- Width ~300–340px, white, radius 16, floating over the map with 12px inset, own scroll, sticky header: grid-icon + "Shipments" title + a small icon button (list/export).
- Below header: search + filter row, then scrollable card list.

### 5.8 Map
- Full-bleed light basemap, desaturated. Markers = 12px dots with 32px translucent halo in same color (blue/amber/red). Selecting a marker highlights the matching card and opens a popover.
- Controls: zoom +/- in a white vertical segmented control at bottom-right; segmented Table/Map toggle at top-right.

### 5.9 Data Table (Table view)
- Header row `--bg-subtle`, 12/600 uppercase-less gray; row height 52; 1px row dividers; sticky header; sortable columns; row-select checkbox; status badge column; row actions in kebab menu.
- Pagination footer: rows per page, page X of Y, prev/next icon buttons.

### 5.10 Forms
- Label 13/500 above field; input h-40, radius 10, `--bg-subtle` or white, 1px border; focus = `--info` border + ring; error = `--danger` border + 12px helper text.
- Group fields in a 2-column grid on desktop, single on mobile.
- Dialogs/sheets for create flows ("New Shipment") — right-side sheet 480px preferred.

### 5.11 Other primitives
Tabs (underline style), Dropdown/Select, Date range picker, Checkbox, Switch (small, gray off / `--text-primary` or `--info` on), Tooltip (dark), Toast (top-right), Skeleton loaders (shimmer on `--bg-subtle`), Empty state (icon + title + helper + CTA), Avatar, Breadcrumbs, Pagination.

---

## 6. Page Specifications

### 6.1 Login (build first)
**Layout:** split screen, full viewport.
- **Left (480–560px, white):** centered form column, max-w 380.
  - Full ENTRIX logo (emblem + wordmark) at top-left of the panel.
  - H1 "Welcome back" (28/700), subtext "Sign in to your ERP workspace" (14 gray).
  - Fields: Email (or Employee ID), Password (show/hide eye icon).
  - Row: "Remember me" checkbox · "Forgot password?" link (`--info`).
  - Primary full-width button "Sign in" (h-44). Loading state = spinner + disabled.
  - Optional divider "or" + "Continue with SSO" secondary button (Google/Microsoft/Okta).
  - Footer: © text, Privacy · Terms · Support links (12 muted).
- **Right (flex-1, hidden <1024px):** `--bg-app` panel showing a stylized product preview — a cropped, slightly tilted screenshot of the shipments dashboard (map + card list) inside a rounded card, with a subtle navy/blue radial gradient and a short value-prop headline ("Track every shipment, in real time.").
- **States:** invalid creds → inline danger alert above the button; field-level Zod errors; account locked; 2FA step (6-digit OTP inputs, 48×48 boxes, auto-advance); forgot-password and reset-password pages reuse the same left column.
- **A11y:** labels tied to inputs, `autocomplete` attributes, Enter submits, visible focus rings.

### 6.2 Dashboard (Home)
- Header "Dashboard" + date-range select + export.
- KPI strip (Revenue, Open Orders, Inventory Value, On-time Delivery %).
- 2-column grid of cards: line chart (orders over time), bar chart (inventory by warehouse), "Alerts / Exceptions" list using status badges, "Recent Activity" feed. All cards: white, radius 12, 1px border, 16–20 padding, title 16/600 with a kebab menu.

### 6.3 Shipments Monitor (reference screen — replicate exactly)
- Header + KPI strip + map with floating shipment list panel + Table/Map toggle as described in §5.

### 6.4 Module list pages (Orders, Purchase, Inventory, Customers, Vendors, Finance, Reports)
Use one reusable template:
1. Header (title + secondary actions + primary "New X").
2. Optional KPI strip (3–4 stats relevant to the module).
3. Toolbar: search, filter popover, saved views tabs, column visibility, view toggle.
4. Data table with status badges and row actions.
5. Right-side detail sheet (opens on row click) with tabs: Overview · Items · Activity · Documents.

### 6.5 Detail / Create pages
- Breadcrumb + title + status badge + action buttons at top.
- Two-column layout: main form/sections (left, ~70%), summary + timeline card (right, ~30%, sticky).
- Sticky bottom action bar on long forms (Cancel · Save draft · Submit).

### 6.6 Settings
- Left secondary nav (240px) with sections: Profile, Organization, Users & Roles, Notifications, Integrations, Billing. Content in stacked cards.

---

## 7. Interaction & Behavior
- **Realtime:** poll or websocket; "Updated X mins ago" is relative and refreshes every 60s.
- **Selection sync:** hovering a list card pulses its map marker; clicking centers the map.
- **Copy-to-clipboard** on IDs with toast "Copied".
- **Persisted UI state:** KPI toggle, view mode (Table/Map), table column prefs, filters in URL query params.
- **Transitions:** 150ms ease-out for hover/focus; 200ms for sheets/popovers. No heavy animations.
- **Loading:** skeletons, never blank screens. **Errors:** inline retry card.
- **Permissions:** hide/disable actions by role (Admin, Manager, Operator, Viewer); route guards redirect to `/login?next=`.

## 8. Responsive Rules
- ≥1280: full layout. 1024–1279: list panel narrows to 280px.
- 768–1023: sidebar stays icon rail; KPI 2×2; map/list become tab-switch.
- <768: bottom nav, single column, filters in a bottom sheet, cards go full-width.

## 9. Accessibility
- WCAG AA contrast (never rely on color alone: badges include text; icons accompany status).
- Keyboard navigable nav, tables, menus; `aria-label` on all icon-only buttons; respect `prefers-reduced-motion`.

## 10. Suggested Project Structure
```
src/
  app/ (routes: login, dashboard, shipments, orders, inventory, ...)
  components/
    ui/            # button, input, badge, switch, tabs, sheet (shadcn)
    layout/        # AppShell, Sidebar, PageHeader
    kpi/           # KpiStrip, KpiCard
    shipments/     # ShipmentCard, ShipmentList, ShipmentMap, RouteProgress
    data-table/    # DataTable, Toolbar, Pagination
  lib/ (api, auth, utils)
  styles/ tokens.css
```

## 11. Agent Instructions / Definition of Done
1. Implement tokens first (`tokens.css` + Tailwind theme), then primitives, then AppShell, then **Login**, then Shipments Monitor, then the generic module template.
2. Never hardcode colors; always use tokens. Never introduce new accent colors.
3. Use mock data/typed API layer so backends can be swapped in.
4. Every page must have loading, empty, and error states.
5. Verify pixel-level parity with the reference for: sidebar, header, KPI strip, shipment card, badges, segmented toggle.
6. Keep components small, typed, and reusable; add Storybook stories or a `/design-system` demo page showing all components and states.



sucess id : 6af85249b7483ba25cd6e732 14/11/26