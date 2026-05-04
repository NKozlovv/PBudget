# Theus — Sterling 1:1 Migration Plan

The goal: every page is a 1:1 implementation of the Sterling design refs
in `design-refs/src/` (the non-`theus-*` files: `dashboard.jsx`,
`auth.jsx`, `transactions.jsx`, `categories.jsx`, `forecast.jsx`,
`charts.jsx`, plus `icons.jsx` and `tokens.jsx`).

Only the **name** stays "Theus". Palette tweaks come later, after the
structure is right.

---

## 1. What changes from the previous plan

The previous plan recommended Theus-flat geometry. **Discard it.** The
correct direction is Sterling: rounded cards (`borderRadius: 16`),
rounded buttons (`borderRadius: 8–10`), surface-on-bg color hierarchy,
electric blue/lavender accent, JetBrains Mono mono, monoline icons.

This is closer to where your code already is, so the work is smaller
than I originally implied. But there are real gaps. Specifically:

### Things missing from the current code

1. **No `Icon` component.** Sterling uses 30+ monoline icons throughout
   (`design-refs/src/icons.jsx`). Your codebase has zero. The dashboard
   topbar (`search`, `bell`, `plus`), sidebar (`home`, `list`, `wallet`,
   `tag`, `chart`, `sparkle`), category rows, transaction rows, KPI deltas
   (`arrow-up`, `arrow-down`) — all need icons.

2. **JetBrains Mono was dropped.** `CLAUDE.md` §6 says the project
   "deliberately dropped JBM". Sterling uses it constantly: kicker dates,
   KPI deltas, account chips, "⌘ K" key hints, the FX rate chip, KPI
   numerals. Sterling 1:1 means **JBM has to come back**. The drop was
   tied to the Theus identity decision, which is no longer in force.

3. **Topbar is wrong.** Sterling has a top header bar with: a search
   input (`⌘ K` hint), an FX rate status chip (with green dot), a bell
   button, a primary "+ New" button. Your current `(app)/layout.tsx`
   has none of these — it just renders the sidebar.

4. **Sidebar identity is wrong.** Sterling's sidebar identity card (per
   `dashboard.jsx` lines 38–47) shows a circular avatar with a brand
   gradient, name in 12px 600, "EUR · primary" in JBM 10px, plus a
   settings icon. Your `UserCard.tsx` shows email + budget name + base
   currency.

5. **No "Coach" view.** Sterling sidebar has a `Coach` item with a
   `New` badge (`design-refs/src/coach.jsx` exists). Your project plan
   marks it "out of scope". For Sterling 1:1, you need to either build
   it or render a stub page so the sidebar item works.

6. **No `Period` toggle pill group.** Sterling dashboard has a
   `Week / Month / Quarter / YTD / All` segmented control top-right
   (`dashboard.jsx` lines 117–121). Your dashboard has no period toggle.

7. **Hero KPI block has a radial accent gradient** (`dashboard.jsx`
   line 127) — your `HeroBalance` doesn't.

8. **Color tokens are the Theus palette, not Sterling.** Your
   `tokens.css` is forest-green (`#0F1A14`, brass `#D8B055`, sage,
   rust). Sterling is navy-black (`#0A0E1A`), electric blue
   (`#7B8BFF`), lavender (`#A78BFA`), mint (`#5EE6A8`), coral
   (`#FF7A8A`). **Decision: swap to Sterling palette now**, in
   Session 2 alongside the foundations. Tweaks to the palette come
   later — but the green→navy swap happens up front so every
   subsequent page session works against the final colors.

### Things you can keep as-is

- The palette tokens (already wired through Tailwind via CSS variables).
  When you swap the palette later, you change `styles/tokens.css` only.
- The data layer (`lib/data/*`, `lib/balance.ts`, `lib/money.ts`).
  Don't let any visual session touch it.
- Server actions (`app/actions/*`). Same.
- The route structure: `(app)/dashboard`, `(app)/transactions`, etc.
- Auth pages — already Sterling split-screen per `rehaul-progress.md`
  Chunk 2.1. Verify they match `design-refs/src/auth.jsx` but they
  may already be close.

---

## 2. Decision points before you start (3 of them)

These are minor but you should commit to each before opening Claude
Code, or every session will re-litigate them.

**Decision 1 — JetBrains Mono.** Bring it back? **My recommendation:
yes.** Sterling 1:1 needs it. Add it via `next/font/google` in
`app/layout.tsx`, expose it as `--font-mono`, and update
`tailwind.config.ts` so `font-mono` resolves to it. Then update the
`Mono` primitive to use it.

**Decision 2 — Coach view.** Build a real coach view (per
`design-refs/src/coach.jsx`) or stub it out? **My recommendation: stub
for now.** Build a `Stub` page that says "Coming soon" so the sidebar
nav works, then come back to it after the other five pages are 1:1.

**Decision 3 — Topbar features.** Sterling's topbar has search,
notifications, and "+ New". You don't have search infrastructure
(global ⌘K search would be a real feature build) and you don't have
notifications. **My recommendation:** render the topbar visually
identical to Sterling, but the search input is a non-functional
display element with a placeholder (`Search transactions, accounts…`)
and the bell button is a no-op for now. The FX rate chip and "+ New"
button get wired to real behavior. This keeps Sterling 1:1 visually
and lets you build the real functionality later as separate features.

If you disagree with any of these, change the plan accordingly. They
matter mainly because each changes how much work each session covers.

---

## 3. Run order

You'll run **five Claude Code sessions** in sequence on a new branch
`experimental/theus-sterling-1to1`. (Branch off
`experimental/theus-rehaul`. Don't merge to it until you're sure.)

| # | Session                              | Output                                                  |
| - | ------------------------------------ | ------------------------------------------------------- |
| 1 | Audit & scope                        | Written diff per page; no code                          |
| 2 | Foundations (fonts, icons, primitives) | New `Icon`, JBM restored, primitives reshaped to Sterling, topbar shell |
| 3 | Dashboard 1:1                        | `(app)/dashboard/page.tsx` matches `dashboard.jsx`      |
| 4 | Transactions / Accounts / Categories / Forecast 1:1 | One page per sub-session inside this chunk    |
| 5 | Coach stub + auth verification + cleanup | Final pass, version bump, deploy            |

The prompts for each are below. Each prompt is self-contained — paste
it as the first message of a fresh Claude Code session and don't add
anything else until it asks for confirmation.

---

## 4. Session 1 prompt — Audit & scope

```
You are auditing the visual implementation of this project against the
Sterling design references. Don't write or modify any code in this
session — the output is a report only.

Authoritative references (read in this order):

1. design-refs/src/tokens.jsx — Sterling palette + helpers
2. design-refs/src/icons.jsx — full icon set
3. design-refs/src/charts.jsx — chart primitives used across pages
4. design-refs/src/dashboard.jsx — AppShell + Dashboard
5. design-refs/src/auth.jsx — Auth split-screen
6. design-refs/src/transactions.jsx — Transactions, Accounts modules
7. design-refs/src/categories.jsx — Categories
8. design-refs/src/forecast.jsx — Forecast
9. design-refs/src/coach.jsx — Coach (will be stubbed for now)

Then read the current implementation:

- styles/tokens.css and tailwind.config.ts
- app/(app)/layout.tsx and components/nav/* (Sidebar, NavItem, UserCard,
  PageHeader)
- All app/(app)/*/page.tsx
- components/ui/* (every primitive)
- components/charts/* (every chart)
- components/auth/*
- docs/rehaul-progress.md (skim — note Chunks 1, 1.1, 2.1 specifically)

Then produce a single report with these sections. Don't propose code.

A. Foundations gap
   For each, say "missing", "partial", or "present":
   - Icon component (Sterling uses ~30 icons in design-refs/src/icons.jsx)
   - JetBrains Mono font (Sterling uses it for kicker dates, KPI deltas,
     account chips, KBD hints)
   - Topbar (Sterling's AppShell header has search input, FX chip, bell,
     "+ New" — see dashboard.jsx lines 52-68)
   - Period toggle pill group (Week/Month/Quarter/YTD/All)
   - Sidebar identity card with avatar + brand gradient
   - Coach view + sidebar nav item with "New" badge

B. Page-by-page diff
   For each of dashboard, transactions, accounts, categories, forecast,
   list every concrete deviation from the matching ref. Use this format:
     • [element]: ref does X; current does Y
   Be specific. "Hero KPI: ref has radial accent gradient overlay
   (dashboard.jsx line 127); current does not" — not "hero looks
   different".

C. Primitive deltas
   For Card, KpiTile, Button, Pill, Mono, Num: list the changes needed
   to match Sterling. Specifically check border-radius, padding,
   surface vs bg color, font choice for Mono.

D. Chart deltas
   Compare components/charts/* against the chart variants used in
   design-refs/src/charts.jsx and the inline SVGs in dashboard.jsx /
   transactions.jsx / forecast.jsx. List which charts exist, which
   are missing, and which exist but need changes.

E. Implementation order
   Propose an ordering for sessions 2-5 of the migration. Specifically:
   confirm whether Sessions 3, 4, 5 as scoped in THEUS_STERLING_PLAN.md
   are correctly sized, or whether any page has enough deviation that
   it should be split into its own session.

End with: "Awaiting decision on Decisions 1, 2, 3 in
THEUS_STERLING_PLAN.md §2 before proceeding to Session 2."
```

After this runs, read the report. Confirm the three decisions in §2.
Then move to Session 2.

---

## 5. Session 2 prompt — Foundations

Replace the three `[DECISION_*]` placeholders with your actual
decisions from §2. The example below assumes the recommended answers
(JBM yes, Coach stubbed, topbar visually-1:1 with non-functional
search/bell).

```
We're building the Sterling foundations: icons, fonts, topbar,
realigned primitives. NO page-level work in this session — pages stay
as they are and may look temporarily worse.

Decisions confirmed:
- JetBrains Mono: [DECISION_1: bring back / keep dropped]
- Coach view: [DECISION_2: stub / build]
- Topbar features: [DECISION_3: visually 1:1 with non-functional
  search & bell / fully wired]

Authoritative references:
- design-refs/src/icons.jsx (ALL icons)
- design-refs/src/dashboard.jsx (AppShell layout — topbar + sidebar)
- design-refs/src/tokens.jsx (font choices and weights)
- docs/DESIGN_NOTES.md (project-specific clarifications)

Scope of this session — these files only:

1. components/ui/Icon.tsx (NEW)
   Port the entire icon set from design-refs/src/icons.jsx as a single
   component. Same name-based API: <Icon name="search" size={16}
   color="..." />. Use stroke="currentColor" by default so Tailwind
   text-* utilities work.

2. app/layout.tsx
   Add JetBrains Mono via next/font/google alongside the existing Inter
   and Instrument Serif. Expose as --font-mono CSS variable.

3. tailwind.config.ts
   Add the mono font family entry: mono: ['var(--font-mono)',
   'ui-monospace', 'monospace']. Keep sans and display as they are.
   Add Tailwind color entries for any new tokens introduced in
   styles/tokens.css (see step 3a).

3a. styles/tokens.css — PALETTE SWAP TO STERLING
   Replace the current Theus forest-green palette with Sterling's
   navy palette per design-refs/src/tokens.jsx (the dark variant).
   Mapping:
     --bg:           #0A0E1A   (was #0F1A14)
     --bg-soft:      #0d1322   (was #162420; aliases bgSubtle)
     --bg-panel:     #141a2e   (was #1C2C26; aliases surface)
     --ink:          #F5F6FA   (was #EFE9D8)
     --ink-soft:     #B6BCD0   (was #C7BFA9)
     --ink-mute:     #7480A0   (was #8E866E)
     --rule:         rgba(255,255,255,0.08)   (was rgba cream)
     --grid:         rgba(255,255,255,0.05)
     --accent:       #7B8BFF   (was #D8B055 — brass→indigo)
     --accent-soft:  rgba(123,139,255,0.15)
     --pos:          #5EE6A8   (was #7FB58A — sage→mint)
     --pos-soft:     rgba(94,230,168,0.12)
     --neg:          #FF7A8A   (was #E9673E — rust→coral)
     --neg-soft:     rgba(255,122,138,0.12)
   Add these new tokens that Sterling uses but Theus didn't have:
     --bg-elev:      #10162a
     --surface-hi:   #1a2138
     --line-strong:  rgba(255,255,255,0.14)
     --ink-faint:    #4A5476
     --accent-hi:    #A78BFA   (lavender — used in avatar gradient)
     --warn:         #FFC979
     --chip:         rgba(255,255,255,0.06)
     --chip-hi:      rgba(255,255,255,0.10)
   Add aliases so the codebase can use Sterling's vocabulary:
     --surface:      var(--bg-panel)
     --line:         var(--rule)
     --bg-subtle:    var(--bg-soft)
   Verify all new tokens are wired into tailwind.config.ts colors so
   utility classes like `bg-surface`, `border-line`, `text-ink-faint`,
   `bg-accent-hi`, `text-warn` resolve correctly.
   Note: this swap may regress the WCAG contrast values documented in
   docs/contrast-report.md — flag any token that fails AA against bg
   and ask before adjusting. Sterling's source values are the
   authority; if they don't pass, we accept that for now and revisit.

4. components/ui/Mono.tsx
   Switch the underlying font from Inter to JBM (the "drop JBM" decision
   per CLAUDE.md §6 is being reversed for Sterling 1:1). Keep the rest
   of the API identical.

5. components/ui/Card.tsx
   Verify it matches Sterling cards: borderRadius: 16, background:
   var(--surface), border: 1px solid var(--line). The token aliases
   added in step 3a should make this resolve correctly via
   `bg-surface border-line` Tailwind utilities.

6. components/ui/Button.tsx
   Match Sterling buttons (dashboard.jsx line 65 for primary,
   line 62 for ghost):
     - primary: background: accent, text white, borderRadius: 8,
       padding: 8px 14px, fontSize: 13, fontWeight: 500
     - ghost: background: surface, border: 1px line, padding: 7px,
       borderRadius: 8 (icon-only) or 7px 12px (text)
     - All buttons use Inter, NOT JBM.

7. components/ui/KpiTile.tsx
   Update padding to 24, borderRadius: 16, surface bg. Add support for
   optional radial accent gradient overlay (used by hero KPI in
   dashboard.jsx line 127). Add support for an optional Icon-prefixed
   delta indicator (e.g. <arrow-up> + "+12.4%").

8. components/ui/Pill.tsx (if it exists)
   Match Sterling chips: padding 2px 6px or 4px 10px, borderRadius
   varies (4 for KBD-style, 100 for badge-style, 8 for general). Three
   variants: kbd, badge, chip.

9. components/ui/PeriodToggle.tsx (NEW)
   Sterling dashboard.jsx lines 117-121: a segmented pill group
   container (padding 4, surface bg, border line, borderRadius 10)
   with each option as a button (padding 7px 14px, borderRadius 7,
   active state: bg=bg, text=ink; inactive: transparent, text=inkMute).
   Default options: Week / Month / Quarter / YTD / All. Accept a
   `value` and `onChange` prop and a custom `options` array.

10. components/nav/Topbar.tsx (NEW)
    Match dashboard.jsx lines 52-68 exactly:
      - search input visual (non-functional input, ⌘K hint)
      - FX rate chip with green dot (read fx_rate from props, format as
        "1 USD = 0.854 EUR")
      - bell button (no-op for now, render Icon name="bell")
      - "+ New" primary button (dispatches an event or calls a prop
        handler — wiring comes later)

11. app/(app)/layout.tsx
    Wrap the existing children with the new Topbar. The Sidebar+main
    grid stays the same; the Topbar slots into the main column above
    the page content.

12. components/nav/Sidebar.tsx
    Update the sidebar nav items to use the new Icon component
    (mapping: Overview→home, Transactions→list, Accounts→wallet,
    Categories→tag, Forecast→chart, Coach→sparkle). Update active state
    to match dashboard.jsx lines 21-34: borderRadius 8, surface bg,
    line border, accent-colored icon when active.
    Add a Coach nav item with a "New" badge (dashboard.jsx lines 31-33
    for the badge style).
    Section headers in JBM uppercase tracked 0.18em (NOT 0.14em — that
    was the Theus value; Sterling uses 0.18em).

13. components/nav/UserCard.tsx
    Replace with the Sterling identity card (dashboard.jsx lines 38-47):
    32x32 circular avatar with `linear-gradient(135deg, accent, accentHi)`
    bg + first initial of name in white 13/600. Name in Inter 12/600.
    "EUR · primary" (or equivalent) in JBM 10/inkMute. Settings icon
    button on the right.

14. components/ui/index.ts
    Re-export Icon, PeriodToggle from the UI barrel.

15. app/(app)/coach/page.tsx (NEW, only if Decision 2 = stub)
    Render a centered "Coach — coming soon" message inside the standard
    page shell.

Before writing any code, output a plan that:
  a. Lists every file you'll create or modify with one-line description
  b. Lists any token rename or addition you need (e.g. --surface,
     --surfaceHi, --line, --lineStrong, --accentHi, --inkFaint —
     these don't exist yet in styles/tokens.css and you'll need to
     decide whether to add them now or map them to existing tokens)
  c. Calls out anything ambiguous

Wait for me to confirm before any edits.

After all changes, run:
  - npm run typecheck
  - npm run lint

Don't run the build (pages will look broken until Session 3+).

Update docs/rehaul-progress.md with a new chunk entry titled
"Chunk 12 — Sterling foundations". Note that pages will look broken
until they're migrated in subsequent chunks.
```

---

## 6. Session 3 prompt — Dashboard 1:1

Run after Session 2 lands and `typecheck`/`lint` are clean.

```
We're rebuilding app/(app)/dashboard/page.tsx to be a 1:1 visual match
for design-refs/src/dashboard.jsx (the const Dashboard = () => {...}
component, not AppShell — AppShell is now in components/nav/).

Authoritative reference: design-refs/src/dashboard.jsx lines 76-310.
Also relevant: design-refs/src/charts.jsx for chart primitives.

Read in order:
  1. design-refs/src/dashboard.jsx (full file)
  2. design-refs/src/charts.jsx (full file)
  3. design-refs/src/icons.jsx (for category icons used)
  4. components/ui/* (the primitives realigned in Session 2)
  5. components/charts/* (current chart components)
  6. lib/balance.ts (data shapes)
  7. app/(app)/dashboard/page.tsx (current implementation)
  8. docs/DESIGN_NOTES.md

Architecture rules — DON'T violate:
  - Don't change the data layer (lib/data/*, lib/balance.ts,
    lib/money.ts, lib/date.ts). Page must consume the same shapes
    they already produce.
  - Don't change server actions (app/actions/*).
  - Use the realigned primitives from Session 2. If a primitive doesn't
    do what the ref needs, extend the primitive — don't inline.
  - All styling via Tailwind utilities resolving to CSS-variable tokens.
    No hardcoded hex colors. No inline `style={{ color: '#...' }}`. The
    only inline styles allowed are the radial gradient backgrounds and
    SVG attributes (those are how Sterling does it).

What the dashboard needs to contain (1:1 with the ref):

  1. Greeting + insight row (lines 107-122):
     - Kicker: "April 2026 · WK 18" in JBM uppercase tracked 0.18em
       (compute from current date + ISO week)
     - Greeting: "Good morning, Alex." Inter 28/600 tracking -0.02em
       (use real user name; "morning/afternoon/evening" by hour)
     - Insight subline: "You've spent €X this month — Y% under your
       average." with the amount in JBM 600 ink, the comparison in pos
       or neg color. Use the existing monthTotalsEUR + a 6-month
       average from lastNMonthsTotals to compute "X% under/over".
     - Right side: PeriodToggle (Week / Month / Quarter / YTD / All).
       This is a NEW state — wire to URL search param ?period= for
       deep-linking; default 'Month'.

  2. Hero KPI grid (lines 125-168), 1.4fr / 1fr / 1fr:
     - Tile 1 (large, with radial accent gradient): "Total balance"
       — €X with separate decimal styling, sparkline (BalanceSparkArea
       from charts.jsx), "+€2,340 this month" delta.
     - Tile 2: "Income · April" — €X, JBM, arrow-up icon + "+12.4%
       vs Mar" delta in pos.
     - Tile 3: "Spending · April" — €X, JBM, arrow-down icon + "-6.3%
       vs Mar" delta in pos (because lower spend = better).

  3. Cashflow chart card (lines 171-202):
     - Title "Cashflow" + subline "Monthly net for the last 12 months"
     - Right legend: Income (pos dot) / Spending (neg dot)
     - Chart: paired bars per month, 12 months. See charts.jsx for the
       existing IncomeSpendBars equivalent or extend
       components/charts/IncomeSpendBars.tsx to match.

  4. Categories + Recent transactions row (lines 205-298), 1fr / 1.2fr:
     - LEFT: "Spending by category" donut card. Donut + center total.
       Legend list with category icon, name, percentage, amount.
     - RIGHT: "Recent activity" list card. One row per tx with:
       icon (per category), merchant + category subline, account chip
       in JBM, amount in JBM (pos color for positive, ink for
       negative — NOT neg, neg is reserved for "alarming"). "View all"
       link footer.

Steps:
  1. Output a structural diff between the current dashboard page and
     the ref. Bullet list, concrete.
  2. Identify any chart that needs to be created or extended in
     components/charts/. List the file paths.
  3. List the exact files you'll create or modify.
  4. Wait for me to confirm.

After confirmation, implement. After the change, run:
  - npm run typecheck
  - npm run lint
  - npm run build

If the build passes, update docs/rehaul-progress.md with an entry
titled "Chunk 13 — Dashboard Sterling 1:1". List anything you couldn't
match exactly and why (e.g. Sterling shows fake hardcoded data; we use
real data which may have empty states).

Don't touch any other page in this session.
```

---

## 7. Session 4 prompt — Transactions, Accounts, Categories, Forecast

This is one session that runs four sub-tasks in sequence. The reason
they're together: they all consume the same primitives + charts that
Session 3 hardened, and there's overlap in the patterns (table styling,
filter pill rows, etc.). But each sub-task gets its own confirmation
gate.

```
We're rebuilding the four remaining pages 1:1 with Sterling, in this
order: Transactions → Accounts → Categories → Forecast. ONE PAGE AT A
TIME. Don't start the next page until I've confirmed the previous one
landed cleanly.

Authoritative refs:
  - design-refs/src/transactions.jsx (Transactions + Accounts modules)
  - design-refs/src/categories.jsx
  - design-refs/src/forecast.jsx
  - design-refs/src/charts.jsx
  - design-refs/src/icons.jsx

Architecture rules (same as Session 3):
  - Don't change data layer or server actions
  - Use realigned primitives from Session 2; extend rather than inline
  - Tokens only, no hardcoded colors
  - Inline styles only for SVG attrs and gradients

For EACH page:
  1. Output a structural diff vs the ref (concrete bullets)
  2. List files to modify
  3. Wait for confirmation
  4. Implement
  5. Run typecheck + lint + build
  6. Update docs/rehaul-progress.md with a chunk entry
  7. Stop. Wait for me to say "next page" before continuing.

Page-specific notes:

TRANSACTIONS (page 1 of 4)
  Reference: design-refs/src/transactions.jsx const Transactions
  Key elements:
    - Filter row at top: search + type select + account select +
      category select + date range + clear button. All using Sterling
      pill/chip styling.
    - Table grouped by day with day headers (e.g. "Today · 29 Apr").
    - Each row: category icon + merchant/category + account chip + JBM
      amount (sign-tinted).
    - Table has hover row highlight.
    - Bulk action bar appears when rows are selected.
    - Existing components/transactions/* should mostly be reusable
      with primitive updates. Verify each one.

ACCOUNTS (page 2 of 4)
  Reference: design-refs/src/transactions.jsx const Accounts (in same
  file as Transactions)
  Key elements:
    - Trajectory chart card (multi-line, one line per account)
    - Distribution donut card
    - Accounts table with name, currency, opening balance, current
      balance, sparkline per row, edit/delete actions.
    - + Add account button opens AccountForm modal.

CATEGORIES (page 3 of 4)
  Reference: design-refs/src/categories.jsx
  Key elements:
    - Two side-by-side panels: Expenses + Income.
    - Each panel has an icon header, total, and list of categories.
    - Each category row: icon + name + spent/budget + progress bar
      + tx count + chevron-right (drilldown indicator).
    - Subcategories nested inside.
    - + Add category at bottom of each panel.

FORECAST (page 4 of 4)
  Reference: design-refs/src/forecast.jsx
  Key elements:
    - Projected EOY balance KPI strip (current + projected + delta)
    - Forecast bars chart (12 months actual + 3-12 projected,
      different fill style for projected).
    - YTD averages section
    - Per-category burn-rate table (from
      components/forecast/BurnRateTable.tsx — verify it matches).
    - "Coach insight" card at bottom (sparkle icon, soft accent
      background, advisory text). For now, render a static message —
      the real coach engine is out of scope.

Begin with TRANSACTIONS. Output the structural diff first.
```

---

## 8. Session 5 prompt — Coach stub (if needed) + auth + cleanup

```
Final pass. Three small tasks.

TASK 1 — Auth verification
Compare app/(auth)/* against design-refs/src/auth.jsx. Per
docs/rehaul-progress.md Chunk 2.1, the auth pages were already done in
Sterling split-screen style, but verify against the ref now that the
primitives are realigned and JBM is back. Specifically check:
  - Brand panel layout, gradient, sparkline preview
  - Form panel: AuthHeader (mono kicker + 36px title + subtitle)
  - Field labels: should be JBM uppercase tracked
  - Primary CTA button: full-width + arrow glyph
  - Social SSO buttons: Google + Apple with Icon name="logo-google" /
    "logo-apple" (these icons are in icons.jsx now — were skipped in
    Chunk 2.1 because the icons didn't exist). Render them but
    they can be non-functional for now.

Output a diff. Wait for confirmation. Implement. Build.

TASK 2 — Coach stub finalization
Build app/(app)/coach/page.tsx as a stub-with-real-chrome (NOT a
plain "Coming soon" page). Render:
  - The hero block from coach.jsx lines 7-14: "Beta" badge with
    sparkle icon, then the 36px headline "Your money has patterns.
    Theus reads them, and tells you what to do next." (Note:
    "Sterling" in the ref → "Theus" here. The product name is Theus.)
  - The 4-tile streak strip from coach.jsx lines 17-31, but with
    zero / em-dash values since there's no coach engine yet:
      • Coach streak: "—"
      • Lessons completed: "0 / —"
      • Saved with Coach: "—"
      • Next check-in: "—"
    Use the same icons (pulse, book, arrow-up, bell) and JBM 22/600.
  - A single empty-state insights card in place of the 3 insights
    block: surface bg, line border, radius 14, padding 20, sparkle
    icon in an accent-soft 38x38 rounded-10 tile, with title "Coach
    is learning your patterns." and body "Insights appear here once
    Coach has analysed at least four weeks of transactions."
  - SKIP the learning path entirely.

Output a diff of the planned page vs coach.jsx (showing what's
omitted and why). Wait for confirmation. Implement.

TASK 3 — Cleanup
  - Bump lib/version.ts BUILD_VERSION to v2.1.0-α with a "Sterling
    1:1" note.
  - Update CLAUDE.md §6 "Design direction": replace the Sterling × Theus
    Theus-flat language with "Sterling 1:1, palette TBD". Note that
    JetBrains Mono is back. Note the new Icon component and Topbar.
  - Update docs/rehaul-progress.md with the final chunk entry.
  - Search the codebase for "JetBrains Mono" / "JBM" / "dropped JBM"
    in comments and update or remove obsolete references.
  - Verify no inline hex colors snuck in across all changes:
    grep -rn '#[0-9A-Fa-f]\{6\}' components/ app/ — every match should
    be either in tokens.css, an SVG attribute that legitimately needs
    a literal, or a comment.

After all three tasks, run full pipeline:
  - npm run typecheck
  - npm run lint
  - npm test
  - npm run build

Confirm the deploy preview URL renders correctly across all five pages.
```

---

## 9. Things to do BEFORE Session 1

1. **Create the branch:** off `experimental/theus-rehaul`, create
   `experimental/theus-sterling-1to1`. Treat the previous branch as
   a checkpoint you can return to.

2. **Drop `DESIGN_NOTES.md` (the companion file) into `docs/`.**

3. **Re-upload `Design.zip` if it had files I didn't see.** The upload
   was 22 bytes (empty). Everything I worked from was inside `v2.zip`.
   If your "Claude design" output had additional JSX I didn't
   process, send it now and I'll fold the contents into the plan.

4. **Decide on the three decisions in §2.** Write them down. Each
   session prompt expects them.

---

## 10. What success looks like

- Sidebar with monoline icons + active state matching `dashboard.jsx`
- Topbar with search field, FX chip, bell, "+ New"
- Dashboard greeting/period/KPIs/cashflow/categories/recent — visually
  indistinguishable from `dashboard.jsx` including the Sterling navy
  palette
- Transactions page with day-grouped table and Sterling filter row
- Accounts, Categories, Forecast pages each match their refs
- All `npm run typecheck` / `lint` / `test` / `build` green
- Sidebar version marker shows v2.1.0-α
- Auth pages refreshed against ref
- Palette tweaks (within Sterling's family) and any per-page polish
  happen as separate small chunks afterward
