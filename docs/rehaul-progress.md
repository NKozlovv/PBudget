# Rehaul Progress Log

Append-only log, one entry per chunk.

---

## Chunk 0 — repo bootstrap (2026-05-01)

Next.js 15 + React 19 + strict TS scaffold. Tailwind v3 with Theus dark tokens via CSS variables. Inter/JetBrains Mono/Instrument Serif via `next/font/google`. Placeholder home page in Theus identity. Legacy `index.html` moved to `public/legacy/`, reachable at `/legacy` via Next.js rewrite. Security headers in `next.config.mjs`. ESLint + Prettier + Vitest configs.

Vercel build needed two version bumps: `next` 15.5.4 was vulnerability-flagged → bumped to `^15.5.15`; `eslint-config-next` doesn't publish past 15.5.x so both pinned to that line.

---

## Chunk 1 — design system foundation (2026-05-01)

Tokens extracted to `styles/tokens.css`. Six primitives in `components/ui/`: `Mono`, `Num`, `Card` + `CardHeader`, `Pill`, `Button`, `KpiTile`. `/styleguide` route and `docs/contrast-report.md` with full WCAG matrix. Two AA accessibility nudges to source palette: `--ink-mute` `#7E7762`→`#8E866E`, `--neg` `#D9603A`→`#E9673E`.

### Chunk 1.1 — Sterling realignment

User feedback: chunk 1 used Theus's flat geometry. Realigned: cards `rounded-2xl` (16px) on `bg-bg-soft`, buttons `rounded-[10px]` with Sterling proportions, KPI tiles as separate rounded cards (dropped the 1-px-grid divider that was Theus's pattern). Styleguide rebuilt with Sterling-style hero balance and time-range pill container.

---

## Chunk 2 — Supabase SSR + auth shell (2026-05-01)

**Done:**

Tokens
- `--accent` brightened `#C9A24A`→`#D8B055` per design feedback (still AAA, 7.43→8.71 on bg).

Supabase wiring
- `@supabase/ssr` and `@supabase/supabase-js` added (caret-pinned to current latest).
- `lib/env.ts` — lazy `getSupabaseEnv()` so public pages render before env vars are configured in Vercel; `isSupabaseConfigured()` for graceful guards.
- `lib/supabase/client.ts` — `createBrowserClient` factory (client components).
- `lib/supabase/server.ts` — `createServerClient` factory using `cookies()` from `next/headers`.
- `lib/supabase/middleware.ts` + `middleware.ts` — refresh session cookie on every request, redirect unauth users from protected paths (`/dashboard`, `/transactions`, `/accounts`, `/categories`, `/forecast`) to `/login?next=…`, redirect authed users away from `/login`/`/signup`/`/reset` to `/dashboard`. Public routes (`/`, `/styleguide`, `/legacy`, static) bypass via the matcher.

Auth pages
- Route groups: `app/(auth)` for unauth shell, `app/(app)` for protected.
- `(auth)/layout.tsx` — centered Theus header + footer.
- `(auth)/login/page.tsx`, `(auth)/signup/page.tsx`, `(auth)/reset/page.tsx` — each renders a single rounded `Card` with the matching client form.
- `components/auth/{SignInForm, SignUpForm, ResetForm, SignOutButton}.tsx` — vanilla `<form>` + Supabase auth methods, no react-hook-form yet.
- `(app)/layout.tsx` — server component, `getUser()` → redirect to `/login` if no session.
- `(app)/dashboard/page.tsx` — placeholder showing signed-in email + user id, with a sign-out button. Real dashboard lands in Chunk 5.

Form primitives
- `components/ui/Input.tsx`, `components/ui/Field.tsx` (label + input + hint/error). Render-prop API on `Field` so the consumer wires `id` to whichever input variant they're using.

Security headers tightened
- `next.config.mjs` now sets a real CSP. Permissive enough for the legacy bundle at `/legacy` (CDN scripts, inline styles, fonts) — will be tightened further in Chunk 11 once legacy is retired.
- Added `Strict-Transport-Security` (2-year max-age, preload).

**Vercel env reminder (you-action):**

Add these to Vercel → Project → Settings → Environment Variables (Preview env, scoped to `experimental/theus-rehaul` is fine):
- `NEXT_PUBLIC_SUPABASE_URL` = `https://udcfjiuybkugbydlaltk.supabase.co`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` = `sb_publishable_-GYV876glbqSw-JJt4knfg_Ks9PTj8z`

Until that's done, `/login`, `/signup`, `/reset`, `/dashboard` will fail with a clear error message ("Supabase env not configured…"). `/`, `/styleguide`, `/legacy` keep working regardless.

**Next:** Chunk 3 — typed data layer + regression tests (date helpers + FX cache + Account-adjustment classification).

**Open questions:** none.

### Chunk 2.1 — Sterling auth split layout (2026-05-01)

User feedback: chunk 2 auth pages were a centered card; Sterling's auth (`design-refs/src/auth.jsx`) is a split-screen with editorial brand panel + form panel. Built:

- `app/(auth)/layout.tsx` — `md:grid-cols-[1.1fr_1fr]`, drops Card wrapper
- `components/auth/BrandPanel.tsx` — left panel with diagonal gradient + accent radial, "Theus" wordmark, big Instrument-Serif `Money, understood.` headline (italic accent on "understood"), description, balance preview card with mini sparkline, mono footer
- `components/auth/Sparkline.tsx` — tiny static area sparkline for the preview card
- `components/auth/AuthHeader.tsx` — mono kicker + 36px title + subtitle group
- All three forms (Sign in / Sign up / Reset) use `AuthHeader` and a full-width primary CTA with `→` glyph
- `Field` label restyled to mono uppercase tracked (Sterling pattern)

Mobile: brand panel hidden below `md`; form takes full width.

Skipped: social SSO buttons (Google/Apple in Sterling reference) — Supabase project doesn't have providers configured yet. Add later if/when configured.

### Chunk 2.2 — auth refinements (2026-05-01)

User feedback: brand panel needed Theus's actual logo + better gradient + horizontal centering. Two iterations:
- Ported `design-refs/src/theus-logo.jsx` → `TheusMark` + `TheusLockup`
- Killed the triple-gradient layering (was muddy on green); single brass radial on flat `bg-panel` reads cleaner
- Editorial column now `justify-center` (was left-stranded on >1280px screens)
- Headline scales 64 → 76 → 84 px (md / lg / xl)
- Field label switched off `font-mono` (JetBrains Mono looked typewriter-y) → plain Inter uppercase tracked, matches Sterling `auth.jsx:103`

---

## Chunk 3 — typed data layer + regression tests (2026-05-02)

**Done:**

Types
- `lib/supabase/types.ts` — hand-written from CLAUDE.md §4 schema. To be regenerated via Supabase CLI later.

Pure helpers (with regression tests)
- `lib/date.ts` — `monthOfDate`, `yearOfDate`, `dayOfDate`, `dateToISO`, `dateStr`, `dateDisplay`, `eomDateStr`, `monthName`. All TZ-safe via regex parser + local-component Date construction.
- `lib/money.ts` — `fmtEUR`, `fmtUSD`, `fmtCurrency`, `txToEUR` (mirrors legacy `txToEUR()` index.html line 953), `signedAmount` (handles the adjustment-amount-as-stored-sign rule from CLAUDE.md §8a).
- `test/lib/date.test.ts` — 14 cases. Canonical regression: `monthOfDate('2026-01-01')` returns 0 (not 11) regardless of TZ.
- `test/lib/money.test.ts` — 12 cases including USD→EUR conversion with stored vs fallback rate, and the adjustment sign rule.

Data layer (server-only)
- `lib/data/budgets.ts` — `listBudgets`, `getOrCreateUserBudget` (mirrors legacy `ensureBudget()` line 4416), `updateBudget`.
- `lib/data/accounts.ts` — `listAccounts(budgetId)`.
- `lib/data/categories.ts` — `listCategories(budgetId, kind?)` + `listSubcategories(categoryIds[])`.
- `lib/data/transactions.ts` — `listTransactions(filters)` with month/category/account/type/date-range/pagination + `countTransactions`.
- All modules `import 'server-only'` to prevent accidental client-side use.

Dashboard (read-only)
- `app/(app)/dashboard/page.tsx` now actually loads & displays data: signed-in email, budget, account count, transaction count, accounts table, expense + income category pills, last 8 transactions with EUR conversion.
- Uses server components — direct `await` on the data layer modules.

**Skipped (deferred):**
- TanStack Query — read paths use server components; client mutations land Chunk 6.
- `lib/fx.ts` — only needed during XLSX import; ships in Chunk 10.
- `lib/data/members.ts` — ships in Chunk 13 (invites).
- Account-adjustment classifier regression test — lives with the XLSX parser, ships Chunk 10.

**Stop signal hit:** loads real account & transaction data after login but renders raw-table view; tests authored (will run in CI/Vercel).

### Chunk 3.1 — typography fix + visual hierarchy (2026-05-02)

User feedback: too much JetBrains Mono everywhere, and the dashboard "blends" — hard to read fast.

Audited Sterling reference and confirmed:
- **Inter (with tabular-nums)** for any number ≥24 px — hero balance, KPI values (`brand-system.jsx:76`, `dashboard.jsx:137,157` use Inter for the 56–64 px display numerals).
- **JetBrains Mono** only for: small uppercase tracked labels (kickers, section labels, deltas), dates in transaction tables, dense ledger cells.

Fixes:
- `Num` component default family changed to `sans` (Inter). Added optional `family="mono"` prop for the rare cases where JetBrains Mono is right (tx-table dates, table-cell amounts in dense rows). `letterSpacing` defaults to `-0.02em` for sizes ≥24 px.
- `KpiTile`'s 32 px value now Inter (was mono).
- New `lib/balance.ts` with `totalBalanceEUR()` and `monthTotalsEUR()` (TZ-safe regex parser) so the dashboard can show real focal numbers.
- Dashboard restructured for hierarchy:
  1. **Hero balance card** at the top — 56 px Inter total balance, brass cents tail, mono budget+tx-count meta, brief explanation
  2. **KPI strip** — Income / Spend / Net for current month, 28 px Inter values colored pos/neg
  3. **Recent transactions** — single full-width table inside a Card, prominent right-aligned EUR column at 15 px weight 600 colored pos/neg by signed direction; dates in mono small uppercase; row hover
  4. **Accounts** + **Categories** moved to a 2-column row below — secondary
- Email moved into the header tagline slot (was a stat card).

---

## Chunk 4 — app shell (sidebar + page header + route stubs) (2026-05-02)

**Done:**

Shell
- `app/(app)/layout.tsx` is now the actual Sterling shell: `grid grid-cols-[232px_1fr]`, sticky sidebar on the left, max-w-6xl content column on the right with `px-10 py-10` padding.
- `components/nav/Sidebar.tsx` — Sterling's `dashboard.jsx:14–50` pattern: `bg-bg-soft` panel, `border-r`, lockup at top, "Manage" mono group header, 5 nav items with rounded-lg + accent-soft active state, identity card pinned to bottom, sign-out tucked under it.
- `components/nav/NavItem.tsx` — client component (`usePathname` for active detection); active = `bg-accent-soft text-accent`, hover = `bg-bg-panel`.
- `components/nav/UserCard.tsx` — gradient initial avatar (brass→ink), email, mono `BUDGET · EUR` line.
- `components/nav/PageHeader.tsx` — reusable: mono kicker → 32 px headline → optional Instrument Serif italic tagline → right-aligned action slot.

Routes
- `app/(app)/dashboard/page.tsx` — uses `PageHeader` (date kicker, "Overview", italic tagline, primary CTA). Removed its own header + sign-out (those live in the shell now).
- `app/(app)/transactions/page.tsx`, `accounts/page.tsx`, `categories/page.tsx`, `forecast/page.tsx` — each shipped as a real `PageHeader` with live counts where cheap, plus a `Stub` card pointing at the chunk that fills it in.
- `components/nav/Stub.tsx` — single tile saying "Lands in Chunk N: …".

Sidebar dependency on identity:
- `(app)/layout` fetches user + budget once and passes them to `<Sidebar>` as props. No client-side Supabase calls in the shell.

**Stop signal hit:** authed users land on `/dashboard` inside the Theus shell; nav highlights the active route; each of the 5 routes renders its own `PageHeader`; sign-out works from the sidebar.

---

## Chunk 5 — dashboard build-out (charts) (2026-05-02)

**Done:**

Chart primitives (inline SVG, no external lib — matches the
design-refs approach exactly)
- `components/charts/Sparkline.tsx` — moved from `auth/` since
  it's general-purpose; updated import in `BrandPanel`.
- `components/charts/IncomeSpendBars.tsx` — paired bars per month
  with dashed gridlines and mono y-axis labels. Sage = income, brass
  = spend (matches `theus-dashboard.jsx:71–72`). `<title>` element
  on each rect for native hover tooltips.
- `components/charts/CategoryDonut.tsx` — stroke-dasharray donut with
  side legend (top 6 + overflow count). Categories colored via
  `lib/categoryColor.ts`.

Color assignment
- `lib/categoryColor.ts` — stable hash → 10-color warm-earthy
  palette (brass, sage, rust, dusty blue, mauve, olive, peach, muted
  green, wheat, purple-gray). Same input always → same color, no
  per-category editor (deferred per plan §4).

Data helpers
- `lib/balance.ts` extended with `lastNMonthsTotals` (fills empty
  months) and `categorySpendEUR` (sorted desc by value, expense-only,
  TZ-safe).

Dashboard wiring
- `Income vs Spend` card (1.6fr) + `Spend by category` card (1fr) row
  below the hero/KPI strip.
- Recent-tx table now renders a per-category color dot next to each
  category name so the donut and the table cohere visually.

**Skipped:**
- Time-range pill (1M / 3M / YTD / ALL) — needs client state, lands
  in Chunk 6 with the transactions filters.
- Cashflow sparkline on the dashboard — the bars chart already
  carries the multi-month story; the sparkline is decorative.
- Coach card — out of scope per plan §4.

**Next:** Chunk 6 — Transactions page (filters, sortable columns,
inline edit, bulk actions, add-transaction modal).

**Open questions:** none.

---

## Chunk 6 — Transactions page + JetBrains Mono purge (2026-05-02)

**Font cleanup (per user feedback):**
- Removed `JetBrains_Mono` from `app/layout.tsx` and the `mono` family from `tailwind.config.ts`. The font is no longer loaded.
- `Mono` component now uses Inter (it's just a small uppercase tracked sans label — kept the name to minimise diff).
- `Num` dropped its `family="mono"` prop. Always Inter + tabular-nums.
- Audited and replaced every `font-mono` Tailwind class and every `var(--font-jetbrains-mono)` SVG fontFamily reference (UserCard, IncomeSpendBars, styleguide, dashboard).

**Transactions page:**
- New deps: `@radix-ui/react-dialog` (focus trap, ESC, portal — accessibility for free).
- New primitives: `components/ui/Select.tsx` (styled native select with custom chevron), `components/ui/Modal.tsx` (Radix Dialog wrapper, no animation deps yet).
- New server actions: `app/actions/transactions.ts` — `createTransactionAction`, `updateTransactionAction`, `deleteTransactionAction`. Each runs an auth check, mutates Supabase, then `revalidatePath`s `/transactions` + `/dashboard`.
- `lib/data/transactions.ts`: added `search` filter (ILIKE on comment, %/_ escaped).
- `components/transactions/TransactionForm.tsx` — shared form for add/edit (date, type, account, category, amount, note). Currency derives from chosen account.
- `components/transactions/TransactionsTable.tsx` — client table with per-row Edit / Delete buttons. Edit pre-fills the form modal; Delete opens a confirm modal showing the row preview.
- `components/transactions/Filters.tsx` — URL-driven (search / type / account / category). Updates `?…` params; server re-renders.
- `app/(app)/transactions/page.tsx` — PageHeader → Filters → Table. Up to 100 most-recent rows that match.

**Skipped (deferred to Chunk 6.1):**
- Sortable columns
- Inline edit (click cell → edit-in-place)
- Bulk-action bar (checkboxes → recategorize / change account / delete-many)

**Stop signal hit:** add / edit / delete round-trip through Supabase via server actions; URL filters survive reloads; pages rerender on mutation via `revalidatePath`.

**Next:** Chunk 6.1 (sortable columns + bulk actions) OR Chunk 7 (Accounts page) — your call.

**Open questions:** none.

---

## Chunk 6.1 — sortable columns + bulk actions + inline edit (2026-05-02)

**Done:**

Sortable columns
- `lib/data/transactions.ts` accepts `sortBy` (`date | amount | type | category | comment`) + `sortDir` (`asc | desc`). Falls back to `date desc` then `created_at desc`.
- `components/transactions/SortableHeader.tsx` — clickable Th, syncs to `?sort=…&dir=…` URL params, shows ▲/▼/↕ glyph for state.
- Page reads + validates `sort`/`dir` from `searchParams`.

Inline edit
- `components/transactions/EditableCell.tsx` — generic over `text | number | date | select` variants. Click → edit; Enter or blur saves; ESC cancels; selects save on change. Failed saves bounce back to original.
- `TransactionsTable` columns wired: date, description (comment), category (with existing-cats select), type, account, amount. EUR column stays computed/read-only.

Bulk actions
- `components/transactions/BulkActionBar.tsx` — fixed-bottom pill that appears when `selectedIds.size > 0`. Shows count + EUR net of selected + Clear + Delete.
- Selection state lives in the table (Set<string>); checkbox column with select-all (with indeterminate state) on the head row.
- New server action `bulkDeleteTransactionsAction(ids[])`.
- Bulk recategorize / change-account: server action `bulkUpdateTransactionsAction` is in place but no UI yet — ships when categories/accounts pages land (Chunks 7–8).

**Stop signal hit:** sort by any of 5 columns works (URL-persistent); each row is editable cell-by-cell; selecting rows shows the floating bar; bulk-delete works end-to-end.

### Chunk 6.2 — transactions polish (2026-05-02)

User feedback: italic on stat lines, missing month + subcategory filters, weak selected-row contrast, EUR column unclear, 100-row cap.

- `PageHeader` got a new `meta` prop (plain non-italic 13 px caption); italic `tagline` reserved for the brand moment on `/dashboard`. Updated `/transactions`, `/accounts`, `/categories` to use `meta`.
- New filters: **Month** (built from a server-side distinct query, `listMonthsWithTransactions`) and **Subcategory** (built from `listSubcategoriesForBudget`; auto-narrows when a Category is selected).
- `listTransactions` accepts `month` (translated to a date range) and `subcategory`.
- 100-row cap removed — page renders all matching rows.
- `EUR` column renamed to `Net €`.
- Selected rows: solid `bg-accent-soft` + `3px brass left border` + inset accent ring + `transition-all 150ms`. Was a `/40` tint, hard to see.

---

## Chunk 7 — Accounts page (2026-05-02)

**Done:**

CRUD
- `app/actions/accounts.ts` — `createAccountAction`, `updateAccountAction`, `deleteAccountAction` (with friendlier error message on FK violation when txs still reference an account).
- `components/accounts/AccountForm.tsx` — name, currency (EUR/USD), opening balance.
- `components/accounts/AccountsTable.tsx` — table + add/edit/delete modals.

Charts
- `components/charts/Donut.tsx` — generic `Donut` with explicit per-slice colors. `CategoryDonut` becomes a thin wrapper applying `categoryColor()` to slice names.
- `components/charts/AccountsTrajectory.tsx` — multi-line per-account balance over the last 12 months in EUR; brass dot at the latest point per line; native `<title>` tooltip.
- Color per account derived from `categoryColor('acct:' + accountId)` so each account always renders in the same swatch across the page.

Data helpers
- `lib/balance.ts` extended with `accountsCurrentEUR(accounts, transactions, fxRate)` and `accountsTrajectoryEUR(...)` returning `TrajectoryPoint[]` (each point is `{date, label, balances: Record<accountId, eur>}`).

Page
- Trajectory card (1.6fr) + Distribution donut (1fr) row at the top.
- Per-account legend strip under the trajectory chart (color dot + name + current EUR).
- Full accounts table at the bottom with current EUR column, edit/delete actions per row.
- Header `meta` shows count + total current EUR.

Notes
- Tiebreaker `order('name')` added to `listAccounts` so duplicate `sort_order` doesn't randomize ordering across reloads.

**Skipped:**
- Month-by-account matrix (legacy view) — the trajectory chart covers the same story more compactly. Add later if requested.
- Reordering / drag-handle for `sort_order` — out of scope; users can edit it numerically if exposed.

### Chunk 7.1 — server/client serialisation fix (2026-05-03)

Vercel deploy failed with "Functions cannot be passed directly to Client Components". The accounts page was handing `colorFor: (id) => hex` and a `Map` straight to `<AccountsTable>` (`'use client'`).

- Server side: precompute `colors: Record<accountId, hex>` once.
- `currentEUR` converted from `Map` to `Record<string, number>`.
- `AccountsTable` and `AccountsTrajectory` accept the plain Records.

---

## Chunk 8 — Categories page (2026-05-03)

**Done:**

CRUD
- `app/actions/categories.ts` — `createCategoryAction`, `renameCategoryAction` (cascades to `transactions.category` since it's a free-text column), `deleteCategoryAction`, `reassignCategoryAction`, plus subcategory variants. Subcategory rename also cascades to `transactions.subcategory` scoped to the parent category name.
- `components/categories/NameForm.tsx` — single-field modal form for create + rename.
- `components/categories/CategoriesPanel.tsx` — full per-kind list with all CRUD modals; expandable subcategory rows with their own Add / Edit / Delete actions.

Data helpers
- `lib/balance.ts` extended with `categoryTotalsByKindEUR()` returning `{perCategory, perSubcategory}` filtered by tx type and an optional date range.

Page
- Two side-by-side `CategoriesPanel` cards: Expense (with rust totals) + Income (with sage totals).
- Each row shows: color dot · name · this-month total · YTD total · Edit/Delete; click to expand subcategories with YTD spend each.
- Header `meta` shows total expense + income for the current month.

**Skipped:**
- Category drill-down modal (tinted header, monthly trend chart, recent tx) — its own chunk (8.1) since it's substantial and reuses logic that lands cleanly later.
- Auto-color editor — deferred per plan §4.

**Next:** Chunk 8.1 (drill-down modal) OR Chunk 9 (Forecast) — your call.

**Open questions:** none.

---

## Chunk 9 — Forecast page (2026-05-03)

**Done:**

Data helpers (`lib/balance.ts`)
- `ytdAverages()` — months elapsed/remaining, avg + total income/expense/net, EOY projections, savings rate. Mirrors legacy `forecastSpend()` (line 1211): project remaining months at the YTD average pace.
- `forecastYear()` — 12-bucket array; past months are real `monthTotalsEUR`, future months get the YTD average filled in. Each bucket flagged `projected: boolean`.
- `burnRatesEUR()` — per-category `{thisMonth, avgMonthly, projectedYearTotal, monthsActive}` for a given kind (expense or income), sorted by projected EOY desc.

Charts
- `components/charts/ForecastBars.tsx` — 12-month paired bars. Solid for past months, hatched (45° SVG `<pattern>`) at 0.75 opacity for projected months. Vertical brass dashed separator marks the actual→projected boundary.

Forecast UI
- `components/forecast/BurnRateTable.tsx` — table card with header `projected EOY` total + columns: category · avg/mo · this mo · proj EOY · active (months/total).
- `app/(app)/forecast/page.tsx`:
  - Hero: 56 px projected EOY balance + delta vs today + avg net/mo
  - KPI strip: Avg income · Avg spend · Projected savings rate
  - Forecast bars chart inside a card with year-summary footer (YTD totals + projected totals for income / spend / net)
  - Two BurnRateTable cards: Expense (rust totals) + Income (sage totals, only if there's any data)

**Skipped:**
- Category drill-down modal (still pending; Chunk 8.1 if requested)

**Next:** Chunk 10 — XLSX import.

**Open questions:** none.

---

## Chunk 10 — XLSX import (2026-05-03)

**Done:**

Parser (TS port of legacy `parseXlsxRaw`)
- `lib/xlsx/dates.ts` — `excelSerialToDate`, `normaliseDate` (TZ-safe, anchors at local midnight per CLAUDE.md §8b), `detectCurrency`.
- `lib/xlsx/classify.ts` — pure `classifyExpenseRow` + `classifyIncomeRow`. Embeds the regression rule from CLAUDE.md §8a: rows with category/type label `Account adjustment` become `type: 'adjustment'`, expense-block adjustments stored as negative amounts, income-block as positive.
- `lib/xlsx/parse.ts` — full sheet walker. Reads `Accounts Balance` for openings, then walks each month sheet (`January`–`December`), emitting classified rows. Income rows anchored at the 28th of the month (legacy behaviour — sheet has no per-row income date).
- Cell access via `XLSX.utils.encode_cell` rather than `sheet_to_json{header:1}` — the latter silently drops blank-leading-row cases (CLAUDE.md §8d).

FX cache
- `lib/fx.ts` — Frankfurter client with in-memory cache + chunked fetch (10 dates per batch). Mirrors legacy `_fxCache` / `fetchHistoricalFxRate`.
- Server-side only — runs inside the import action, so the browser never hits Frankfurter directly (which means CSP `connect-src` doesn't need to allow it for client fetches).

Server action
- `app/actions/import.ts` — `importXlsxAction(FormData)`:
  1. Auth check + active budget lookup.
  2. Parse the .xlsx via `parseXlsx`.
  3. Upsert accounts by name within the budget (reuse if name matches).
  4. Upsert categories per kind, plus subcategories per category.
  5. Preflight historical FX rates for every USD tx date.
  6. Bulk-insert transactions in batches of 250 (`fx_rate` populated for USD txs from the rate map; falls back to null → live budget rate at display time).
  7. Returns a typed `ImportSummary` with counts + warnings.
- File size capped at 25 MB.

UI
- `components/import/ImportDropzone.tsx` — drag-drop + browse fallback, year picker (for income-row anchoring), pending state, success card with all the counts (transactions / accounts / categories / FX fetched / dropped) and warnings.
- `app/(app)/import/page.tsx` — split layout: dropzone card + "How it works" explainer.
- Sidebar gets a new "Tools" group with `Import XLSX`.
- Transactions page action button links here.

Tests
- `test/lib/xlsx/classify.test.ts` — 11 cases covering the §8a regression both ways (expense/income block) plus the non-adjustment paths.

Dependencies
- `xlsx` (SheetJS) added via the official CDN tarball — npm-registry version is far behind.

**Skipped:**
- Re-import dedup heuristic — re-running the import currently just appends new transaction rows. The legacy app behaved the same way. A "skip rows that already match (date+amount+account+description)" mode is a future refinement.

**Stop signal hit:** can re-run the original Google-Sheets import end-to-end against a fresh user. Account-adjustment classification covered by mandatory unit tests.

---

## Chunk 11 — cutover readiness (2026-05-03)

Per the user's earlier scope decision, "cutover" is **soft** — the legacy
app keeps running at `/legacy` post-merge. This chunk is just the final
polish to make the rehaul branch PR-ready against `master`.

**Done:**

Versioning
- `lib/version.ts` — `BUILD_VERSION` (`v2.0.0-α`), `BUILD_DATE`, `BUILD_NOTE`.
- Sidebar bottom now shows the version + date below the user card. Same purpose as the legacy `index.html`'s bottom-right marker (CLAUDE.md §9): visual confirmation a deploy is live.
- `package.json` → `2.0.0-alpha.1`.

Docs
- `docs/security-review.md` — full pre-merge security checklist (headers, RLS, secrets, input validation, XSS posture, dependencies, merge checklist for the user to tick off).
- `docs/claude-md-proposal.md` — proposed rewrite of CLAUDE.md sections that went stale (§3, §5, §6, §7, §9, §12). **Not applied** — the user must approve before I touch the live `CLAUDE.md`.

**Skipped (intentionally):**
- Hard cutover — legacy app stays at `/legacy` indefinitely per the user's earlier "side-by-side" decision in §10 of the plan.
- CSP tightening — kept permissive while `/legacy` lives. Will be tightened once legacy is retired.
- `npm audit` and Lighthouse — can't run from this environment; both are checklist items for the user before merging.

**The branch is now PR-ready.**

The user's pre-merge checklist (also in `docs/security-review.md`):
- [ ] `npm audit` clean locally
- [ ] Lighthouse a11y ≥ 95 on `/login` and `/dashboard`
- [ ] CSP header confirmed in browser dev tools
- [ ] `/legacy` still loads and works
- [ ] New app round-trips (sign in → import → hero balance matches)
- [ ] Decide on `docs/claude-md-proposal.md` (apply or defer)
- [ ] Merge `experimental/theus-rehaul` → `master`

**Next (post-merge, your call):** Chunk 12 (multi-budget UI) and Chunk 13 (invites + server hardening) are the remaining in-scope items from the plan.

**Open questions:** none.

---

## Chunk 12 — multi-budget UI (2026-05-03)

User decision: keep branches side-by-side indefinitely, no merge yet.
CLAUDE.md update applied — live `CLAUDE.md` now reflects the new
architecture (the doc proposal in `docs/claude-md-proposal.md` was the
draft for this).

**Done:**

Active-budget cookie
- `lib/data/budgets.ts` — `getOrCreateUserBudget()` resolution: cookie
  hit (if budget still readable under RLS) → first listed → bootstrap a
  default. Cookie `theus.active-budget`, 1-year max-age.
- `listBudgets()` exposed for the layout.

Server actions (`app/actions/budgets.ts`)
- `createBudgetAction({name, base_currency})` — auto-switches to the
  new budget by writing the cookie before bumping cache.
- `renameBudgetAction({id, name})`.
- `deleteBudgetAction(id)` — refuses to delete the user's only budget;
  clears the cookie if the deleted one was active. Cascades via FK.
- `setActiveBudgetAction(id)` — RLS-checks membership before setting
  the cookie.

UI
- `components/nav/BudgetSwitcher.tsx` — sidebar dropdown:
  · current budget label (mono `BUDGET` kicker + name + currency)
  · click-outside dismiss + ESC close
  · list of budgets, click to switch (active state in brass)
  · `+ New budget` opens a Create modal (name + base currency)
  · `Manage budgets…` opens a list modal with rename + delete per row
  · Delete requires typing the budget name — guards against accidental
    cascade deletion of all data
- `UserCard` simplified to user identity only — budget info moved into
  the switcher above.
- `(app)` layout fetches budgets list once and passes the active id +
  the full list to the sidebar.

**Stop signal hit:** can create a 2nd budget, switch between them, data
is correctly scoped — every page calls `getOrCreateUserBudget()` which
respects the active-budget cookie.

**Next:** Chunk 13 — member invitations + tightened server hardening.

**Open questions:** none.

---

## Chunk 13 — invitations + member management (2026-05-03)

**Done:**

Data layer (`lib/data/members.ts`)
- `listBudgetMembers(budgetId)` — current members.
- `listBudgetInvites(budgetId)` — pending invites (newest first).
- `getBudgetOwnerId(budgetId)` — used to gate owner-only controls in the UI.

Server actions (`app/actions/members.ts`)
- `inviteMemberAction({budget_id, email})`:
  - validates email format
  - rate-limits (in-memory sliding window: 10 invites / 60s per signed-in user; documented as a stub with a pointer to Upstash for production rigor)
  - refuses self-invite
  - de-dups against existing pending invites
- `cancelInviteAction(id)`.
- `revokeMemberAction({budget_id, user_id})` — refuses to remove the budget owner.

UI
- `components/members/MembersPanel.tsx`:
  - Owner-only invite-by-email card with inline validation + status messages.
  - Members card showing user_id (truncated) + role badge + "you" indicator + Revoke action.
  - Pending invites card with email + sent-date + Cancel action.
  - Confirm modals for both Revoke and Cancel.
- `app/(app)/members/page.tsx` — server fetches all four data sources in parallel.
- Sidebar: new `Members` entry under Tools (alongside Import XLSX).

Schema note
- The publishable key intentionally can't read `auth.users` from the
  client (avoids a user-enumeration vector), so member rows show
  truncated user_id rather than emails. `docs/optional-migrations.sql`
  ships an RPC (`get_budget_member_emails`) that exposes emails ONLY
  for users already sharing a budget with the caller; apply it via
  Supabase SQL Editor when you're ready and I can wire the UI to use
  it. Not required for Chunk 13 to be complete.

Existing-user invite caveat
- The `trg_accept_pending_invites` Supabase trigger fires on
  `auth.users` INSERT — it auto-promotes pending invites the moment a
  matching email signs up. For users who **already** have an account,
  the trigger doesn't fire. The MembersPanel notes this on screen and
  suggests they sign up with the invited email (no separate
  accept-invite flow yet — add later if needed).

CSP / hardening
- CSP unchanged this chunk; see `docs/security-review.md` for the trade-off (legacy bundle still needs `unsafe-inline`/`unsafe-eval` for its CDN scripts). Tightening will pair cleanly with retiring `/legacy`.

**Stop signal hit:** owner can invite a second email, the invite shows up under Pending, the trigger auto-accepts on signup, and the new member sees the budget in their switcher.

**Open questions:** none. Rehaul plan §4 in-scope items are now all shipped.

---

## Chunk 12 — Sterling foundations (2026-05-04)

**Heads-up:** This chunk lays the visual foundation only. **Pages will
look broken** until subsequent chunks migrate them. Work split across
three sessions on branch `experimental/theus-sterling-1to1`.

### Session A — tokens, fonts, icons, primitives

Tokens (`styles/tokens.css`)
- Swapped Theus forest-green palette for Sterling navy (source of truth:
  `design-refs/src/tokens.jsx` dark variant).
- New tokens: `--bg-elev`, `--surface-hi`, `--line-strong`, `--accent-hi`,
  `--ink-faint`, `--warn`, `--chip`, `--chip-hi`.
- Sterling-vocabulary aliases: `--surface` (= `--bg-panel`), `--line`
  (= `--rule`), `--bg-subtle` (= `--bg-soft`).

Tailwind (`tailwind.config.ts`)
- Wired all new color tokens (`surface`, `surface-hi`, `bg-elev`,
  `bg-subtle`, `line`, `line-strong`, `accent-hi`, `ink-faint`, `warn`,
  `chip`, `chip-hi`).
- Added `mono` font family.
- Bumped `mono-label` letter-spacing 0.14em → 0.18em (Sterling spec).

Fonts (`app/layout.tsx`)
- Restored JetBrains Mono via `next/font/google` (weights 400/500/600),
  exposed as `--font-mono`. The Theus-era "drop JBM" decision is
  reversed for Sterling 1:1.

Components
- `components/ui/Icon.tsx` (NEW) — full icon set ported from
  `design-refs/src/icons.jsx` with `currentColor` default so Tailwind
  `text-*` utilities work.
- `components/ui/Mono.tsx` — switched to `font-mono` and tracking 0.18em.
- `components/ui/Card.tsx` — `bg-surface border-line`.
- `components/ui/Button.tsx` — Sterling spec: primary 14/8 padding,
  13px text, white-on-accent; ghost on surface w/ line; new `icon`
  size variant.
- `components/ui/Pill.tsx` — added orthogonal `shape` prop
  (`kbd` / `badge` / `chip`); existing color `variant` API preserved
  so callers don't break.
- `components/ui/index.ts` — exports `Icon` + `IconName` type.

### Session B — layout chrome

- `components/ui/PeriodToggle.tsx` (NEW) — segmented pill group, default
  Week/Month/Quarter/YTD/All; visually 1:1 with `dashboard.jsx` 117-121.
- `components/ui/KpiTile.tsx` — surface bg, optional `hero` radial
  gradient overlay, optional Icon-prefixed delta indicator.
- `components/nav/Topbar.tsx` (NEW) — search input visual w/ ⌘K hint,
  FX rate chip with green dot, bell button, "+ New" primary; visually
  1:1 with `dashboard.jsx` 52-68. Search and bell are non-functional
  placeholders. The "+ New" button takes an optional `onNewTransaction`
  prop; wiring is deferred.
- `app/(app)/layout.tsx` — Topbar slotted above main content, fed
  `fx_rate` and `base_currency` from the active budget.
- `components/nav/NavItem.tsx` — added `icon` prop, Sterling active
  state (surface bg + line border + accent-colored icon).
- `components/nav/Sidebar.tsx` — per-item icons for both Manage and
  Tools sections, new Coach entry with "New" badge.
- `components/nav/UserCard.tsx` — 32×32 gradient avatar
  (`accent`→`accent-hi`), Inter 12/600 name, JBM 10/inkMute subtitle
  (`{currency} · primary`), settings icon button.
- `app/(app)/coach/page.tsx` (NEW) — "Coach — coming soon" stub card.
- `components/ui/index.ts` — exports `PeriodToggle`.

### Session C — verification + docs

- Recomputed Sterling contrast ratios (see `docs/contrast-report.md`).
  All foreground/background pairs pass AA against `--bg`, `--bg-soft`,
  and `--bg-panel` **except** `--ink-faint` (#4A5476, 2.65:1) which is
  intentionally decorative-only — used for the ⌘K kbd hint and similar
  non-essential glyphs. Earlier Theus adjustments to `--ink-mute`,
  `--neg`, `--accent` no longer apply; Sterling source values are now
  the authority.
- Swept `text-ink-faint` usage: only the Topbar ⌘K hint uses it,
  consistent with its decorative-only purpose.

### What still looks broken (deferred to future chunks)

- All page-level components (`app/(app)/dashboard`, `transactions`,
  `accounts`, `categories`, `forecast`, `import`, `members`,
  `styleguide`) still use the old layout, copy, and palette
  assumptions — they render but are visually inconsistent with
  Sterling.
- The `+ New` button is wired through but does nothing yet — global
  transaction-create wiring lands in a later chunk.
- Search and bell are placeholder visuals.

**Stop signal hit:** layout chrome (sidebar + topbar + identity card
+ coach stub) renders 1:1 with `design-refs/src/dashboard.jsx`. Token
swap completed without page-level edits. Foundations ready for
page-by-page migration in subsequent chunks.

**Open questions:** none.

---

## Chunk 13 — Dashboard Sterling 1:1

Rebuilt `app/(app)/dashboard/page.tsx` to match
`design-refs/src/dashboard.jsx` (lines 76–301) section-for-section.

### Sections

1. **Greeting + insight + period toggle**
   (`components/dashboard/Greeting.tsx`,
   `components/dashboard/PeriodToggleClient.tsx`).
   JBM kicker `{Month YYYY · WK NN}` (ISO week), Inter 28/600 -0.02em
   greeting `Good {morning|afternoon|evening}, {name}.`, subline with
   the month spend as a JBM bold ink number and `{X}% under/over your
   average` colored pos/neg. Period toggle is a client component that
   writes to `?period=` for deep-linking; default `Month`.
2. **Hero KPI grid** (`HeroBalanceTile`, `MonthKpiTile`). Three columns
   `1.4fr / 1fr / 1fr`. Hero has the brass radial accent gradient,
   Inter 56/600 tabular total with separate cents, JBM delta
   `+€X (Y%)` colored pos/neg, and a 12-month sparkline driven by
   `accountsTrajectoryEUR` summed across accounts. Income / Spending
   tiles get a colored dot, big tabular number with split cents, JBM
   `±X.X%` delta colored by what's "good" (income up = pos, spending
   down = pos), and a colored 12-month sparkline.
3. **Cashflow + Spending mix row** (`1.5fr / 1fr`). `IncomeSpendBars`
   now fed 12 months of `lastNMonthsTotals`. `CategoryDonut` extended
   with optional `centerLabel` / `centerSublabel` (e.g. `€2.4k` /
   `total`).
4. **Accounts + Recent activity row** (`1fr / 1.3fr`,
   `components/dashboard/AccountsList.tsx`,
   `components/dashboard/RecentActivityList.tsx`). Accounts: tinted
   initial tile, native amount in JBM, share-of-total in JBM mute.
   Activity: day-grouped (`Today` / `Yesterday` / `27 Apr`) rows with
   `${color}1F` icon tile from `categoryColor()` + `categoryIcon()`,
   merchant + `category · account` subline, and a signed JBM amount
   colored pos for inflows, ink for outflows (neg color reserved for
   "alarming").

### New / changed files

- `components/charts/Sparkline.tsx` — added `color` and `fillFrom`
  props (default still brass; auth `BrandPanel` call unchanged).
- `components/charts/CategoryDonut.tsx` — added `centerLabel` /
  `centerSublabel` (centered total inside the donut).
- `components/dashboard/Greeting.tsx`,
  `PeriodToggleClient.tsx`, `HeroBalanceTile.tsx`,
  `MonthKpiTile.tsx`, `AccountsList.tsx`,
  `RecentActivityList.tsx` — new section components.
- `lib/dashboard/categoryIcon.ts` — name → `IconName` mapping (housing
  → home-icon, groceries → food, salary → briefcase, etc.; falls back
  to `tag`).
- `lib/dashboard/period.ts` — `Period` union, `parsePeriod`, ISO-week
  computation, time-of-day greeting helper, `monthLong`.
- `app/(app)/dashboard/page.tsx` — rebuilt; reads `?period=` (Next 15
  `Promise<searchParams>`), pulls user metadata via
  `supabase.auth.getUser()` for the greeting name (falls back to the
  email local-part, then `there`).

### Couldn't match exactly (and why)

- **Coach insight bar** (ref lines 181–197) — skipped per
  `CLAUDE.md §7` ("Coach view" out of scope). Will land with the
  Coach feature.
- **Period toggle scope** — only the *URL state* and the section
  *labels* (`Income · April`) are wired. Numerical re-scoping
  (week/quarter/YTD/all) for KPIs and charts stays month-based for
  this chunk; full re-scoping is a follow-up. Confirmed with user
  before implementing.
- **`+€X (Y%) vs last month` hero delta** — Sterling shows hardcoded
  `+€1,410 (4.7%)`. Ours is computed from `accountsTrajectoryEUR`
  (sum across accounts at each month-end). The shape matches.
- **Account row subtitle** — Sterling shows literal copy like
  `Daily · €` per account. Ours is computed from currency
  (`EUR · primary` / `USD · foreign`); we don't store a per-account
  blurb. Worth adding later if the user wants it.
- **Greeting time-of-day** — uses `Date#getHours()` in server time.
  Flagged for a future user-specific timezone fix.

### Verification

- TypeScript / lint / build **not run** in this session — Node isn't
  available on the worktree machine. User to run
  `npm run typecheck && npm run lint && npm run build` locally.
  Code was reviewed manually against the types it consumes
  (Next 15 `Promise<searchParams>`, `noUncheckedIndexedAccess`
  guards, `IconName` literals, `categoryColor` hex outputs).

**Open questions:** none.

---

## Chunk 14 — Transactions Sterling 1:1

Rebuilt the transactions page to match
`design-refs/src/transactions.jsx` lines 3–115. First of four
page-by-page rebuilds.

### Sections

1. **Page header** — kicker `Ledger`, title `Transactions`, meta
   `{N} entries · {Month YYYY}` (or `· all time` when no month
   filter). Right-side actions: outlined `Import` link + brass
   `+ Add transaction` button.
2. **Stat strip** (`components/transactions/StatStrip.tsx`) — 4-tile
   In / Out / Net / Avg-per-day strip computed from the filtered
   transaction set in EUR. Sterling 1-px-grid pattern via `gap-px` on
   a `bg-rule` track. In tinted pos, Out tinted neg, Net pos/neg by
   sign, Avg ink. JBM 22/600 numbers with mono kicker labels.
3. **Filter row** (`components/transactions/Filters.tsx`) — full
   rewrite to a single horizontal pill row:
   - 4 type pills (`All / Expenses / Income / Adjustments`) with
     active-inverted state writing `?type=`.
   - Vertical 1-px divider.
   - 3 dropdown pills (Account / Category / Month). Cascading
     subcategory pill appears only when a category is selected and
     auto-clears on category change.
   - Right cluster: collapsible search pill (icon-only when empty,
     expands inline on click), sort pill (Date · newest by default —
     URL stays clean), and a small ghost `Clear` link when any
     filter is set.
   - Pill dropdowns use the `<PillSelect>` pattern: a styled
     `FilterPill` rendered statically with a transparent native
     `<select>` overlaid for free OS popover + keyboard handling.
4. **Day-grouped list** (`components/transactions/DayGroupedList.tsx`)
   replaces the old `<table>`. Each day group has a header strip
   (`Today · 29 Apr`-style mono label + JBM signed total) and rows.
   Row layout is a 5-col grid: icon-tile / merchant-and-sub /
   category-chip / account-mono / amount.
5. **Selection without checkboxes** — the leading 36×36 tinted icon
   tile doubles as the select target (Gmail / Linear pattern). Click
   it to toggle; on hover it cross-fades to a check. Selected rows
   get an `accent-soft` background, a 3-px brass left strip, and the
   tile flips to a solid brass tile with check. When any row is
   selected, all tiles show a low-opacity check so multi-select is
   discoverable. Click anywhere else on a row → opens the edit
   modal.
6. **Currency display** — primary line shows native amount in the
   account's currency (sign-tinted, JBM); for non-EUR rows, a
   second muted line below shows `≈ ±€{eur}` so the budget-currency
   comparison stays one glance away. EUR rows render one line. The
   ref's `(× 0.854)` rate column was dropped — the EUR equivalent is
   more useful than the raw rate.
7. **Edit modal** reuses `TransactionForm` with prefilled defaults;
   includes a `Delete this transaction` ghost link below the form
   that hands off to the existing delete-confirm modal. Bulk-delete
   via the floating `BulkActionBar` (unchanged).

### New / changed files

- `components/ui/FilterPill.tsx` — Sterling pill button with
  `active` / `icon` / `trailingIcon` variants. Token-only.
- `components/ui/index.ts` — exports `FilterPill`.
- `lib/transactions/grouping.ts` — `groupTransactionsByDate()` with
  `Today · DD MMM` / `Yesterday · DD MMM` / `DD MMM` labels and a
  signed-EUR day total.
- `components/transactions/StatStrip.tsx` — new.
- `components/transactions/DayGroupedList.tsx` — new.
- `components/transactions/AddTransactionButton.tsx` — new client
  trigger that fires a `transactions:add` window event the
  `TransactionsTable` listens for. Lets the server-rendered page
  header own the brass Add button without state plumbing.
- `components/transactions/Filters.tsx` — full rewrite (pill row,
  cascading subcategory, inline `PillSelect`).
- `components/transactions/TransactionsTable.tsx` — orchestrator
  only: owns mode (idle / add / edit / delete / bulkDelete),
  selection set, modals. No more `<table>`, no more inline-cell
  edit, no more sortable header columns.
- `app/(app)/transactions/page.tsx` — new header copy + actions,
  StatStrip insertion, dropped the inline `+ Add` from below the
  filter row.
- **Deleted:** `components/transactions/SortableHeader.tsx` (sort
  moved to the pill row), `components/transactions/EditableCell.tsx`
  (replaced by modal edit).

### Couldn't match exactly (and why)

- **Per-column sort headers** — the ref doesn't have any (it's a
  list, not a table). All sorting now lives in the single sort pill
  on the right of the filter row. The data layer's
  `sort=…&dir=…` query support is preserved; only the UI affordance
  changed.
- **Export button** — ref shows it next to Import; we have no
  export server action and the user asked to omit. Skipped this
  chunk; revisit if/when an export action is built.
- **Native popover styling** — `<PillSelect>` overlays a transparent
  native `<select>` over a styled FilterPill. The trigger looks
  Sterling but the dropdown panel itself is OS-native. A fully
  custom popover (token-styled menu, keyboard arrows, search-in-
  menu) is a separate primitive worth building once and reusing
  for accounts / categories filters too — deferred.
- **Bulk edit** — only bulk-delete is wired. Bulk-edit needs a
  separate field-picker UX; explicitly deferred per user.

### Verification

- TypeScript / lint / build **not run** in this session — Node
  isn't available on the worktree machine. User runs the build via
  Vercel preview deploy. Code reviewed manually against the types
  it consumes (`TxInput`, `Transaction`, `Account`, Next 15
  `Promise<searchParams>`, `noUncheckedIndexedAccess` guards,
  `IconName` literals).

**Open questions:** none. Awaiting user confirmation before
starting Chunk 15 (Accounts).

---

## Chunk 15 — Accounts Sterling 1:1

Rebuilt the accounts page to match
`design-refs/src/transactions.jsx const Accounts` (lines 118-204).
Second of four page-by-page rebuilds.

### Sections

1. **Net-worth hero** (`components/accounts/AccountsHero.tsx`) —
   replaces the standard `PageHeader`. Mono kicker `Net worth`,
   44/600 tabular total with mute cents, MTD delta in JBM mono with
   arrow icon and pos/neg color, brass `Add account` button on the
   right (window-event trigger like Transactions).
2. **Distribution bar**
   (`components/accounts/AccountsDistributionBar.tsx`) — replaces
   the Donut. 10-px stacked horizontal bar (segments `flex` by EUR
   balance, 2-px gaps so each swatch reads distinct), legend below
   with name + percentage. Negative balances clamp to 0 width but
   still appear in the legend.
3. **Account card grid** (`components/accounts/AccountCard.tsx`) —
   replaces the HTML table. 2-col grid of cards. Each card: 3-px
   top color strip, 40×40 tinted icon tile (briefcase for
   payroll-named accounts, wallet otherwise) + name + sub-line
   (`{CCY} · {first-word}`), chevron-right glyph, big native amount
   (30/600), `≈ €{eur}` mute mono line for non-EUR accounts, MTD
   delta in JBM with arrow + color, and a per-account 6-month mini
   chart on the right.
4. **AccountMiniChart** (`components/accounts/AccountMiniChart.tsx`)
   — upgraded sparkline with axes per user request: faint baseline
   + dashed top tick, mono `{max}` and `{min}` labels at the right
   edge in compact form, three x-axis month labels (first / mid /
   last) at the bottom. 220×70 by default, single-color area fill
   from the account swatch.
5. **Add card** — dashed-border placeholder card at the end of the
   grid; click → opens the same add modal. Matches ref's `Connect
   or add manually` block, copy adapted (`Bank, brokerage, cash,
   USD payroll`).

### New / changed files

- `lib/accounts/summary.ts` — `accountsSummary()` returns
  `AccountSummary[]` with native + EUR current, native + EUR MTD
  delta, and a 6-point sparkline series. Built on top of
  `accountBalanceNativeAt` / `accountBalanceEURAt`.
- `components/accounts/AccountsHero.tsx` — new.
- `components/accounts/AccountsDistributionBar.tsx` — new.
- `components/accounts/AccountMiniChart.tsx` — new.
- `components/accounts/AccountCard.tsx` — new (`AccountCard` +
  `AddAccountCard`).
- `components/accounts/AddAccountButton.tsx` — new client trigger
  using window event `accounts:add`.
- `components/accounts/AccountsGrid.tsx` — replaces
  `AccountsTable.tsx`. Orchestrator-only: owns mode (idle / add /
  edit / delete), modals, listens for `accounts:add`. Click
  anywhere on a card → edit modal. Edit modal has a `Delete this
  account` ghost link below the form (same pattern as the
  Transactions edit modal).
- `app/(app)/accounts/page.tsx` — rewrote to render Hero +
  DistributionBar + AccountsGrid. Dropped trajectory chart and
  donut card.
- **Deleted:** `components/accounts/AccountsTable.tsx` (replaced),
  `components/charts/AccountsTrajectory.tsx` (no remaining usages).

### Couldn't match exactly (and why)

- **Bulk select** — explicitly skipped per user (accounts are too
  few for bulk operations to be useful).
- **Per-account sub-line copy** — ref shows literal copy per
  account (e.g. `Daily spending`); we don't store that. Ours is
  computed from currency + name first-word. Worth adding a
  per-account `description` column later if desired.
- **Sparkline length** — user picked 6 month-end points (vs ref's
  6, vs the 12 we previously used on the trajectory chart). Axes
  added per user request to make the small chart self-describing.
- **Color picker** — out-of-scope; account swatch is still the
  hash-stable `categoryColor("acct:${id}")`.

### Verification

- TypeScript / lint / build **not run** in this session — Node
  isn't available on the worktree machine. User runs the build via
  Vercel preview deploy. Code reviewed manually against existing
  `accountBalanceNativeAt` / `accountBalanceEURAt` helpers and the
  `Account` / `Transaction` row types.

**Open questions:** none. Awaiting user confirmation before
starting Chunk 16 (Categories).

---

## Chunk 16 — Categories Sterling 1:1

Rebuilt the categories page to match
`design-refs/src/categories.jsx`. Third of four page-by-page
rebuilds. Followed **Option B** per user choice — the ref's spend-vs-
budget UX without adding a `monthly_budget` schema column. "Budget"
is the **YTD monthly average** (proxy); insight line reads
`This month is N% above your YTD average.`

### Sections

1. **Page header** — kicker `Where it goes`, title `Categories`,
   meta `{Month YYYY} · N categories tracked`, brass `New category`
   button on the right (window-event trigger, dispatches an
   expense-add by default).
2. **Summary card** (`components/categories/CategoriesSummaryCard.tsx`)
   — donut on the left (180 px, 24 px stroke, segments by this-
   month spend, center label `€{compact}` of avg), 3-up KPI strip
   on the right (`Spent / YTD avg / Remaining` with pos/neg tone on
   Remaining), segmented `flex` progress bar below, insight line:
   `This month is +N% above your YTD average. K categories are
   running over: Cat A, Cat B`.
3. **Category list** — single rounded card with mono uppercase
   header strip and 6-col grid rows
   (`components/categories/CategoryRow.tsx`):
   icon-tile / name + `subs · txCount this month` / spent vs avg
   with `% of avg (+N%)` / progress bar (red when over, with a 2px
   neg cap at the right edge for >100%) / avg-per-month / chevron.
   Click anywhere on a row → drill-down modal.
4. **Drill-down modal**
   (`components/categories/CategoryDetailModal.tsx`) — header strip
   with the category icon + tinted tile, this-month total + YTD
   avg/mo. Subcategories list shows per-sub this-month + YTD totals
   with inline Rename / Delete. Footer has `Rename` /
   `Delete category` actions. Nested modals for rename / delete /
   add-sub flows (Radix Dialog supports nesting).
5. **Income recap** (`components/categories/IncomeRecap.tsx`) —
   stripped row list below the expense table (no progress bars,
   since "over budget" is meaningless for income). Header shows
   panel total + `+N%` vs YTD avg (pos/neg tone matches what's
   "good" for income — above avg = pos).
6. **Add income inline link** under the recap (`+ New income
   category`). The header's primary `New category` button always
   creates an expense category, since that's the dominant flow.

### New / changed files

- `lib/categories/summary.ts` — `categoriesSummary()` per kind
  (this-month + YTD total + YTD-avg + tx count + over flag +
  pctVsAvg) and `subcategoriesSummary()` per category.
- `components/categories/AddCategoryButton.tsx` — header trigger,
  window event `categories:add`.
- `components/categories/CategoriesSummaryCard.tsx` — donut + KPIs
  + progress + insight.
- `components/categories/CategoryRow.tsx` — 6-col grid row matching
  the ref.
- `components/categories/CategoryDetailModal.tsx` — drill-down with
  subs, rename, delete (cat & sub).
- `components/categories/IncomeRecap.tsx` — stripped income block.
- `components/categories/CategoriesClient.tsx` — orchestrator that
  owns drill-down + add-modal state, listens for window event.
- `app/(app)/categories/page.tsx` — rewrote: pre-computes all
  summaries server-side, hands plain serialisable data to the
  client.
- **Deleted:** `components/categories/CategoriesPanel.tsx`
  (replaced by the row + drill-down split).

### Couldn't match exactly (and why)

- **Per-row "Avg / month" mono number** — ref shows
  `c.spent * 0.92` (placeholder). Ours is the real
  `ytd / monthsElapsed`.
- **Income panel** — ref doesn't show one (categories.jsx is
  expense-only). Ours surfaces income as a stripped recap below
  the main table; matches Theus's two-kind data model without
  cluttering the spend-tracking visual language.
- **Per-category budget editing** — explicitly skipped in this
  chunk (Option B). When you want budgets to be a real column,
  Option A is queued: add `monthly_budget` numeric on
  `categories`, edit the form, wire it through
  `CategoriesSummaryCard` + `CategoryRow`. Estimated half-chunk.
- **Coach insight phrasing** — the "K categories running over"
  list shows up to 3 names + `+N more` overflow.

### Verification

- TypeScript / lint / build **not run** in this session — Node
  isn't available on the worktree machine. User runs the build via
  Vercel preview deploy. Code reviewed manually against the
  primitives' types and the existing
  `createCategoryAction` /
  `renameCategoryAction` / `deleteCategoryAction` /
  `createSubcategoryAction` /
  `renameSubcategoryAction` /
  `deleteSubcategoryAction` action signatures.

**Open questions:** none. Awaiting user confirmation before
starting Chunk 17 (Forecast).

---

## Chunk 17 — Forecast Sterling 1:1

Rebuilt the forecast page to match
`design-refs/src/forecast.jsx`. Fourth and final page-by-page
rebuild — all four primary views are now Sterling-aligned.

### Sections

1. **Page header** — kicker `Looking ahead`, title `Forecast`,
   meta `Projection based on N months of history`. Period chip
   toggle on the right (`3 / 6 / 12 / 24 mo`, default 3) wired to
   `?h=` URL param. Active chip inverts to `bg-bg`.
2. **Hero card** (`components/forecast/ForecastHero.tsx`) — single
   rounded card. 3-up KPI grid with vertical 1-px dividers between
   columns: `Today` (ink), `In N months` (accent), `End of year`
   (accent-hi). Each future KPI has a JBM mono delta line. Below
   the KPIs, the projection line chart, then a legend strip
   (`Actual` solid, `Projected` dashed).
3. **Projection line**
   (`components/charts/ForecastLine.tsx`) — past 12 month-end
   balances + today + projected horizon, all in EUR. Two `<path>`
   segments share the accent stroke; the projected segment is
   dashed and 0.65 opacity. Soft accent area fill under the actual
   portion. Vertical dashed marker at "today". 4 evenly-spaced
   x-axis month labels, max-balance tick on the right.
4. **Two-up below** — 1.4fr / 1fr.
   - **Per-category outlook** (`components/forecast/PerCategoryOutlook.tsx`)
     — top 5 expense categories by projected next-month spend. Each
     row: name, mono `€proj / €avg avg`, horizontal bar with a
     dashed-edge tinted "avg" slice and a solid coloured "projected"
     slice on top. Bars normalize to the largest projected.
   - **Coach insight** (`components/forecast/CoachInsightCard.tsx`)
     — gradient brass-tinted card with sparkle kicker. Static
     copy: `If you keep your savings rate of {pct}%, you'll reach
     €{milestone} by {Month YYYY} — about N months from now.`
     Milestone snaps to next 5k step (10k once balance ≥ 20k).
     Falls back to a neutral message when avgNet ≤ 0. **No `Set
     this as a goal` button** — goals infra not built; per
     CLAUDE.md §7 the coach view is out of scope.
5. **Burn-rate tables** — full-width sections below. Expense first
   (always), income second (only when there's data). Restyled to
   `bg-bg-soft` rounded card chrome with mono uppercase column
   headers. Subtitle now embeds the projection caveat ("projection
   extends YTD pace").

### New / changed files

- `lib/forecast/projection.ts` — `projectionSeries()` (past +
  today + projected at avgNet pace), `nextMilestone()` /
  `milestoneEta()` helpers for the coach insight, and a tiny
  `eomAhead()` utility.
- `components/charts/ForecastLine.tsx` — past-vs-projected SVG
  line with dashed continuation, vertical "today" marker, area
  fill under actual.
- `components/forecast/HorizonToggle.tsx` — Sterling pill-row
  segmented control writing `?h=`.
- `components/forecast/ForecastHero.tsx` — single hero card with
  3-up KPIs + chart + legend.
- `components/forecast/PerCategoryOutlook.tsx` — top-N projected
  bar list.
- `components/forecast/CoachInsightCard.tsx` — gradient brass
  card with savings-rate + milestone copy.
- `components/forecast/BurnRateTable.tsx` — restyled (Sterling
  card chrome, mono uppercase column headers).
- `app/(app)/forecast/page.tsx` — full rewrite. Reads `?h=`,
  builds the projection series, drops the old
  `HeroProjection` / `KpiCard` / `YearSummary` / `LegendDot`
  helpers. The "Income vs Spend · year view" bar card and the
  closing prose paragraph were removed; their information is
  redundant with the hero line and the burn-rate subtitles.
- **Deleted:** `components/charts/ForecastBars.tsx` (no remaining
  usages).

### Couldn't match exactly (and why)

- **Scenarios card** — explicitly skipped per user
  (out-of-scope; needs scenario storage + editing UX).
- **`Set this as a goal` button** — explicitly skipped per user
  (no goals infra).
- **Period toggle scope** — only the projection line's forward
  length, the middle KPI's label, and the middle KPI's value
  rescope with the toggle. The EOY KPI stays pinned to Dec 31 of
  the current year.
- **Hero per-category numbers in ref are placeholders**
  (`c.spent * 0.92`). Ours is computed from real
  `burnRatesEUR.avgMonthly` plus a small uplift when the current
  month is trending above avg.

### Verification

- TypeScript / lint / build **not run** in this session — Node
  isn't available on the worktree machine. User runs the build
  via Vercel preview deploy. Code reviewed manually against the
  existing `BurnRateRow`, `accountBalanceEURAt`,
  `totalBalanceEUR`, `ytdAverages` shapes and the Next 15
  `Promise<searchParams>` contract.

### Page-by-page rebuild status

- ✅ Chunk 14 — Transactions
- ✅ Chunk 15 — Accounts
- ✅ Chunk 16 — Categories
- ✅ Chunk 17 — Forecast

All four primary views now render in Sterling × Theus 1:1.

**Open questions:** none.

---

## Chunk 18 — Final pass: Auth + Coach + cleanup (2026-05-07)

Closing the Sterling 1:1 effort with three small alignments and a
version bump.

### Auth (1:1 with `design-refs/src/auth.jsx`)

- `components/auth/SocialButtons.tsx` — new shared component for the
  Google + Apple SSO row + "or" divider. Buttons are non-functional
  placeholders (`type="button"` with no handler) — the SSO icons
  (`logo-google`, `logo-apple`) didn't exist back at Chunk 2.1, so the
  row was skipped. Now that they're in `Icon.tsx`, the row renders.
- `SignInForm` and `SignUpForm` now mount `<SocialButtons />` between
  the AuthHeader and the email field — exact spacing from the ref.
- Primary CTA (`Sign in` / `Create account`) now uses the
  `arrow-right` `<Icon>` glyph instead of a Unicode arrow. Loading
  states still show "Signing in…" / "Creating…" without the arrow.
- `BrandPanel` and `AuthHeader` already matched the ref (lockup top,
  editorial centered with sparkline preview card, footer pinned
  bottom) — no changes there.
- Field labels stay in **Inter** (uppercase tracked) — that's what the
  ref uses (`fontFamily: 'inherit'`); JBM is reserved for the kicker,
  the divider text, and the brand-panel footer.

### Coach (`/coach`)

- Replaced the plain "Coming soon" placeholder with stub-with-real-
  chrome modeled on `design-refs/src/coach.jsx`:
  - Beta badge (sparkle icon) + 36 px headline ("Your money has
    patterns. Theus reads them, and tells you what to do next.").
  - 4-tile streak strip (Coach streak / Lessons completed / Saved /
    Next check-in) with em-dash placeholders rendered in JBM
    22/600 — values use `text-ink-mute` so they don't read as real
    stats. Tile icons (pulse, book, arrow-up, bell) match the ref.
  - Single empty-state insights card: surface bg, line border, radius
    14, padding 20, sparkle icon in an accent-soft 38x38 rounded-10
    tile, title "Coach is learning your patterns.", body about the
    four-week threshold.
- Skipped: the three hard-coded insight cards (no engine yet) and
  the right-column "Your path" learning module (out of scope).

### Cleanup

- `lib/version.ts` → `v2.1.0-α` / `2026-05-07` / "Sterling 1:1 —
  structural parity reached".
- `CLAUDE.md` §6 rewritten to "Sterling 1:1, palette TBD" with notes
  on JBM being back, the new `Icon` component, and the Topbar.
  Section 3 stack note flipped from "No JetBrains Mono" to
  "Inter + JetBrains Mono + Instrument Serif".
- Hex audit (`grep -rn '#[0-9A-Fa-f]\{6\}' components/ app/`): only
  legitimate matches remain — Google brand-logo SVG fills inside
  `Icon.tsx` (Google's brand palette is non-tokenizable) and the
  `<Swatch>` examples in `app/styleguide/page.tsx` (token reference,
  values are intentionally literal).

### Verification

- TypeScript / lint / build **not run** in this session — Node
  isn't available on the worktree machine. User confirms via the
  Vercel preview deploy; sidebar version marker should now read
  `v2.1.0-α`.

### Page-by-page rebuild status

- ✅ Chunk 14 — Transactions
- ✅ Chunk 15 — Accounts
- ✅ Chunk 16 — Categories
- ✅ Chunk 17 — Forecast
- ✅ Chunk 18 — Auth + Coach + cleanup

Sterling 1:1 closed. Palette decisions deferred — current tokens
remain in place as the working theme.

---

## Chunk 19 — bug fixes + feature requests batch (2026-09-14)

A batch of user-reported bugs and feature requests, not tied to the
Sterling chunk plan. See CLAUDE.md §8f for the "last completed month"
convention this introduces.

**Done:**

- **Font:** JetBrains Mono dropped again — third reversal, direct user
  feedback ("replace this idiotic typewriter font"). `tailwind.config.ts`
  `mono` family now aliases to `var(--font-inter)`; `app/layout.tsx` no
  longer loads JBM. Every existing `font-mono` class kept working
  unchanged (same trick as Chunk 6). Two inline-SVG chart labels with a
  literal `var(--font-mono)` fixed directly. See CLAUDE.md §6.
- **Subcategory on the transaction form:** `TransactionForm` had no
  subcategory field at all (`subcategory: null` was hardcoded). Added
  one, shown only when the selected category has subcategories.
  Selecting a category now auto-picks that category's most-used
  subcategory (`lib/categories/formOptions.ts#mostUsedSubcategoryByCategory`,
  fed by a new lightweight query `listCategorySubcategoryPairs` so it
  doesn't require pulling full transaction rows) — still fully
  overridable.
- **Default account:** Add-transaction now defaults to the EUR account
  named like "Cash" (`lib/accounts/defaultAccount.ts#pickDefaultAccount`,
  matches `/cash/i` + `currency==='EUR'`), falling back to the first
  account if there isn't one.
- **Global "add transaction":** new `GlobalAddTransactionModal`, mounted
  once in `(app)/layout.tsx` (which now also fetches accounts/categories/
  subcategory data for it). Opens via the Topbar's "+ New" button (now
  actually wired — it was a documented no-op since Chunk 12) or the "N"
  key from anywhere in the app (ignored while typing in a field or while
  another dialog is open). Separate from the existing page-local add
  flow on `/transactions` (different event name) so the two don't stack.
- **Subcategory not showing up after adding one:** `CategoryDetailModal`
  now keeps an optimistic local copy of the subcategory list, updated
  immediately on add/rename/delete instead of waiting on the
  `router.refresh()` round-trip.
- **"This month" → last completed month:** Dashboard (KPIs, spending
  mix, cashflow bars, Greeting insight line) and Categories page now
  anchor "this month" to `workingMonth(now)` — see CLAUDE.md §8f. Account
  balances (hero tile, sparkline) stay real-time. Greeting copy changed
  from "…this month" to "…in {Month}" so it reads correctly regardless
  of how far back the working month is.
- **New `/trends` page:** spend by category **and subcategory**, one
  column per month (6 visible, anchored to the working month), cells
  tinted red/green by month-over-month change with a ±10% "no change"
  band (`components/trends/TrendTable.tsx`,
  `lib/categories/monthlyTrend.ts`). Expense-only for this version —
  income wasn't in scope of the request. Added to the sidebar and to
  `middleware.ts`'s protected-route list.
- **Import diagnostics:** `ImportSummary.transactions` now breaks out
  expense/income/adjustment counts, shown under the Transactions stat
  on the import success card.

**Investigated, not fixed (need more info):**

- **"CSV import treats income as expense" / "spending by category
  numbers are wrong":** Went through `lib/xlsx/parse.ts` and
  `lib/xlsx/classify.ts` line-by-line against the legacy
  `parseXlsxRaw()` in `public/legacy/index.html` (lines 1346–1499) —
  the TS port is byte-for-byte identical in behavior, including the
  `Math.abs()` normalization of expense-block amounts (tested,
  intentional — see the "amount stored as absolute value" test in
  `test/lib/xlsx/classify.test.ts`). Also checked `monthTotalsEUR` /
  `categorySpendEUR` / `categoryTotalsByKindEUR` in `lib/balance.ts` —
  the math checks out. Couldn't reproduce a misclassification from code
  review alone. Added the type-breakdown diagnostic above so the next
  import makes the actual counts visible; next step is a concrete
  example (a screenshot, or "category X shows €Y for March, expected
  €Z") to pin down whether this is a parser bug, an FX-fallback drift
  (USD dates Frankfurter couldn't price), or something else.

**Skipped:**

- CSV file upload (only .xlsx is supported) — user confirmed in
  clarifying questions that the actual bug is about the existing .xlsx
  importer, not a request for a new CSV path.
- `/trends` income section — expense-only per the request's framing
  ("spending by categories"); add later if wanted.
- A month-count toggle (3/6/12) on `/trends`, mirroring Forecast's
  `HorizonToggle` — kept to a fixed 6 months for this version.

**Verification:** TypeScript / lint / build **not run locally** — Node
isn't available on this worktree machine (same as every prior chunk).
The first Vercel build genuinely failed: `lib/categories/monthlyTrend.ts`
compound-assigned into a `Map<string, number[]>` value's array index
(`catValues.get(cat)![idx] += eur`), which under `noUncheckedIndexedAccess`
types the read side as `number | undefined` even with the `!` on the
Map lookup. Fixed with a small `bump(arr, idx, delta)` helper that
reads with `?? 0`. Re-audited every new/changed file in this chunk for
the same indexed-compound-assignment pattern — nothing else found.

**Open questions:** the two "investigated, not fixed" items above need
a concrete repro from the user.

---

## Production cutover (2026-09-15)

The user explicitly ordered it, mid-conversation, after reviewing a
Vercel deployment screenshot: *"combine branches, push everything to
master and let's make the new theus our main page — not what was the
old one, that is currently on master."*

Checked first, since this touches production:
- `master`'s tip (`cd6e2bf`, "v1.0.1: capitalize Adjustment type
  badge") turned out to be a **direct ancestor** of the rehaul history
  — the rehaul had branched off `master` at that exact commit back at
  Chunk 0. So this was a pure fast-forward, not a real merge: no
  conflicts, nothing auto-resolved, nothing silently dropped.
- `experimental/theus-sterling-1to1` and `experimental/theus-rehaul`
  both turned out to have **zero commits** not already contained in
  this session's branch — so "combine branches" required no actual
  merging, just fast-forwarding `master` past all of them at once.

Action taken: `git push origin HEAD:master` (fast-forward,
`cd6e2bf..971fe3d`). `master` is now the full Next.js Theus app;
`public/legacy/index.html` (already part of the rehaul tree since
Chunk 0) keeps the old app reachable at `/legacy`. Nothing was deleted
— the pre-cutover `master` commit is still in history, just no longer
the tip.

CLAUDE.md updated throughout (§2, §7, §10, §12) to drop every
`experimental/theus-rehaul`-is-staging reference — `master` is now both
the working branch and production, and there is no branch protection
or required-PR step enforcing anything about that. Flagged in the doc
as a deliberate-for-now simplicity tradeoff, not a recommendation.

**Not done:** cleaning up the three now-fully-superseded branches
(`experimental/theus-rehaul`, `experimental/theus-sterling-1to1`,
`claude/budget-app-features-fa62f0`) — left alone since deleting
branches wasn't part of what was asked.
