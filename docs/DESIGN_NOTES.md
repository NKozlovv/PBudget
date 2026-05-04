# Theus — Design Notes

Drop this into `docs/DESIGN_NOTES.md`. It's the canonical place for
"the X should be Y"-style design clarifications when the design refs
need disambiguation.

**Direction:** Sterling 1:1 — `design-refs/src/dashboard.jsx`,
`auth.jsx`, `transactions.jsx`, `categories.jsx`, `forecast.jsx`,
`coach.jsx`. Authoritative when this file disagrees with them.

**Name:** Theus, everywhere user-visible. Sterling is an internal
codename for the design language only.

**Palette:** Sterling's navy palette per `design-refs/src/tokens.jsx`
(dark variant). The previous Theus forest-green palette is retired for now.
Future palette tweaks might happen.

---

## Geometry

Sterling rounded geometry, throughout:

- Cards: `borderRadius: 16` on a surface bg with a `1px solid line`
  border (`bg-surface border-line`)
- KPI tiles: same as cards, `padding: 24`. Hero KPI gets a radial
  accent gradient overlay
- Buttons: `borderRadius: 8` (icon-only or compact text), `padding:
  8px 14px` for text + icon
- Pill-style segmented controls: outer `borderRadius: 10` with `padding:
  4`, inner buttons `borderRadius: 7` with `padding: 7px 14px`
- Chips and badges: `borderRadius: 100` (full pill) for "New"-style
  badges; `borderRadius: 4` for KBD-style key hints; `borderRadius: 8`
  for general-purpose chips

---

## Typography

Three font families:

- **Inter** — body, headings, labels, button text
- **JetBrains Mono** — kicker dates ("April 2026 · WK 18"), KPI deltas
  ("+12.4% vs Mar"), all numerals in tables and KPIs, account chips
  ("Revolut, €"), KBD shortcuts ("⌘ K"), section headers in sidebar
  ("MANAGE", "TOOLS")
- **Instrument Serif italic** — reserved for the brand tagline only
  ("money understood." on auth screen and selectively on dashboard)

JetBrains Mono was previously dropped from the project per the Theus
identity decision. **Sterling 1:1 brings it back.** Add it via
`next/font/google` in `app/layout.tsx`, expose as `--font-mono`, wire
through `tailwind.config.ts` so `font-mono` resolves to it.

Tracking values:

- Mono uppercase labels, sidebar section headers, kicker dates:
  `letterSpacing: 0.18em`, `fontSize: 10`, `fontWeight: 500` (NOT
  Theus's 0.14em)
- KPI deltas (mono): `letterSpacing: 0.05em`, `fontSize: 10–11`
- Inter heading at 28px: `letterSpacing: -0.02em`
- Inter body 13–14px: default tracking

---

## Tokens

The full Sterling dark palette lives in `styles/tokens.css` after the
Session 2 swap. Reference:

| Token              | Value                          | Use                                  |
| ------------------ | ------------------------------ | ------------------------------------ |
| `--bg`             | `#0A0E1A`                      | App background                       |
| `--bg-elev`        | `#10162a`                      | Slightly elevated areas              |
| `--bg-soft`        | `#0d1322`                      | Sidebar bg, alias `--bg-subtle`      |
| `--bg-panel`       | `#141a2e`                      | Cards, alias `--surface`             |
| `--surface-hi`     | `#1a2138`                      | Hover state for surfaces             |
| `--rule`           | `rgba(255,255,255,0.08)`       | Borders, alias `--line`              |
| `--line-strong`    | `rgba(255,255,255,0.14)`       | Stronger dividers                    |
| `--grid`           | `rgba(255,255,255,0.05)`       | Chart gridlines                      |
| `--ink`            | `#F5F6FA`                      | Primary text                         |
| `--ink-soft`       | `#B6BCD0`                      | Secondary text                       |
| `--ink-mute`       | `#7480A0`                      | Tertiary, muted labels               |
| `--ink-faint`      | `#4A5476`                      | KBD hints, very low-emphasis text    |
| `--accent`         | `#7B8BFF`                      | Primary accent (electric indigo)     |
| `--accent-hi`      | `#A78BFA`                      | Lavender, used in avatar gradient    |
| `--accent-soft`    | `rgba(123,139,255,0.15)`       | Accent background fills              |
| `--pos`            | `#5EE6A8`                      | Mint, gains and income               |
| `--pos-soft`       | `rgba(94,230,168,0.12)`        | Pos background fills                 |
| `--neg`            | `#FF7A8A`                      | Coral, losses and alarms             |
| `--neg-soft`       | `rgba(255,122,138,0.12)`       | Neg background fills                 |
| `--warn`           | `#FFC979`                      | Warnings, "pattern" insights         |
| `--chip`           | `rgba(255,255,255,0.06)`       | Chip backgrounds                     |
| `--chip-hi`        | `rgba(255,255,255,0.10)`       | Chip hover                           |

When palette tweaks come up later, they go in `tokens.css` only. The
entire app re-themes from a single file.

---

## Sidebar (per `design-refs/src/dashboard.jsx` lines 13–48)

- Width: 232px
- Background: `bg-bg-subtle` (Sterling) / `bg-bg-soft` (current)
- Section headers: JBM uppercase tracked 0.18em, 10px, `text-ink-faint`
  (or `text-ink-mute` until `--ink-faint` is added)
- Nav items: `padding: 10px 12px`, `borderRadius: 8`, `gap: 12`,
  Inter 13px weight 500
  - Inactive: `text-ink-soft`, transparent bg, transparent border
  - Active: `text-ink`, `bg-surface`, `border-line`, accent-colored icon
  - Hover: subtle bg-surface-hi (optional, current code may not have this)
- "New" badge on Coach item: `padding: 2px 6px`, `borderRadius: 100`,
  `bg-accent-soft`, `text-accent`, JBM 9px weight 600 letterSpacing
  0.05em uppercase
- Identity card (bottom):
  - Outer: `padding: 12`, `bg-surface`, `borderRadius: 10`, `border-line`
  - Avatar: 32x32 circle, `linear-gradient(135deg, accent, accentHi)`,
    first initial in white 13/600
  - Name: Inter 12 weight 600
  - Subline: JBM 10 `text-ink-mute` ("EUR · primary")
  - Settings icon button right-aligned, 14px, `text-ink-mute`

---

## Topbar (per `design-refs/src/dashboard.jsx` lines 52–68)

Lives above the page content inside the main column, NOT outside the
sidebar.

Container: `padding: 20px 32px`, `border-bottom-line`, flex with `gap:
16`.

Elements left-to-right:

- **Search input** (max-width 380, `flex: 1`):
  - `padding: 8px 14px`, `bg-surface`, `border-line`, `borderRadius: 10`
  - `Icon name="search" size={14} color="text-ink-mute"` left
  - Placeholder text "Search transactions, accounts…", Inter 13
    `text-ink-mute`
  - KBD hint right-aligned: "⌘ K" in JBM 10 `text-ink-faint`,
    `border-line`, `borderRadius: 4`, `padding: 2px 6px`
- **FX rate chip**:
  - `padding: 7px 12px`, `bg-surface`, `border-line`, `borderRadius: 8`
  - Green pos-colored 6x6 dot
  - JBM 11 `text-ink-soft`, e.g. "1 USD = 0.854 EUR"
- **Bell button**: `padding: 7`, transparent bg, `border-line`,
  `borderRadius: 8`, `Icon name="bell" size={15}`
- **+ New button**: primary Sterling button (see Buttons below) +
  `Icon name="plus" size={14}` + "New"

Search and bell can be visually present but non-functional initially.

---

## Buttons

**Primary** (per `dashboard.jsx` line 65):

- `bg-accent text-white border-none borderRadius-8 padding-8px-14px
  fontSize-13 fontWeight-500 fontFamily-inherit`
- Optional leading icon

**Ghost** (per `dashboard.jsx` line 62):

- `bg-transparent border-line text-ink-soft padding-7 borderRadius-8`
  for icon-only
- For text + icon: `padding-7px-12px`

**Tertiary / link**:

- No background, `text-ink-soft hover:text-ink`, no padding outside
  inline flow.

---

## KPI tiles

**Standard KPI** (per `dashboard.jsx` lines 134–168):

- `bg-surface border-line borderRadius-16 padding-24`
- Label: Mono uppercase tracked 0.14em 11px `text-ink-mute`,
  `marginBottom: 16`
- Value: JBM 32 `font-weight-600` (or 28 + 20 for whole/cents split)
- Delta row: arrow icon (pos/neg), JBM 13 weight 500 in pos/neg color,
  + sub-caption Inter 12 `text-ink-mute`

**Hero KPI** (per `dashboard.jsx` lines 126–151):

- Same as standard PLUS:
  - `position: relative; overflow: hidden`
  - Absolutely-positioned inner div: `inset: 0`, `pointerEvents: none`,
    `backgroundImage: radial-gradient(circle at 90% 0%, accentSoft,
    transparent 55%)`
  - Content wrapped in `position: relative` so it sits above the gradient
- Sometimes includes a sparkline overlay (BalanceSparkArea from charts.jsx)

---

## Period toggle

Used on dashboard top-right (`dashboard.jsx` lines 117–121).

- Container: `padding: 4`, `bg-surface`, `border-line`,
  `borderRadius: 10`, flex `gap: 6`
- Button (each option):
  - Active: `bg-bg text-ink`
  - Inactive: `bg-transparent text-ink-mute`
  - Common: `border-none padding-7px-14px borderRadius-7 fontSize-12
    fontWeight-500 fontFamily-inherit`

Default options: Week / Month / Quarter / YTD / All. Wire to
`?period=` URL search param so views are deep-linkable.

---

## Tables

Sterling tables (`transactions.jsx`):

- No outer Card wrapper for the dashboard-recents variant; full pages
  wrap in a Card.
- Day-grouped on transactions page: a small JBM uppercase day header
  (`Today · 29 Apr`) followed by the rows for that day.
- Row: `padding: 12px 16px`, `borderBottom: line` (last row no border).
- Hover: `bg-surface-hi`.
- Columns:
  - Icon column: 32x32 colored bg circle (using category color at 15%
    alpha) with a 16px icon centered.
  - Merchant + category: Inter 13/500 ink + JBM 11 `text-ink-mute`
    subline.
  - Account chip: `padding: 3px 8px`, `bg-chip`, `borderRadius: 8`,
    JBM 10 `text-ink-soft`.
  - Amount: JBM 14 weight 600 right-aligned, sign-tinted (pos green,
    negative is `text-ink` not `text-neg` — neg is for "alarming"
    states, not normal expenses).

---

## Charts

Pull chart visuals directly from `design-refs/src/charts.jsx`. Don't
invent new variants.

Chart-color rules:

- Income / gains: `pos` (mint `#5EE6A8`)
- Expenses in cashflow bars: `neg` (coral `#FF7A8A`)
- Forecast projected: `accent` at reduced opacity or with a different
  fill style (dashed, hatched).
- Donut category slices: use `lib/categoryColor.ts` if it exists, else
  cycle through `accent`, `accent-hi`, `pos`, `warn`, `neg`, `ink-soft`.

---

## Naming reminders

- Product is **Theus**. The wordmark on auth screen: "Theus", italic
  Instrument Serif fallback only on the tagline.
- Tagline: `money understood.` — lowercase, period, italic Instrument
  Serif. Keep limited to auth screen and dashboard hero greeting.
- Sterling appears NOWHERE in user-visible strings, page titles, or
  metadata. It's an internal codename for the design system only —
  fine in code comments and `docs/`.

---

## Things explicitly OUT of scope until later

- Light mode (palette swap; Sterling tokens have light variants but
  not implemented)
- Mobile breakpoints (Sterling has `mobile.jsx`; defer)
- Real Coach engine (only stub for now)
- Real ⌘K command palette (search input is visual-only)
- Real notifications (bell button is no-op)
- Per-category color editor
- Drilldown modals from category rows / chart segments
