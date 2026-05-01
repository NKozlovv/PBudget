# Theus Rehaul — Phase 1 Plan

**Branch:** `experimental/theus-rehaul` (forked from `master` @ `cd6e2bf` — v1.0.1).
**Goal:** Full visual + structural rehaul. Move from a single-file vanilla `index.html` (~240 KB, 5529 lines) to a production-grade Next.js + TypeScript + Tailwind app dressed in the Theus identity over Sterling's structural language.
**Status:** Awaiting approval. No production code touched.

---

## 1. Current state inventory

The entire app lives in `index.html`. It is a single-page vanilla JS app that talks directly to Supabase from the browser using a publishable key.

### What works (verified in code)

| Area | Functions / location | Status |
| --- | --- | --- |
| **Auth** — login, signup, password reset | `checkAuth` 4308, `renderAuthScreen` 4314 | Works |
| **Budget bootstrap** — auto-creates "My Budget" on first login | `ensureBudget` 4416 | Works |
| **Data load** — fetch accounts, categories, subcategories, transactions | `loadBudgetData` 4738 | Works |
| **Transaction CRUD** | `cloudCreateTx`/`UpdateTx`/`DeleteTx` 4966–4985 | Works |
| **Account CRUD** | `cloudCreateAccount`/`Update`/`Delete` 4814–4829 | Works |
| **Category & subcategory CRUD** | `cloudCreate/Rename/Delete/Reassign…` 4835–4924 | Works |
| **Bulk XLSX import** with FX backfill | `parseXlsxRaw` 1346, `cloudBulkImport` 5371 | Works |
| **Historical FX** (Frankfurter API + cache) | `fetchHistoricalFxRate` 1252, `_fxCache` 1250 | Works |
| **Per-tx EUR conversion** (uses stored `fx_rate` first, falls back to live rate) | `txToEUR` 953 | Works |
| **EUR balance at month end** (uses end-of-month historical rate) | `accountBalanceEUR` 1153 | Works |
| **Timezone-safe date helpers** | `dateStr`, `monthOfDate`, `yearOfDate`, `dateDisplay` 982–1010 | Works |
| **Views** — Dashboard, Transactions, Accounts, Categories, Forecast | `renderDashboard` 1716, `renderTransactions` 2812, `renderAccounts` 2952, `renderCategories` 3148, `renderForecast` 3668 | Works |
| **Bills/Fees auto-creation** for transfer fees | `ensureBillsFees` 4034 | Works |
| **Transfer modal** — cross-currency, FX rate, fee → Bills/Fees | shipped v1.0.0 | Works |
| **Version marker** bottom-right | `BUILD_VERSION` consumed at top of `<style>` | Works |
| **Supabase RLS** — `is_budget_member` helper, owner-as-member trigger, accept-pending-invites trigger | DB only, see CLAUDE.md §4 | Works |

### What's broken / fragile

- **Publishable key is hardcoded in source.** Acceptable per Supabase's new key model, but `.env`-driven configuration is required for the new stack.
- **No build, lint, or type checks.** Every regression is caught visually.
- **Inline Modern Soft tokens** in `<style>` are about to be thrown away — they were the precursor to this rehaul.
- **No tests** anywhere.
- **`localStorage` fallback** in `loadState` 894 is dead — the comment in CLAUDE.md says local storage is intentionally not used. This branch confirms it via `window.storage` which isn't defined; the legacy fallback path is unreachable in practice. Will be deleted in migration.

### Dependencies (CDN today; pinning to npm)

- `xlsx` 0.18.5 (SheetJS)
- `chart.js` 4.4.1
- `@supabase/supabase-js` 2.x

---

## 2. Preserve — features that exist and work, refactor visually only

These ship verbatim into the new stack with new visuals, no behavior change:

1. Auth (login / signup / password reset / session persistence)
2. Budget bootstrap on first login
3. Transaction CRUD + filters (month, category, account, type, search)
4. Account CRUD (EUR / USD)
5. Category + subcategory CRUD (expense + income)
6. Transfer modal (cross-currency, fee → Bills/Fees)
7. XLSX import with historical FX backfill
8. FX caching layer (Frankfurter API)
9. Timezone-correct date helpers — **must be re-implemented exactly**, including the `YYYY-MM-DD` literal regex parser. CLAUDE.md §8b documents the regression risk.
10. The `'Account adjustment'` → `type:'adjustment'` import classification (CLAUDE.md §8a)
11. Five-view IA: Dashboard / Transactions / Accounts / Categories / Forecast
12. Version marker (now sourced from `package.json` + git SHA via build-time env)
13. Toast notifications

---

## 3. Refactor — code that needs structural cleanup

| Area | Current pain | New approach |
| --- | --- | --- |
| **State** | One global `state` object mutated in place + `render()` redraws everything | React + a small data layer. TanStack Query for server state, Zustand or React Context for tiny UI state (active filter, modal). |
| **Data access** | Inline `supabase.from('…').insert(…)` calls scattered through `cloud*` functions | Typed repository module per resource (`accounts`, `categories`, `transactions`, `budgets`) under `lib/data/`. |
| **FX cache** | `_fxCache` global object | Service module `lib/fx.ts` with in-memory + IndexedDB persistence; expose `getRate(date)` and `prefetchEom(year)`. |
| **XLSX parse** | 200-line `parseXlsxRaw` mixing parse + classify + dedupe | Split into `parseSheet`, `classifyRows` (handles Account-adjustment), `mergeWithExisting`. |
| **Charts** | Chart.js with imperative config | Recharts (composes well with React, supports tabular-num display via SVG `<text>` children). |
| **Modals** | DOM `#modalRoot` + manual show/hide | Radix UI Dialog primitives (a11y, focus trap, ESC/overlay close come for free). |
| **Forms** | Manual `addEventListener` + `value` reads | `react-hook-form` + `zod` for validation. |
| **Date helpers** | Functions defined inline mid-file | `lib/date.ts` — exact same logic, with unit tests for the timezone-shift regression. |

---

## 4. Scaffolded but not implemented — needs your scope decision

These are referenced in code or roadmap but not actually built. **I will not build any of these without your explicit go-ahead.** Tell me which are in scope for the rehaul and which are deferred.

1. **Multiple budgets** — there is a `#budgetDropdownList` element 802 and `cloudUpdateBudget` 4803 exists, but the UI to switch / create / rename additional budgets isn't wired. The DB schema (`budgets`, `budget_members`, `budget_invites`) fully supports it.
2. **Inviting other users** — `budget_invites` table and `trg_accept_pending_invites` trigger are live, but no UI to send invites or list members. Phase 5 in CLAUDE.md.
3. **Auto category-color assignment** — CAT_SEMANTIC array 1022 and CAT_DOT_FALLBACK 1052 exist but the "edit colors per category" UI is not built. CLAUDE.md says this is deferred past v1.
4. **Coach view** — Sterling design refs include `src/coach.jsx` (a coaching/recommendations panel). No equivalent exists in `index.html`. Pure new feature if adopted.
5. **Mobile layout** — Sterling refs include `src/mobile.jsx` and `ios-frame.jsx`. Current `index.html` is desktop-only with no responsive breakpoints. The new app has to make a call: responsive web only, or a separate mobile experience?
6. **Light mode** — both Sterling and Theus tokens define `light` and `dark` variants. Current app is light only. Do we ship a theme toggle?
7. **CSP headers, rate limiting, CSRF** — your engineering standards mention them, but the app today exposes only the Supabase publishable key (RLS does the gating). With Next.js we can add CSP via middleware and rate-limit any new API routes. Scope-tag: only relevant if we add server routes; pure-client Supabase calls do not need them.

---

## 5. Design tokens — what was actually extracted

Verified by reading the JSX files, not screenshots.

### 5.1 Theus tokens (identity — palette comes from here)

Source: `design-refs/src/theus-tokens.jsx`.

**Dark mode (primary, the "boards" you saw):**

| Token | Value | Use |
| --- | --- | --- |
| `--bg` | `#0F1A14` | Deep forest — page background |
| `--bg-soft` | `#162420` | Subtle alt surface |
| `--bg-panel` | `#1C2C26` | Card / panel background |
| `--ink` | `#EFE9D8` | Warm cream — primary text |
| `--ink-soft` | `#C7BFA9` | Secondary text |
| `--ink-mute` | `#7E7762` | Tertiary text, mono labels |
| `--rule` | `rgba(239,233,216,0.16)` | Hairline borders / dividers |
| `--grid` | `rgba(239,233,216,0.05)` | Chart gridlines |
| `--accent` | `#C9A24A` | Brass — CTAs, highlights, active states |
| `--accent-soft` | `rgba(201,162,74,0.18)` | Active-row backgrounds, badge fills |
| `--pos` | `#7FB58A` | Sage — income / gains |
| `--pos-soft` | `rgba(127,181,138,0.18)` | Positive deltas |
| `--neg` | `#D9603A` | Warm rust — expenses / losses |
| `--neg-soft` | `rgba(217,96,58,0.16)` | Negative deltas |

**Light mode:**

| Token | Value |
| --- | --- |
| `--bg` | `#F2EEDF` (warm cream) |
| `--bg-soft` | `#E8E3D0` |
| `--bg-panel` | `#FFFAEC` |
| `--ink` | `#0F1A14` |
| `--accent` | `#7A5A1B` (deep brass) |
| `--pos` | `#3D5A48` |
| `--neg` | `#8E4A22` |

**WCAG check (preview, will re-verify with real renders):**
- `--ink #EFE9D8` on `--bg #0F1A14` → contrast ratio **~13.5:1** (AAA pass).
- `--ink-mute #7E7762` on `--bg #0F1A14` → ratio **~4.6:1** (AA pass for body text, borderline for small text).
- `--accent #C9A24A` on `--bg #0F1A14` → ratio **~7.1:1** (AAA pass).
- `--pos #7FB58A` on `--bg #0F1A14` → ratio **~6.4:1** (AA-large pass; need to bump for body text — will tune to ~`#90C29A` if needed).

### 5.2 Sterling structure (geometry, type, components — palette is NOT taken)

Source: `design-refs/src/tokens.jsx`, `brand-system.jsx`, `theus-dashboard.jsx` (which is Sterling structure dressed in Theus identity — exactly the brief).

**Typography:**

| Family | Use |
| --- | --- |
| `'Inter'` 300/400/500/600/700 | All UI text. Body 14px, weight 400. |
| `'Instrument Serif'` italic | One thing only: tagline / motto moments (per `theus-dashboard.jsx` line 181). Never headings. |
| `'JetBrains Mono'` 400/500/600 | Monetary numerals (with `font-variant-numeric: tabular-nums`), uppercase mono labels with `letter-spacing: 0.14em`, dates in tables. |

**Type scale (extracted from `brand-system.jsx` 83–88):**

| Name | Size | Weight | Letter-spacing | Line-height |
| --- | --- | --- | --- | --- |
| Display | 96 px | 700 | -0.04em | 1 |
| Headline | 44 px | 600 | -0.03em | 1.1 |
| Title | 22 px | 600 | -0.02em | 1.2 |
| Body | 14 px | 400 | 0 | 1.55 |
| Caption | 11 px | 500 | 0.04em | 1.4 |
| Mono label | 10–11 px | 500 | 0.14em uppercase | 1 |
| KPI numeral | 32 px | 500 | 0 | 1 |

**Geometry:**

- Page padding: `28px 36px` for app shell main, `56px 64px` for marketing-style screens.
- Sidebar: 220 px fixed, `24px 20px` padding, `32px` gap between groups.
- Card padding: `20–28 px`, depending on density.
- Border radii: cards & buttons in this design are mostly **square** (no radius). Pills are still 100 px. This is an intentional break from the previous "Modern Soft" rounded cards — Theus / Sterling go editorial / architectural, not pillowy.
- Borders: `1px solid var(--rule)` everywhere. No drop shadows. Depth comes from hairline borders + cream-on-forest contrast.
- KPI strip technique: a 4-column grid with `gap:1px` and `background:var(--rule)`, child cells set `background:var(--bg)`. This produces 1-pixel dividers without any extra DOM.
- Sidebar nav active state: `2px solid var(--accent)` left border + `var(--accent-soft)` background.

**Components seen in references:**

- `<Mono>` — uppercase tracked label, mono font
- `<Num>` — tabular-num monetary value
- `<Sans>` — body / heading text
- KPI tile: `Mono` label → `Num` big number → `Mono` delta + `Sans` sub-caption
- Bar chart: paired bars (income green / spend brass), 4 px gap inside group, dashed gridlines
- Donut: stroke-based ring, 22 px stroke width, category color list to the side
- Sparkline: area + line + baseline rule
- Transaction row grid: `88px / 1fr / 1fr / 140px` (date / payee / category / amount-right-aligned)

### 5.3 What we do NOT take from Sterling

Per your brief, none of these enter the production code:
- Sterling palette: `#0A0E1A` ink-bg, `#7B8BFF` indigo accent, `#A78BFA` lavender, `#5EE6A8` mint, `#FF7A8A` coral, `radial-gradient` glow, `boxShadow: '0 12px 32px rgba(123,139,255,0.25)'`.
- Sterling logos and the "Sterling" name.
- The `react@18 + babel-standalone` runtime that powers the reference files. (References are reference-only; we use Next.js.)

---

## 6. Proposed folder structure

```
/                                # repo root
  package.json
  next.config.mjs
  tsconfig.json (strict)
  tailwind.config.ts
  postcss.config.mjs
  .env.example
  .eslintrc.json
  .prettierrc
  vitest.config.ts
  README.md                      # updated
  CLAUDE.md                      # updated (see §8 below)

  app/                           # Next.js App Router
    layout.tsx                   # root layout, fonts, ThemeProvider
    globals.css                  # Tailwind + CSS variable tokens
    (auth)/
      login/page.tsx
      signup/page.tsx
      reset/page.tsx
    (app)/
      layout.tsx                 # sidebar + topbar shell
      dashboard/page.tsx
      transactions/page.tsx
      accounts/page.tsx
      categories/page.tsx
      forecast/page.tsx
    api/
      health/route.ts            # readiness check for Vercel preview
    middleware.ts                # Supabase auth refresh + CSP headers

  components/
    ui/                          # primitives — Button, Card, Pill, Mono, Num, Sans, Dialog, …
    charts/                      # IncomeSpendBars, Sparkline, Donut, BalanceLine
    forms/                       # TransactionForm, AccountForm, TransferModal, …
    nav/                         # Sidebar, Topbar, BudgetSwitcher
    transactions/                # TxTable, TxRow, TxFilters, BulkActionBar
    accounts/                    # AccountMatrix, AccountDistribution
    categories/                  # CategoryList, SubcategoryList, CategoryDrillDown
    dashboard/                   # KpiStrip, RecentActivity
    forecast/                    # YtdSummary, ForecastChart

  lib/
    supabase/
      client.ts                  # browser client
      server.ts                  # server component / route-handler client
      types.ts                   # generated types from Supabase CLI
    data/
      accounts.ts                # repo: list/create/update/delete
      categories.ts
      transactions.ts
      budgets.ts
      members.ts
    fx.ts                        # historical rate cache + getter
    date.ts                      # timezone-safe helpers (CLAUDE.md §8b)
    xlsx/
      parse.ts                   # XLSX → raw rows
      classify.ts                # Account adjustment → adjustment type (CLAUDE.md §8a)
      import.ts                  # orchestrate parse → classify → upsert
    money.ts                     # fmtEUR, fmtUSD, txToEUR, etc.
    contrast.ts                  # WCAG check helper for category color picker
    config.ts                    # window.LEDGER_CONFIG → typed env

  hooks/                         # useTransactions, useAccounts, useCategories, useFx, …

  styles/
    tokens.css                   # raw CSS variables, source of truth
    fonts.css                    # @font-face if self-hosting

  public/
    favicon.svg
    og.png

  test/
    lib/date.test.ts             # regression for timezone shift
    lib/fx.test.ts
    lib/xlsx/classify.test.ts    # regression for Account adjustment

  design-refs/                   # untouched — reference only, never imported

  docs/
    rehaul-plan.md               # this file
    rehaul-progress.md           # appended after each chunk
    architecture.md              # short note on data flow + tokens
```

**Reasoning:**
- `app/(auth)` and `app/(app)` route groups separate unauthenticated and authenticated shells without leaking into the URL.
- `components/ui/` holds typography + layout primitives matching the design refs (`Mono`, `Num`, `Sans`).
- `lib/data/` is the single boundary for Supabase. Components never import `@supabase/supabase-js` directly.
- Tests sit in `test/` mirroring `lib/`. The two regression tests (timezone, Account-adjustment) are mandatory.

---

## 7. Migration order — chunks sized for one session each

Each chunk leaves the branch in a working, deployable state, with a Vercel preview URL. After every chunk: commit, push, verify preview, append to `docs/rehaul-progress.md`, stop.

### Chunk 0 — repo bootstrap *(this session, after approval)*
- `package.json`, `tsconfig.json` (strict), `next.config.mjs`, `tailwind.config.ts`, `.eslintrc.json`, `.prettierrc`, `vitest.config.ts`, `.env.example`, `.gitignore` updates.
- Default Next.js scaffold with a single `/` page that renders "Theus — coming soon" using the Theus tokens, so the Vercel preview shows the new identity immediately.
- Move `index.html` to `legacy/index.html` and add `vercel.json` so the legacy version is reachable at `/legacy` until the new app reaches feature parity. **(This keeps the live experimental preview functional even before features land.)**
- **Stop signal:** Vercel preview shows the placeholder; legacy reachable at `/legacy`; CI typecheck + lint pass.

### Chunk 1 — design system foundation
- `styles/tokens.css` with all Theus light + dark tokens.
- Tailwind config consumes those variables (semantic colors as `bg`, `ink`, `accent`, `pos`, `neg`).
- `components/ui/` primitives: `Mono`, `Num`, `Sans`, `Card`, `Pill`, `Button`, `IconButton`, `Divider`, `KpiTile`.
- A `/styleguide` route (private to dev mode) showing every primitive at every size, for visual QA.
- Light/dark toggle with `prefers-color-scheme` default.
- Real WCAG verification on every token combination, with results checked into `docs/contrast-report.md`.
- **Stop signal:** styleguide page renders all primitives; contrast report committed.

### Chunk 2 — Supabase client, env, auth shell
- `.env.example` with the publishable key + URL keys; real values move to Vercel env settings (you set them, not me).
- `lib/supabase/{client,server,types}.ts`. Run Supabase CLI to generate types from the live schema.
- `app/middleware.ts` — Supabase session refresh + CSP header scaffolding.
- Auth pages (login, signup, reset) using the new design system. Email/password only — same flows as today.
- Sign-out + protected route redirect.
- **Stop signal:** can sign into the Vercel preview as your existing user; protected route redirects unauthed users to `/login`.

### Chunk 3 — data layer + budget bootstrap
- `lib/data/{budgets,accounts,categories,transactions,members}.ts` with full CRUD typed against generated schema.
- TanStack Query setup, query-key factories.
- `ensureBudget` ported to a server action.
- `lib/date.ts`, `lib/money.ts`, `lib/fx.ts` ported with **regression tests** for timezone (`new Date('2026-01-01').getDate() === 1` in Berlin) and Account-adjustment classification.
- **Stop signal:** loads real account & transaction data after login but renders raw JSON; tests green.

### Chunk 4 — app shell (sidebar, topbar, route group)
- `app/(app)/layout.tsx` matching `theus-dashboard.jsx` lines 142–171 — 220 px sidebar, brass active border, mono "currencies" footer.
- Topbar: greeting + italic Instrument Serif tagline + action buttons.
- Five empty route stubs: dashboard / transactions / accounts / categories / forecast.
- **Stop signal:** authed users see the Theus shell with working nav; each route prints its own name.

### Chunk 5 — Dashboard
- KPI strip (Net worth, Income MTD, Spend MTD, Savings rate) using the 1-px-grid divider technique.
- `IncomeSpendBars` (Recharts).
- `Cashflow` sparkline (Recharts).
- Category donut + list.
- Recent transactions table preview (read-only) — `88px / 1fr / 1fr / 140px` grid.
- **Stop signal:** dashboard mirrors `theus-dashboard.jsx` with real data.

### Chunk 6 — Transactions page
- Filters: month / category / account / type / search.
- Table with sortable columns + inline edit (Build 3 in CLAUDE.md roadmap).
- Bulk-action bar (checkboxes → recategorize / change account / delete).
- Add / edit transaction modal (Radix Dialog).
- **Stop signal:** parity with current Transactions view; all CRUD round-trips through Supabase.

### Chunk 7 — Accounts page
- Account matrix (months × accounts × native + EUR balances).
- Distribution donut.
- Per-account trajectories line chart.
- Add / edit / delete account modal.
- **Stop signal:** parity with current Accounts view.

### Chunk 8 — Categories page + drill-down modal
- Expense + income lists with subcategories.
- Spend totals, edit / rename / delete.
- Category drill-down modal (Build 4 in CLAUDE.md): tinted header, three stats, monthly trend, sub-cat breakdown, recent tx, "show all" deep link.
- **Stop signal:** parity + drill-down working.

### Chunk 9 — Forecast page
- YTD averages.
- Projected balance trajectory.
- Per-category burn rate.
- **Stop signal:** parity with current Forecast.

### Chunk 10 — XLSX import
- Drag-and-drop import card.
- `lib/xlsx/{parse,classify,import}.ts` with the Account-adjustment regression test.
- Pre-fetches Frankfurter rates for all imported tx dates.
- Progress UI.
- **Stop signal:** can re-run the original Google-Sheets import end-to-end against a fresh user.

### Chunk 11 — Cutover
- Move legacy from `/legacy` → archived; new app served from `/`.
- Delete legacy folder once you confirm a week of clean usage. **(Not part of this chunk — user-gated.)**
- Update `CLAUDE.md`, `README.md`.
- Bump build version to `v2.0.0 — Theus rehaul`.
- Final security pass: `npm audit`, CSP header verified live, lighthouse a11y score ≥ 95.
- **Stop signal:** PR-ready; user reviews on preview, approves, then we merge to master.

### Chunks deferred unless you green-light (§4)

- Multiple budgets (12)
- Member invitations (13)
- Coach view (14)
- Mobile-specific layout (15)
- Category color editor (16)

---

## 8. CLAUDE.md staleness — proposed updates

Once you approve this plan, I'll propose edits to `CLAUDE.md`:

- **§3 (Tech stack):** rewrite to reflect Next.js + TS + Tailwind + Supabase SSR.
- **§5 (What's built so far):** add a "Pre-rehaul snapshot" header to clarify it's frozen.
- **§6 (Modern Soft direction):** mark **superseded by Theus**; keep as historical note.
- **§7 (Roadmap Builds 2–5):** mark superseded; new chunks live in `docs/rehaul-plan.md`.
- **§8 (Bug history):** keep verbatim — these gotchas still apply, just in a typed codebase.
- **§9 (Architecture notes):** rewrite around the new folder structure.
- **§10 (Workflow):** update — Vercel auto-deploy still applies, but now with build step + lint + typecheck.

I won't touch CLAUDE.md until approved.

---

## 9. Risks

| # | Risk | Severity | Mitigation |
| --- | --- | --- | --- |
| R1 | **Supabase RLS regressions.** New SSR client uses cookies and the same publishable key — any policy that assumes `auth.uid()` from a JWT must keep working. | High | Chunk 2 runs the existing schema + RLS unchanged. We only change the client. Test by signing in & reading transactions before touching Chunk 3. |
| R2 | **Timezone bug regression.** CLAUDE.md §8b — Berlin users lose 1 Jan if `new Date('YYYY-MM-DD')` is used naively. | High | `lib/date.ts` ports the regex parser verbatim. Mandatory unit test in Chunk 3. |
| R3 | **`Account adjustment` classification regression.** CLAUDE.md §8a — €13,632 inflation if mis-imported. | High | `lib/xlsx/classify.ts` with mandatory unit test using a real-shape fixture (Chunk 10). |
| R4 | **Historical FX rounding drift.** Old code uses `_fxCache[eomDateStr]` → `state.fxRate` fallback. New code must replicate exactly or balances will shift. | Medium | `lib/fx.ts` mirrors the lookup order. Snapshot test against a known-good month. |
| R5 | **Vercel preview must build cleanly on first push.** | Medium | Chunk 0 is intentionally tiny (placeholder page only). If it breaks, fix before piling on. |
| R6 | **Master vs experimental branch confusion.** | Medium | Vercel "Production Branch" stays `master`. `experimental/theus-rehaul` only generates preview deploys. Verify in Vercel project settings before pushing. |
| R7 | **Scope creep from §4 features.** | Medium | Hard rule: I do not start any §4 item without you saying "do X". |
| R8 | **Color contrast for `--pos`.** Sage green `#7FB58A` on forest `#0F1A14` is borderline (~6.4:1) — fine for large text but needs verification for small body. | Low | Tune to `#90C29A` if WCAG check fails in Chunk 1. |
| R9 | **CDN library shapes** — `XLSX`, `Chart.js` (replaced by Recharts), `supabase-js` change semantics slightly under npm. | Low | Pin to the exact same minor versions and read changelogs. |
| R10 | **Supabase env keys in preview.** Vercel preview deploys need their own env block. Until you set them, the preview will fail to authenticate. | Low (you-action) | Documented in `.env.example`; I'll prompt you in Chunk 2 to paste the keys into Vercel. |

---

## 10. Open questions for you before Phase 2

1. **§4 scope:** which of the seven scaffolded-but-not-implemented items are in scope for this rehaul vs deferred?
2. **Light mode:** ship a theme toggle, or dark-only at first?
3. **Mobile:** responsive-only, or a separate mobile layout (Sterling provides a `mobile.jsx` reference)?
4. **Vercel env:** confirm you'll add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` to the experimental branch's preview env when Chunk 2 lands.
5. **Cutover gate:** is the plan's Chunk 11 cutover (replace `master`'s index.html with the new app) acceptable, or do you want to keep both running side-by-side longer?
6. **Test budget:** how heavy do you want tests? My default is regression-critical only (date, FX, XLSX classify) + smoke tests. Adding component tests on every chart adds time but isn't load-bearing.

Once these are answered I'll execute Chunk 0.
