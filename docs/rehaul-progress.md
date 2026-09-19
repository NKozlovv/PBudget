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

---

## Post-cutover fixes (2026-09-15, same day)

### `/` was still the Chunk 0 debug page

`app/page.tsx` had never been replaced once real auth landed — it was
still the "01 · in progress" status card linking out to `/login` etc.
User caught this live on production right after the cutover. Now a
plain server redirect: signed-in → `/dashboard`, otherwise → `/login`
(mirrors the check already in `(app)/layout.tsx`).

### Themed dropdowns, transactions perf, Trends redesign

User sent a screenshot of the Transactions "Month" filter showing a
plain white OS-native `<select>` popup floating over the dark UI —
this was the known, documented gap from Chunk 14
("Native popover styling ... deferred") finally getting flagged.
Fixed properly this time rather than deferred again:

- New shared primitives: `components/ui/useDismissable.ts` (click-
  outside/Escape close) and `components/ui/OptionsList.tsx` (the
  actual themed popup panel). No new npm dependency — Node/npm aren't
  available in this environment to safely update a lockfile, so this
  is hand-rolled rather than pulling in `@radix-ui/react-select`.
- `components/ui/Select.tsx` rewritten on top of them, **same external
  API** (`value` / `onChange(e) => e.target.value` / `<option>`
  children / `id`) — every call site (`TransactionForm`, `AccountForm`,
  `BudgetSwitcher`) needed zero changes. Internally it fakes the change
  event (`{ target: { value } }`) rather than driving a real hidden
  `<select>`, which is safe only because every call site was verified
  to read nothing but `e.target.value`.
- `Filters.tsx`'s `PillSelect` (Account/Category/Subcategory/Month/
  Sort — the exact dropdown in the screenshot) rewritten the same way,
  swapping the invisible-overlaid-`<select>` trick for a real popup.

Transactions filter slowness: the search box was calling `update()` →
`router.push()` (a full server round-trip refetching everything) on
**every keystroke**. Debounced to 350ms. Separately, the page was
rendering all matching rows unconditionally (a prior chunk removed the
row cap "per user request" back when there wasn't 1000+ real rows to
contend with) — now caps rendering to 150 with a "Load N more"
control, while still fetching the full filtered set once so the stat
strip's totals stay correct (only the *rendering*, the expensive part,
is capped).

Trends page: was hardcoded to a fixed 6-month window
(`VISIBLE_MONTHS = 6`). Now spans from the earliest expense transaction
through the working month, capped at 120 months as a sanity ceiling.
Redesigned per user feedback ("too messy and bleak"):
`components/trends/TrendsSummary.tsx` (new 4-tile strip, same pattern
as Transactions' `StatStrip`), sticky category column (now that the
table can genuinely scroll wide with full history), collapsible
category rows (client component now, `useState<Set<string>>`), cell
styling swapped from solid red/green background blocks to colored text
+ a small trend-arrow icon, and categories with zero activity across
the whole window are filtered out instead of rendering an all-dashes
row.

**Caught a real build break in this batch too:** `useRef<T>(null)`
where `T` doesn't itself include `null` fails to typecheck under this
project's React 19 types (confirmed by an existing correct usage in
`BudgetSwitcher.tsx`: `useRef<HTMLDivElement | null>(null)`) — the
first draft of `useDismissable` had this bug. Swept every `useRef<...>`
call in the repo before pushing; only the one needed fixing.

**Verification:** as always, no local `npm run build` (no Node in this
environment) — reviewed every new/changed file by hand for the
`noUncheckedIndexedAccess` and `useRef` generic-typing traps that broke
the build earlier the same day. User confirms via the live site since
`master` deploys straight to production now (see the cutover entry
above).

---

## Post-cutover fixes, round 2 (2026-09-15, same day)

### Root-caused the real "pages are slow" regression

Round 1 (above) fixed search-per-keystroke and row-count, but the user
reported filters *and general page navigation* were still slow.
Root cause: `(app)/layout.tsx` re-runs on **every** navigation (it's
fully dynamic — `createClient()` reads cookies, so Next can't cache it
at all), and round 1's `GlobalAddTransactionModal` wiring had it
eagerly fetching 5 extra queries (accounts, expense + income
categories, subcategories, category/subcategory pairs) on every single
page load just to support the "N" add-transaction shortcut — a
shortcut used occasionally, paid for on every navigation regardless.

Fixed: `GlobalAddTransactionModal` is now prop-less, fetches its own
data lazily via a new `app/actions/transactionFormData.ts` server
action the first time it's actually opened, and caches it in component
state (the component doesn't remount across client-side navigations,
so this is a true one-time fetch per page session). The layout is back
to just `budget` + `budgets` — what every page actually needs.
`getTransactionFormDataAction` inlines its Supabase queries rather than
importing `lib/data/*` (same caution as `app/actions/import.ts`), and
explicitly respects the active-budget cookie — `import.ts`'s version
doesn't (always resolves to the oldest budget), which is fine for a
one-shot import but would have silently written new transactions to
the wrong budget here for anyone who's switched budgets.

### Layout was too narrow / too centered on large monitors

`(app)/layout.tsx`'s content column was capped at `max-w-6xl` (1152px)
regardless of viewport — on anything bigger than a laptop screen this
left huge empty margins. Now `max-w-[1600px]` scaling to
`max-w-[1920px]` at the `2xl` breakpoint, with responsive padding
(`px-6 py-8` below `lg`, `px-10 py-10` at `lg`+).

### Uncategorised transactions filter

`/transactions`' Category filter pill now has an "Uncategorised"
option (`lib/transactions/constants.ts#UNCATEGORISED`, a sentinel
string) alongside the real category names. `listTransactions` matches
it against `category IS NULL OR category = ''` via `.or('category.is.
null,category.eq.')` rather than `.eq()` (which never matches NULL in
Postgres). Kept the sentinel in its own tiny module without
`import 'server-only'` specifically so the client-side `Filters.tsx`
can import it without pulling in the rest of the data layer (which
*is* server-only and would break the client bundle).

### Hover tooltips on every chart

New shared primitives: `components/charts/useChartHover.ts` (tracks
hover state + cursor position in plain CSS pixels relative to a
wrapping `relative` container — deliberately not SVG viewBox units, so
it's correct regardless of how the SVG scales) and
`components/charts/ChartTooltip.tsx` (the themed floating popup).
Wired into every real time-series/value chart in the app: Dashboard
(hero balance sparkline, Income/Spending KPI sparklines, cashflow
bars, spending-mix donut), Accounts (`AccountMiniChart`), Forecast
(`ForecastLine`), Categories (`CategoriesSummaryCard`'s donut).
`Sparkline` takes hover tooltips as opt-in via a new `labels` prop
(one label per data point) — the auth page's decorative preview
sparkline passes none and stays non-interactive; the dashboard tiles
now compute real month labels and pass them through.

Deliberately **not** touched: `AccountsDistributionBar` and
`PerCategoryOutlook` already show their exact values inline (legend /
bar caption) without needing a hover — a tooltip there would be
redundant. `components/charts/Donut.tsx` (the generic one) turned out
to be dead code, unused anywhere in the app — left it alone.

Line/area charts (`Sparkline`, `AccountMiniChart`, `ForecastLine`) needed
invisible per-point hit-region `<rect>`s added since there's no
existing per-point hoverable element on a path. Donut charts
(`CategoryDonut`, `CategoriesSummaryCard`) got hover handlers directly
on each segment's `<circle>` — safe because `fill="none"` + the
default SVG `pointer-events: visiblePainted` means an unpainted (dash
gap) arc doesn't intercept hover, so each segment naturally only
responds over its own drawn arc. Both donuts needed
`pointer-events-none` added to their center-label overlay div, which
was otherwise silently eating hover events over the whole circle
(its `inset-0` box, not just where the centered text actually sits).

**Caught again, swept for again:** the same `noUncheckedIndexedAccess`
compound-assignment and `useRef<T>(null)`-without-`| null` bug classes
from earlier today. Grepped every changed file for both before
pushing; none found this round.

**Verification:** no local build (no Node). User confirms on the live
site — `master` is production now.

---

## Data-correctness audit: silent transaction truncation (2026-09-15)

User report: the Accounts page showed a "Deel, €" account holding
€3,000 (its untouched opening balance) when its transaction history
should have netted it to €0 — and asked for a full audit of the
balance/money math, not just a patch for that one card, with an
explicit "there should be no bugs in logic" bar to clear.

**Audited, found correct:** `lib/money.ts` (`signedAmount`, `txToEUR`),
`lib/balance.ts` (every `accountBalanceNativeAt` /
`accountBalanceEURAt` / `totalBalanceEUR` / `monthTotalsEUR` / etc.),
`lib/accounts/summary.ts`, and the xlsx classify/parse path (re-checked
against the legacy port, still byte-identical). All arithmetic and
account_id/date filtering logic is sound.

**Root cause found:** not a math bug — a silent data-fetching one. See
CLAUDE.md §8g for the full writeup. Short version: every "give me all
this budget's transactions" call had no `.range()`/`.limit()`, and
PostgREST caps unbounded selects at ~1000 rows server-side with no
error. Ordered `date desc`, so the *oldest* transactions were the ones
silently dropped once a budget passed 1000 total transactions — which
this budget has (recall the transactions page showed "1000 entries" a
few chunks ago; that was itself this bug, not the true count). An
account whose real balance-affecting activity reached further back
than the 1000-row cutoff would show a balance frozen at (or near) its
opening balance, exactly the reported symptom.

**Fixed:** `lib/data/transactions.ts` — `listTransactions()` (no-limit
path), `listMonthsWithTransactions()`, `listCategorySubcategoryPairs()`
all now page through explicitly with an exact-count-based termination
condition (robust to any actual per-request cap, not just 1000 — see
the code comment). This is the shared data layer behind Dashboard,
Accounts, Categories, Forecast, and Trends, so one fix corrects all
five.

**Also found and fixed while auditing:** `TransactionForm.tsx`'s manual
Add/Edit flow accepted a **negative** amount for Expense/Income types
(validation only rejected zero/NaN). Combined with `signedAmount()`
negating expenses, a manually-entered negative expense would silently
*credit* the account instead of debiting it — and since every display
path renders `Math.abs(tx.amount)` with the sign coming from `type`,
a transaction affected by this would look completely normal in the
ledger (right category, right description, normal-looking amount) —
only the account balance would be quietly wrong. Fixed by normalizing
to `Math.abs()` for expense/income (Adjustment is the one type that
legitimately encodes direction in the sign, left as typed). This is a
latent bug, not necessarily *the* explanation for the reported case —
but if the discrepancy isn't fully explained by the truncation fix,
this is the next thing to check (search the ledger for suspicious
entries, though the display bug above means it won't visually stand
out).

**Not fixed (flagged, low stakes):** `app/actions/transactionFormData.ts`
still has one unbounded transactions read (category/subcategory pairs,
for the "most used subcategory" suggestion) — doesn't feed any
displayed total, left alone to keep this batch focused; noted in
CLAUDE.md §8g for whoever touches that file next.

**Verification:** no local build (no Node) — reviewed every changed
line by hand, including another sweep for the `noUncheckedIndexedAccess`
/ `useRef` bug classes from earlier today (none found). Can't confirm
against the user's live data directly (no DB access from this
environment) — asked the user to check the Accounts page again post-deploy.

---

## Small fixes round (2026-09-15, same day)

- **Stopped double-pushing to `claude/budget-app-features-fa62f0`** —
  user asked why every push went to two branches. It was leftover
  habit from right after the cutover; pointless now that `master` is
  the working branch. Push `master` only from here on — see CLAUDE.md
  §2/§10.
- **Uncategorised filter fix:** the actual bug — `listTransactions`'s
  `UNCATEGORISED` case used a hand-built `.or('category.is.null,
  category.eq.')` PostgREST filter string (untestable from this
  environment, no live Postgres to check the exact grammar against).
  Simplified to a plain `.is('category', null)` — both the import path
  and manual entry already normalize a blank category to `NULL`, never
  `''`, so the empty-string half of the OR was unnecessary risk anyway.
  Separately, the user's real confusion turned out to be a display bug,
  not the filter itself: `DayGroupedList`'s description column fell
  back to the literal text **"Uncategorised"** when a row had neither
  a comment nor a category, which reads exactly like a category tag
  even though it isn't one. Changed the fallback text to "No
  description" so it can't be mistaken for a category value.
- **Subcategory now shown on the Transactions ledger:** the category
  column (`DayGroupedList` col 3) shows the subcategory as a small
  label under the category chip whenever the row has one — previously
  it only appeared in the description column's secondary line, and
  only when the row had no comment.

---

## Dashboard round: real uncategorised bug, chart tooltips, year forecast (2026-09-15, same day)

User feedback with a dashboard screenshot: the Uncategorised filter
still returned nothing, a chart tooltip was visibly cut off, the
monthly cash-flow chart needed a visual rework, the non-functional
period toggle should just go, and the chart should show the full year
with a forecast rather than a rolling 12-month window.

### The real uncategorised bug

The screenshot's "Spending mix" donut had a slice literally labeled
**"Uncategorized"** (American spelling, no parens) sitting as its own
peer category with a real €298 — not the synthetic `(Uncategorised)`
bucket the code produces for true NULLs (different spelling, has
parens). That was the tell: some of this budget's transactions have
the literal text `"Uncategorized"` stored as their `category` value —
carried over from the original spreadsheet, where the user evidently
used it as their own label — not NULL. The `IS NULL` filter from
earlier today was checking for the wrong thing entirely.

Added `lib/transactions/constants.ts#isUncategorised()` (matches NULL/
blank OR the literal text, either spelling, case-insensitively) and
`categoryDisplayName()` (canonical "Uncategorised" label for display/
grouping). `listTransactions`'s Uncategorised filter now fetches
everything matching the other filters and filters in JS with
`isUncategorised()` — deliberately not a SQL-level OR-with-text-match,
same reasoning as this morning's fix (no live Postgres here to
validate raw PostgREST filter syntax against). Applied
`categoryDisplayName()` in `lib/balance.ts`'s three category-bucketing
functions too (dashboard mix, burn rates, category totals) so the app
never shows two different "no category" buckets side by side, and in
`DayGroupedList` so the ledger's category chip goes properly blank for
these rows instead of showing "Uncategorized" as if it were a real,
selectable category.

### Tooltip clipping

`HeroBalanceTile`'s Card has `overflow-hidden` (for its rounded
corners); the sparkline tooltip near "today" (the rightmost, most
commonly-hovered point) was centered on the cursor and got its content
silently clipped by the card edge. `useChartHover` now also reports
`containerWidth`; `ChartTooltip` uses it to pin itself to the left or
right edge instead of centering, whenever the cursor is within ~72px
of either side. Threaded through all six chart components.

### Cash flow chart: full year + forecast, period toggle removed

- Deleted `components/dashboard/PeriodToggleClient.tsx` and
  `components/ui/PeriodToggle.tsx` (and `PERIODS`/`Period`/
  `parsePeriod` from `lib/dashboard/period.ts`) — it never actually
  rescoped anything (a known, documented limitation since Chunk 13),
  and the user said directly they don't need it.
- `IncomeSpendBars` rewritten to take `ForecastBucket[]` (from
  `lib/balance.ts#forecastYear` — already existed, written for the
  original Forecast page's now-replaced bar chart, unused since Chunk
  17 swapped it for `ForecastLine`; revived here rather than writing
  new aggregation logic) instead of a rolling 12-month window. Past
  months render solid; months from today onward render at reduced
  opacity with a dashed outline, matching the Forecast page's visual
  language for "projected". Added a vertical "TODAY" marker at the
  actual/projected boundary, a third legend entry for "Projected", and
  widened the y-axis tick set (was 2 gridlines, now 4).
- Dashboard page anchors this chart to **today** (not `workingMonth`)
  deliberately — the in-progress month has real partial data worth
  showing as "actual so far" rather than being replaced by a flat
  average, and it's explicitly framed as a forecast. The KPI tile
  sparklines (Income/Spending trend) are unchanged, still rolling
  12-month ending at the working month — this only touched the Cash
  flow card.

**Verification:** no local build (no Node) — reviewed every changed
file by hand, swept again for the `noUncheckedIndexedAccess`/`useRef`
bug classes and for dangling references to the deleted PeriodToggle
files (none found).

---

## Dashboard round 2: donut seam, YTD mix, cash flow polish (2026-09-15, same day)

User sent two more screenshots after the previous round deployed:
a visual seam in the Spending-mix donut, a request to make it show a
YTD average instead of one month, and detailed feedback on the new
Cash-flow chart (today-marker landing in the wrong place, unintuitive
colors, hard to tell which bars belong to which month) — plus a
direct ask to bring the same bar up across every remaining chart.

- **Donut seam:** adjacent stroke-dasharray segments can show a
  hairline anti-aliasing gap at their shared edge — a known artifact
  of this exact technique, most visible on a big slice next to several
  small ones (exactly this dataset: one ~50% slice against a cluster
  of slivers). Fixed in both `CategoryDonut` and
  `CategoriesSummaryCard` by rendering each segment ~1px longer than
  its exact mathematical share so it overlaps into the next one;
  `off` still advances by the *exact* length so proportions and the
  tooltip stay accurate. Also added the `value > 0` filter
  `CategoryDonut` was missing (present in the generic `Donut` but not
  here) as a second defensive layer.
- **Spending mix → YTD average:** was a single month's raw category
  totals (noisy — one big one-off purchase dominates the whole ring).
  Now `burnRatesEUR(...).avgMonthly` per category (function already
  existed for the burn-rate tables) — center label now reads "avg /
  month", subtitle "YTD average" instead of the month name.
  `lib/balance.ts#categorySpendEUR` removed as dead code (nothing else
  called it).
- **Cash flow "today" landing one month early:** the chart anchored
  the actual/projected boundary to *today* rather than the *working
  month* — deliberate at the time ("partial data is worth showing"),
  but in practice the in-progress month (September, ~2 weeks in) had
  a barely-visible sliver of real data that looked like a rendering
  bug. Switched the boundary to the working month, consistent with
  every other "this month" reference on the dashboard (falls back to
  "nothing actual yet" only if the working month rolled into the
  previous year — i.e. it's currently January).
- **Cash flow colors:** Spend bars used the brass `--accent` token;
  changed to `--neg` (red/rust) to match the sign convention already
  used everywhere else in the app (KPI tiles, the ledger) — green =
  in, red = out.
- **Cash flow month grouping:** the gap *within* an income/spend pair
  and the gap *between* different months' pairs were numerically
  identical, so all 24 bars read as one undifferentiated row instead
  of 12 pairs. Tightened the within-pair gap, widened the between-
  month gap, added a subtle alternating background band per month,
  and centered each month's label under its *whole* pair rather than
  offset toward one bar.
- **Applied the same bar to the remaining chart:** `ForecastLine` only
  had one Y-axis label (top-right max); added a proper 3-line grid
  (min/mid/max) with value labels, matching the density now used on
  the Dashboard's own charts. `AccountMiniChart` already had axes from
  an earlier chunk and was left alone.

**Verification:** no local build (no Node) — reviewed every changed
file by hand, swept again for the recurring bug classes from earlier
today (none found).

## Dashboard round 3: Hero/KPI tile charts brought to the same standard (2026-09-15, same day)

User called out that the previous "year + forecast + axis" pass only
touched the Cash flow chart and Forecast page — the three Hero/KPI
tiles (Total Balance, Income, Spending) still had the old bare,
axis-less `Sparkline` rolling-12-month line. Brought them up to the
same visual language:

- **New `components/charts/TrendLineChart.tsx`:** compact version of
  the `ForecastLine` pattern, sized for a KPI tile rather than a full
  card — solid line for actual months, dashed + 60%-opacity for
  projected, a small filled marker at the actual/projected boundary,
  min/max Y gridlines with compact value labels, up to 3 x-axis month
  labels (first / boundary / last — a full 12-label row doesn't fit a
  tile this narrow), and the same hover-tooltip wiring
  (`useChartHover` + `ChartTooltip`) already used elsewhere.
- **`HeroBalanceTile` / `MonthKpiTile`:** swapped `Sparkline` for
  `TrendLineChart`; props changed from `trend: number[]` +
  `trendLabels?: string[]` to a single `series: TrendPoint[]`.
- **`app/(app)/dashboard/page.tsx`:** all three tiles now plot the
  full current calendar year (Jan–Dec), not a rolling 12-month window,
  with the same actual/projected boundary as the Cash flow chart
  (`workingMonth`, via `cashFlowEndMonth`):
  - Income / Spending reuse the already-computed `yearBuckets`
    (`forecastYear(...)`) directly — no new aggregation needed.
  - Balance gets its own series (`yearBuckets` only carries
    income/expense, not a running balance): real month-end balances
    for months through the working month
    (`accountBalanceEURAt` summed across accounts), then extended
    forward from the last real balance at the YTD average net-savings
    pace (`ytdAverages(...).avgNet`) for the remaining months — the
    same forward-projection logic the Forecast page already uses,
    just anchored to a real balance instead of €0.
  - `Sparkline` itself is untouched and still used by `AccountMiniChart`
    (accounts page) and `BrandPanel` (auth screen decoration) — neither
    needed this treatment.
  - Removed now-dead `lastNMonthsTotals`-based `incomeTrend` /
    `expenseTrend` / `monthTrendLabels` / `balanceTrendLabels` local
    variables; the 7-month `last7`/`priorSix` window computed from the
    same helper is unrelated and stays (Greeting insight line + KPI
    tile month-over-month deltas).

**Verification:** no local build (no Node) — traced every new/changed
call against its real function signature in `lib/balance.ts` /
`lib/date.ts` / `lib/money.ts` (`ytdAverages`, `accountBalanceEURAt`,
`forecastYear`, `monthName`, `fmtEUR`'s `FormatOptions`) rather than
assuming; grepped for the two recurring bug classes
(`noUncheckedIndexedAccess` compound assignment, `useRef` without
`| null`) across every file touched — none found; grepped the whole
tree for `HeroBalanceTile`/`MonthKpiTile`/`Sparkline` usages to confirm
no dangling references to the old `trend`/`trendLabels` props survived
outside the dashboard page.

## Dashboard round 4: less-cramped tiles, YTD averages, savings rate trend (2026-09-15, same day)

Immediate follow-up feedback on round 3: the new Hero/KPI tile charts
looked cramped, the user wanted to see average income/spending
alongside the month numbers, and pointed at a screenshot of the
pre-Theus (legacy) app's "Savings rate" card asking for the same idea
(the old per-month "how much did I keep" trend) on the new dashboard.

- **Cramped tile charts, fixed:** `TrendLineChart`'s Y-domain padding
  was too tight — the highest/lowest point in each series landed
  almost exactly on its own axis gridline/label, which read as
  crowded rather than "the peak." Widened the vertical domain padding
  (was ±5%, now ±20%, `span` factor 1.1→1.4), bumped padding
  (`l/t/b`) and axis font size (8→9), and gave the tiles themselves a
  bit more chart height (Hero 100→116, Income/Spending 90→104).
- **YTD average, added:** `MonthKpiTile` takes a new `avgAmount` prop
  and shows "avg €X,XXX/mo" next to the % delta, computed from
  `ytdAverages(...).avgIncome` / `.avgExpense` (already being
  computed on the page for the Balance tile's forecast — no new
  aggregation needed, just reused and renamed `ytdForBalance` → `ytd`
  since it now serves three tiles' worth of numbers, not one).
  Deliberately kept this as plain text rather than an on-chart
  reference line — the tile chart is only 300×104, and a fourth
  visual element on top of the actual/projected split and gridlines
  would have made the cramped-chart complaint worse, not better.
- **New "Savings rate" card:** `components/charts/SavingsRateChart.tsx`
  — a from-scratch inline-SVG port of the legacy `chartSavings`
  (`public/legacy/index.html` — "Savings rate" trend, `savColor`,
  `savingsLabels` plugin, `savingsInsight` footer). Per real
  (non-projected) month with income, plots
  `(income − expense) / income × 100`; unlike the Cash flow/KPI
  charts this one doesn't project unreached months — matches the
  legacy behavior of just leaving them blank, since a savings *rate*
  isn't something that's meaningful to average-forward the way a
  balance or raw income/expense total is. Segments/points/labels are
  colored green (`--pos`) when the rate they end on is positive, red
  (`--neg`) when it isn't; a dashed YTD-average reference line runs
  across the chart; a one-line footer below it calls out a new best
  month, an active positive-months streak, or falls back to the YTD
  average — same three-way logic as the legacy `savingsInsight`
  function, ported directly rather than re-invented. Value labels use
  a native SVG `paintOrder="stroke"` halo (`--bg-panel` stroke behind
  the fill) instead of the legacy's canvas-plugin trick, since this
  app draws every chart as plain SVG with no charting library.
  Wired into the Dashboard as a new full-width card between the
  Cash-flow/Spending-mix row and the Accounts/Recent-activity row;
  falls back to "Not enough data yet" text if fewer than 2 real
  months have income (mirrors the `data.length < 2 → null` guard
  every other chart component already uses, just surfaced as a
  message instead of an empty card since this one sits inside an
  always-rendered `<Card>` wrapper on the page).

**Verification:** no local build (no Node) — reviewed every changed
file by hand; re-swept `TrendLineChart.tsx`, `SavingsRateChart.tsx`,
`MonthKpiTile.tsx`, `HeroBalanceTile.tsx`, and the dashboard page for
the two recurring bug classes (none found); checked the new
`fmtEUR`/`FormatOptions` and `ytdAverages`/`ForecastBucket` field
usages against their real definitions in `lib/money.ts` / `lib/balance.ts`.

## Dashboard round 5: YTD-first hero tiles + a real navigation-speed pass (2026-09-15, same day)

Immediate follow-up: round 4's chart padding fix didn't read as enough
("still the same"), and five concrete asks about what the Hero/KPI row
should actually show, plus a general "pages load too long, make it
feel responsive" ask that went well beyond the Dashboard.

**Hero/KPI tiles, redesigned:**
- **"Saved this year" badge** — a small colored pill under the
  `TOTAL BALANCE` kicker (top-left of the card, where asked), showing
  real YTD income − expenses (`ytdAverages(...).totalNet`, not a
  projection).
- **Income/Spending tiles now headline the YTD average**, not last
  month's total — `MonthKpiTile` dropped `amount`/`prevAmount`/`kind`
  entirely in favor of a single `avgAmount` prop
  (`ytd.avgIncome`/`ytd.avgExpense`). Also dropped the per-tile
  "vs last month" delta these used to show — there's no meaningful
  "previous period" for a running average, and the request was
  explicitly to stop showing last-month figures here.
- **Fixed the Total Balance "vs last month" delta**, which the user
  correctly flagged as never really going negative. Root cause: it
  compared the *live* balance to last month's closing balance — and
  since this app's users enter transactions at month-end
  (`workingMonth()`, §8f), most of the month has *zero* new
  transactions yet, so live balance == last month's close and the
  delta reads "+€0" for weeks at a stretch even when the household is
  actually bleeding money. Not a bug in the math, but a metric that's
  silent almost all the time. Redefined it as
  EOM(last completed month) − EOM(the month before it) — two fully-
  elapsed real months — so it's always populated and correctly signed
  the moment last month's data is in; labeled explicitly ("Aug vs
  Jul") so it doesn't read as reconciling against the live headline
  number above it, which is intentionally still real-time per §8f.
  Removed the now-dead 12-month `accountsTrajectoryEUR` trajectory
  this used to be computed from.
- **New 3-up stat strip** (Saved this year / Savings rate / Projected
  EOY) under the delta line. "Savings rate" is the simple average of
  each real month's own (income − expense) ÷ income — computed with
  the *exact same* filter/formula as the Savings-rate card's own "YTD
  avg" (deliberately duplicated rather than having the card export its
  internal number, to keep the two independent and still guaranteed
  to agree). "Projected EOY" is just `balanceYearSeries[11]` — the
  chart already projects the balance out to December, so Dec's own
  value *is* the EOY projection, no new math needed.

**Navigation speed:** an actual audit turned up a real, systemic
cause of "pages load too long" — not a single slow query, but the same
answers being fetched over and over on every navigation:
- `app/(app)/layout.tsx` (auth gate + sidebar) and *every single page*
  under it each called `supabase.auth.getUser()` and
  `getOrCreateUserBudget()` independently — the latter itself calling
  `auth.getUser()` *and* `listBudgets()` again internally. That's
  ~5–7 Supabase round trips spent re-deriving the same "who's signed
  in, what's their budget" answer before a page's own data even
  starts loading, on *every* navigation. Fixed with React's `cache()`
  — Next.js's own recommended pattern for exactly this shape of
  problem: `getAuthUser()` (new, in `lib/supabase/server.ts`) and
  `listBudgets()`/`getOrCreateUserBudget()` (`lib/data/budgets.ts`)
  are now per-request-memoized, so the first call anywhere in a
  render pass hits Supabase and every later call (layout, page,
  nested helper) reuses that same result for free. `app/(app)/layout.tsx`,
  `app/(app)/dashboard/page.tsx`, and `app/(app)/members/page.tsx` —
  the three places calling `auth.getUser()` directly — now go through
  `getAuthUser()` instead so they dedupe too.
- `listTransactions({ budgetId })`'s full-history pagination
  (`lib/data/transactions.ts`, added in the §8g truncation fix) was
  sequential — page 2 didn't start until page 1 finished, and so on.
  Once the first page returns Postgres's exact row count, every
  remaining page's offset is already known, so they now fire together
  via `Promise.all` instead of one at a time — for a budget with
  several thousand transactions (this one has been filled in for most
  of a year across 13 accounts) that's N round trips collapsed to 2.
  Applied the same fix to `listMonthsWithTransactions()` and
  `listCategorySubcategoryPairs()`, which paginate the same way. Kept
  the original sequential, short-page-terminated loop as a fallback
  for the (shouldn't-happen) case where PostgREST doesn't return a
  count despite `{ count: 'exact' }` being requested — never guess how
  many pages to fetch in parallel when the real total is unknown; see
  this file's top comment on why silent under-fetching here is the
  one thing to never risk.
- Dashboard no longer runs a second `listTransactions` query just for
  the 8-row "recent activity" list — it was already fetching every
  transaction for the page's own totals, sorted the same way
  (`date desc, created_at desc`), so `allTx.slice(0, 8)` is identical
  data for zero extra round trips.
- Added `app/(app)/loading.tsx` — Next.js nests a route segment's
  `loading.tsx` around every page below it in a Suspense boundary
  automatically, so one file here covers Dashboard/Transactions/
  Accounts/Categories/Forecast/Trends/Import/Members. The Sidebar/
  Topbar (rendered by the layout, above this segment) stay mounted
  and clickable immediately on navigation; only the main content area
  shows a pulsing skeleton while the new page's data loads — that's
  what makes navigating *feel* instant instead of the whole app going
  blank until every query resolves.
- Audited the other five `(app)` pages (Accounts/Categories/Forecast/
  Trends/Transactions) for the same sequential-fetch shape — all of
  them already `Promise.all` their own independent queries once
  `budget` resolves, so the layout/page auth-and-budget dedup above is
  a free win for all of them with no per-page changes needed.

**Verification:** no local build (no Node) — reviewed every changed
file by hand; re-swept every touched file for the two recurring bug
classes (none found); traced the parallel-pagination rewrite against
the exact-count termination logic §8g depends on to confirm the
fallback path preserves the original safety net; grepped the whole
tree for `HeroBalanceTile`/`MonthKpiTile` usages (dashboard page only)
and for other direct `auth.getUser()` call sites (layout, dashboard,
members — all now on `getAuthUser()`) to confirm nothing was missed.

## Dashboard/Transactions round 6: savings breakdown, transactions goes client-side (2026-09-15, same day)

Immediate follow-up to round 5. Two threads: the Dashboard's new "saved
this year" figure read as untrustworthy, and — the bigger one —
Transactions filtering was still "REALLY slow" despite round 5's
navigation fixes, plus explicit asks for multi-select filters, a
trimmed sort menu, and multi-select transaction types.

**Dashboard — "saved this year" transparency:** the figure itself
(`ytdAverages(...).totalNet = totalIncome − totalExpense`) was already
correct — it inherently nets out loss months, since a bad month's
expense total drags the whole-year subtraction down the same way
regardless of which month it happened in. But shown as a single bare
"+€7,797 saved this year" pill, with no visible connection to the
Savings-rate chart's red months right below it, it read as if it might
be ignoring them. Fixed by making the arithmetic visible rather than
changing it: `HeroBalanceTile` now shows "€54,571 in − €46,774 out"
next to the badge, plus "N months in the red" when applicable — new
`savingsIncome`/`savingsExpense`/`monthsInRed` props from
`ytd.totalIncome`/`ytd.totalExpense` and a
`yearBuckets.filter(b => !b.projected && b.net < 0).length` count,
computed in `app/(app)/dashboard/page.tsx`.

**Also fixed `StatStrip`'s "Avg / day" tile** (Transactions page) —
it divided by `Set<date>.size` (distinct days *with* a transaction),
not the number of days actually spanned by the filtered set, which
quietly inflated the average for any period with gaps. Dropped
entirely per the user's request rather than patched — went from a
4-tile to a 3-tile (In/Out/Net) strip.

**Transactions page — moved to client-side filtering.** The real cause
of "still slow": every filter pill click called `router.push()` with
new URL search params, which is a full server round trip in the App
Router — re-running the page's entire `Promise.all` (accounts, both
category kinds, subcategories, the month-distinct query, the filtered
transaction fetch, the subcategory-pairs query — 6+ Supabase queries)
on *every single click*, even though only the transaction filter
itself actually needed to change. With this budget's history
(~1,000 rows) comfortably fitting in memory, the fix was to stop
doing that:

- `app/(app)/transactions/page.tsx` is now a thin server shell — fetch
  everything once (unfiltered `listTransactions({ budgetId })` plus
  reference data), no `searchParams` parsing at all — and hand it all
  to a new `TransactionsClient.tsx`.
- `TransactionsClient.tsx` (new) owns filter/sort state and "load
  more" pagination as plain `useState`, derives the filtered+sorted
  list with `useMemo`. Every interaction is now a synchronous in-
  memory array pass — no network round trip, no page reload. Also
  derives the month-filter's option list directly from the loaded
  transactions, so `listMonthsWithTransactions()` (a full paginated
  table scan) is no longer needed anywhere — removed from
  `lib/data/transactions.ts` entirely (and its mention in CLAUDE.md
  §8g updated to match).
- `Filters.tsx` rewritten from URL-param-driven to
  `value`/`onChange`-controlled, and every filter is now multi-select
  (Account/Category/Subcategory/Month) — picking "Groceries" and
  "Restaurants" together now works, where before each filter field
  only ever held one value. `components/ui/OptionsList.tsx` grew an
  optional `selected?: Set<string>` prop for this (row highlighting
  comes from set membership instead of `value` equality when passed;
  single-select callers — `Select.tsx`, the Sort dropdown here — are
  untouched since they still pass `value` and own their own "close on
  pick" behavior, which `OptionsList` never controlled to begin with).
- Transaction **type** filter is a multi-select pill row with the
  explicit behavior asked for: selecting all 3 (Expenses/Income/
  Adjustments) auto-collapses back to the "All" pill rather than
  showing three checks that mean the same thing.
- **Sort trimmed to Date and Amount only** (dropped Type/Category/
  Comment sort, which didn't fit a ledger read top-to-bottom by when
  or how much).
- `TransactionsTable.tsx` needed no changes — it already just renders
  whatever `transactions` array it's given and calls `router.refresh()`
  after a mutation, which re-runs the (now much cheaper) server page
  and flows fresh data back down through `TransactionsClient`'s props;
  its local filter/sort state survives that refresh untouched since
  it's the same component instance.

**Verification:** no local build (no Node) — reviewed every changed
file by hand; re-swept every touched file for the two recurring bug
classes (none found); grepped for the removed `listMonthsWithTransactions`
and the old URL-param helpers (`parseLimit`/`parseType`/`parseSort`/
`parseDir`/`loadMoreHref`) to confirm nothing still referenced them;
confirmed `OptionsList`'s only other caller (`Select.tsx`) still passes
`value` (not `selected`) and is unaffected by the new optional prop.

## Chart aspect-ratio distortion fix (2026-09-15, same day)

User reported the Dashboard charts (again) as "crooked... zoomed in
and compressed" after round 6's padding pass, this time with a clear
screenshot. Root cause was structural, not a padding number: every
line/sparkline chart (`TrendLineChart`, `ForecastLine`,
`SavingsRateChart`, `AccountMiniChart`, `Sparkline`) rendered its
`<svg>` with `width="100%"` (fluid, follows the card) but a *literal
pixel* `height` attribute, combined with `preserveAspectRatio="none"`.
That combination means the SVG's actual on-screen box almost never
matches its own `viewBox` ratio — e.g. `TrendLineChart`'s hero-tile
viewBox is 500×116, but the hero card itself renders anywhere from
~600–900px wide depending on viewport/zoom while height stays pinned
at 116px, so `preserveAspectRatio="none"` stretched the X-axis by
whatever factor the real width differed from 500, every time. (The
one chart that *didn't* show this — `IncomeSpendBars`, the Cash flow
bars — uses `preserveAspectRatio="xMinYMid meet"` instead of `"none"`,
which fits-and-letterboxes rather than stretching; that's why only the
line charts were affected.)

**Fix:** wrap each chart's container `<div>` in
`style={{ aspectRatio: `${width} / ${height}` }}` and change the
`<svg>`'s own `height` from a literal pixel number to `"100%"`. CSS
`aspect-ratio` on the wrapper forces its rendered height to always be
exactly `renderedWidth * (height / width)` — the same ratio the
viewBox already assumes — so the SVG's actual box matches the viewBox
ratio at *any* card width, and X/Y always scale by the same factor.
Zero distortion possible now, versus "distortion whenever the card
isn't exactly `width`px wide" before. Side effect (intentional, and
better): these charts now scale height *with* width responsively
instead of holding a fixed pixel height while width alone flexed —
more in the spirit of the earlier "make the layout depend on
resolution" feedback, not just a bug fix.

Applied identically to all five affected components; `IncomeSpendBars`
and the donut charts (`CategoryDonut`/`Donut`, which already use
literal matching `width`/`height` — always square, never fluid) needed
no change.

**Verification:** no local build (no Node) — reviewed each edited
file's JSX by hand to confirm the wrapper/svg tag changes didn't
disturb surrounding structure (`ForecastLine.tsx` in particular has
unusual pre-existing indentation); re-swept all five for the two
recurring bug classes (none found); grepped the whole `components/`
tree for `preserveAspectRatio` to confirm every `"none"` user was
caught and `IncomeSpendBars`'s `"meet"` (a different, non-distorting
mode) was correctly left alone.

## Total Balance chart: start-of-year point + decluttered hero tile (2026-09-15, same day)

Two follow-ups on the Hero row: the Total Balance chart's "JAN" point
is actually end-of-January (already includes January's activity), so
there was nowhere to see the true opening balance the year started
from; and the Hero card itself had grown a stack of six vertically-
piled blocks (badge → breakdown text → big number → delta → stat strip
→ chart) across several rounds of additions, reading as cluttered next
to the much simpler 4-block Income/Spending tiles beside it.

- **Start-of-year point:** `balanceYearSeries` (`app/(app)/dashboard/page.tsx`)
  now prepends a `{ label: 'START', value, projected: false }` point —
  the real account balance at Dec 31 of the previous year
  (`accountBalanceEURAt` at `new Date(cashFlowYear, 0, 0)`, i.e. day 0
  of January) — ahead of the existing Jan–Dec end-of-month points. The
  series goes from 12 points to 13; `TrendLineChart` needed no changes
  (its x-tick/boundary logic already operates generically over
  whatever array it's given), but `projectedEOY` — which reads the
  series' last entry — moved from index 11 to index 12.
- **Hero tile decluttered:** removed the "+€X saved this year" pill
  that sat above the big number — it was pure duplication of the first
  stat-strip cell just below it. Its "€X in − €Y out" breakdown moved
  into that cell as a small sub-line (new optional `sub` prop on the
  tile's internal `Stat` component) instead of floating as a separate
  top-level block. Net: one fewer stacked section, no information
  lost, and the card's proportions now sit closer to the KPI tiles'
  simpler shape instead of visibly dominating the row.

**Verification:** no local build (no Node) — traced `balanceYearSeries`
index math by hand after the prepend (12 real months → indices 1–12,
so `projectedEOY = balanceYearSeries[12]`, not `[11]`) rather than
assuming; re-swept both changed files for the two recurring bug
classes (none found); confirmed `monthsInRed` (no longer displayed)
was fully removed — prop, computation, and JSX — rather than left as
dead code.

---

## Chunk 20 — v4 "liquid glass" rehaul, superseding Sterling (2026-09-17)

The user commissioned a full visual re-haul in Claude Desktop
(`design_handoff_theus_rehaul/README.md` + `Theus Rehaul v4.dc.html`,
approved direction) and asked for it implemented 1:1: light ambient
ground, frosted-glass panels, one type family (Plus Jakarta Sans),
capsule controls, a fixed six-hue category map, top nav instead of a
sidebar. This **replaces the Sterling navy dark theme** (Chunks 12–19)
— everything below is a from-scratch rebuild of the presentation
layer on branch `claude/design-handoff-implementation-724101`.

The individual commits are titled "Chunk 1" / "Chunk 4" / "Chunk 5"
etc. — that numbering is the design spec's own 8-step work order
(README §Work order), a separate sequence from this file's chunk
count. Mapping, in order landed:

1. **Foundations** — `styles/tokens.css` rewritten (ambient ground,
   3-level glass recipe with a shared hover contract, seven brand
   hues, `--in`/`--out`/`--warn`, motion keyframes); `app/layout.tsx`
   onto Plus Jakarta Sans (Inter + Instrument Serif dropped);
   `tailwind.config.ts` repointed, with `accent`/`accent-hi`/`pos`/
   `neg` kept as transitional aliases onto the new hues so screens not
   yet touched didn't render unstyled text; capsule primitives
   (`Button`, `FilterPill`, `Pill`, `Input`, `IconButton`, `Card`→glass
   panel at panel/inner/tile level); `lib/categoryColor.ts`'s ten-hue
   hash → fixed seven-hue hash + `tint()` helper.
2. **Top nav** (`components/nav/TopNav.tsx`) replaces `Sidebar.tsx` +
   `Topbar.tsx`: floating glass capsule, brand, tabs, account capsule.
   The mockup only designs tabs for the four core screens; per the
   user's explicit call, Accounts and Forecast got full tabs too and
   Coach/Members/Import moved behind a "More" dropdown so the bar
   stays one row at every width (the spec's own constraint). Budget
   switching and sign-out — no home in the mockup's account capsule —
   moved into its dropdown rather than disappearing.
3. **Overview** (`/dashboard`) — hero balance panel with the spend-
   of-income ring (+ v4's over-income arc), a new signed-scale
   savings-rate chart, a 12-month cash-flow chart with a y-axis
   instead of per-bar labels, a segmented spending-mix bar (donut
   dropped — not in this screen's design), and four bank-card-styled
   account tiles. Dropped the Greeting banner and the old Income/
   Spending KPI tiles — neither is in the approved design.
4. **Transactions** — single-select sign pills + three real native
   `<select>` filters (category/subcategory/account, spec is explicit
   about native selects over a themed popover) replacing the old
   multi-select Set-based `Filters.tsx`; 7-column day-grouped list
   (checkbox, hue-letter avatar, name+note, category tag, subcategory
   dot+text, account, amount). Month filtering and the sort toggle
   aren't in the design and were dropped; bulk-select/delete and the
   "≈€" foreign-currency line were kept since the design doesn't
   preclude them and they're real functionality.
5. **Categories** — accordion rows (whole row discloses subcategories
   in place, one open at a time, per the README's own state table)
   replace the old click-to-open-modal drill-down. `CategoryDetailModal`
   (rename/delete category, subcategory CRUD) survives as an edit-only
   modal, now reached by clicking the row's hue tile specifically
   (`stopPropagation`) since the spec's row has no room for a
   dedicated edit affordance.
6. **Trends** — rescoped from an unbounded multi-year scroll to one
   calendar year at a time via `?year=`, because the spec's own column
   math requires it ("eleven columns do not fit a ~860px pane"). Real
   year picker + CSV export added (the mockup's buttons imply both are
   functional, not decorative). Two-hue heat matrix measured against
   each row's own average, not month-over-month or category hue.
7. **Sweep** — Accounts, Forecast, Coach, Members, Import ported onto
   the new primitives with no bespoke layout changes, per the spec's
   own instruction that these screens should just inherit the system.
   This surfaced a real bug: several inline SVG/style props
   (`ForecastLine`, `Sparkline`, `MembersPanel`'s avatar gradient, the
   auth `BrandPanel`/`TheusMark`/`SocialButtons`) referenced
   `var(--accent)` / `var(--rule)` / `var(--font-inter)` directly —
   Chunk 1's Tailwind aliases only cover generated classes like
   `text-accent`, not raw `var()` in inline styles, so these were
   silently resolving to nothing. Fixed everywhere found, including
   auth screens (a correctness fix, not a redesign, so in scope even
   though auth isn't one of the swept screens). Deleted
   `CategoryDonut.tsx`, `Donut.tsx`, `TrendLineChart.tsx` — all three
   lost their only callers when Overview/Categories were rebuilt.
8. **Motion consistency** — `AccountsDistributionBar` and
   `PerCategoryOutlook`'s bars were the last bar-style elements not
   using the shared `.meter` widen-on-mount animation; added for
   consistency (no spec for these two, but same element, same motion).

Also fixed `lib/money.ts`: `fmtEUR`/`fmtUSD`/`fmtCurrency` put the
sign *inside* the currency symbol (`€−1,234.50`) — the v4 spec is
explicit that it must be outside (`−€1,234.50`) everywhere in the app.
Regression test updated to match.

**Known, deliberate deviations from the mockup** (all real app
constraints the static prototype's sample data doesn't hit):
account cards show currency instead of a fabricated last-4-digit
number (no such field in the schema); the "≈€" line survives on
foreign-currency transaction rows; bulk-select/delete and full
category CRUD survive.

**Verification:** no local build (no Node in this worktree) —
reviewed every changed file by hand; grepped the whole tree
repeatedly for stale Sterling token names (`border-rule`, `bg-bg-*`,
`bg-surface`, etc.) and for raw `var(--token)` references to since-
deleted CSS custom properties, both down to zero before each commit.
Pushed incrementally (one commit per numbered step above) so Vercel
built a preview after each one rather than one giant unreviewable
diff.

## Trips page (2026-09-19, same day)

The user handed over another design-handoff mockup (`Theus Trips.dc.html`
— same "dc" prototype format as the v4 rehaul's own handoff file, and
coincidentally already speaking v4's exact palette/type/glass system since
that's what's live on this branch) for a new screen: trips ranked by cost,
a subcategory breakdown per trip, a subcategory × trip heat matrix, and a
full side-by-side comparison table, all reacting to a "Compare by" toggle
(Total / Per day / Per person-day).

Before building, checked what trip-tagging already existed on this branch
(this same Chunk 20 work already added it — "Add trip tagging for
Travel-category transactions" / "Add bulk edit for selected transactions" /
"Add standalone bulk trip-tagging to bulk edit") rather than assuming the
mockup's own data model (a relational `trips` table with start/end dates
and a people count, which is what the mockup's static sample data
implies). The real shape is much lighter: `transactions.trip` is a
free-text label, valid only when `category` is exactly `'Travel'`
(`lib/transactions/constants.ts`), autocompleted from prior values, with
no `trips` table at all — a trip **is** just a name shared across
transactions. Built on top of that instead of introducing a second,
parallel trip concept:

- **Two small additions, not a redesign of the existing tagging:**
  - `subcategories.is_fixed_cost` (boolean, default false) — lets the
    user mark which Travel subcategories are "fixed" (booked before
    leaving — flights, lodging, fees) vs "daily" (spent on the ground)
    for the fixed/daily split. A toggle pill next to each subcategory row
    in `CategoryDetailModal.tsx`, shown only when the category is Travel
    (`setSubcategoryFixedCostAction`, optimistic with revert-on-failure
    like the modal's existing rename/delete flows).
  - `trip_details` (new table, one row per `(budget_id, trip)`) — the one
    fact a free-text tag can't hold: how many people went. Not an id-based
    `trips` table on purpose, since `trip` itself is the identity;
    `travelers` defaults to 1 when no row exists yet. A trip's date range
    and day count are **derived** from its own tagged transactions' dates
    (`lib/date.ts`'s new `daysBetweenInclusive`/`dateRangeDisplay`, both
    regression-tested), not stored — there was nowhere sensible to store
    "when the trip happened" that wouldn't drift from the transactions
    the page actually reads.
- **`lib/trips/summary.ts`** — `tripSummaries()`, a pure function mirroring
  `lib/categories/summary.ts`'s split (data-fetch vs compute): groups
  every Travel-category, trip-tagged **expense** into one `TripSummary`
  per trip (income/adjustments excluded, same reasoning as
  `categoriesSummary()` — CLAUDE.md §8a), with per-subcategory EUR totals,
  fixed/daily split, and per-day/per-person-day figures.
- **`lib/trips/view.ts`** — the "Compare by" metric (`total` / `perDay` /
  `perPersonDay`) as a small shared type + value/format/average helpers,
  used identically by every section so the hero, ranked list, matrix and
  table can never disagree about what a given metric means.
- **`app/(app)/trips/page.tsx`** — fetches every transaction via the
  existing `listTransactions()` (already paginates past the 1000-row cap,
  CLAUDE.md §8g — no new unbounded query written), the Travel category's
  own subcategories (for the fixed/daily flags), and `trip_details`; hands
  them to `tripSummaries()` and the result to a client component. Reads
  unfiltered rather than passing `category: 'Travel'` to `listTransactions`
  on purpose — that's an exact-string `.eq()` server-side, whereas
  `isTravelCategory()` (used inside `tripSummaries()`) is deliberately
  case/whitespace-tolerant like every other trip-tagging check in the app;
  filtering server-side by exact match risked silently missing real
  trip-tagged rows if `category` was ever stored with different casing —
  exactly the class of silent-wrong-number bug CLAUDE.md §8g already
  warns about. Empty state (no tagged transactions yet) explains how to
  get one.
- **`components/trips/*`** — `TripsClient` owns the metric + trip-focus
  selection state shared across sections (same interaction the mockup
  had: click a trip to dim every other row/segment/cell); `TripsHero`
  (grand total + KPI strip + metric picker + insight line), `TripsRanked`
  (bars + benchmark line), `TripsMix` (per-trip subcategory segments,
  its own Share-of-trip/Absolute toggle, legend), `TripsMatrix`
  (subcategory × trip heat table), `TripsTable` (full comparison table
  with a per-row "set travelers" affordance → `EditTravelersModal`).
  Colors come from the app's real `categoryColor()` hash (applied to
  subcategory names) instead of the mockup's own hardcoded per-subcategory
  palette, so a trip's colors agree with how that subcategory is colored
  everywhere else in the app.
- **Nav:** added `/trips` to `TopNav.tsx`'s real tab row (not behind
  "More") — same call already made for Accounts/Forecast in Chunk 20's
  own top-nav port, since the bar has room and this isn't a low-frequency
  screen.
- **Visual style:** the mockup's own liquid-glass look was kept as-is
  rather than adapted, per explicit user direction — moot in practice
  here, since it's the same system already live on every other v4 screen
  (same ground gradient, `.glass`/`.glass-tile` recipe, capsule controls,
  Plus Jakarta Sans), just componentized with the app's real primitives
  (`Card`-level `.glass` sections, `Icon`, `Modal`, `Field`) instead of
  the mockup's inline styles.

**Migration required** (given to the user to run in Supabase SQL Editor,
per CLAUDE.md §10 — not applied automatically):

```sql
alter table public.subcategories
  add column is_fixed_cost boolean not null default false;

create table public.trip_details (
  budget_id uuid not null references public.budgets(id) on delete cascade,
  trip text not null,
  travelers integer not null default 1 check (travelers > 0),
  created_at timestamptz not null default now(),
  primary key (budget_id, trip)
);

alter table public.trip_details enable row level security;

create policy "trip_details_all" on public.trip_details
  for all to authenticated
  using (public.is_budget_member(budget_id))
  with check (public.is_budget_member(budget_id));
```

**Verification:** no local build (no Node in this worktree) — reviewed
every new/changed file by hand; added regression tests for the two new
`lib/date.ts` functions (same file `test/lib/date.test.ts` already covers
per CLAUDE.md §8b) covering same-month/cross-month/cross-year ranges and
order-independence; traced every `TripSummary` field back to its
real-data source (no leftover mockup sample values); confirmed no other
`Subcategory`-shaped object literal in the codebase needed the new
`is_fixed_cost` field added by hand (`app/actions/import.ts`'s bulk
subcategory insert relies on the DB default, which is correct there).

**Two build-blocking follow-ups the same day:**

1. `react/no-unescaped-entities` failed the production build twice (a
   raw apostrophe in JSX text — once in `page.tsx`'s empty state, once
   in `TripsTable.tsx`'s subtitle, and then again in a footnote line
   added for #2 below). ESLint only flags apostrophes in literal JSX
   text children, not inside string literals — the fix each time was
   wrapping the sentence as a template-literal expression (`{`...`}`)
   instead of raw text. Local `npm run lint`/`npm run build` aren't
   available in this worktree (no Node), so this class of error only
   surfaces once Vercel actually runs the build — worth specifically
   grepping new JSX for apostrophes before pushing next time.

2. **User feedback: didn't understand how trip length was being
   calculated, and wanted to enter dates + traveler count explicitly
   rather than have both guessed/half-guessed.** The derived-date
   approach (`fromDate`/`toDate` = earliest/latest tagged transaction
   date) has a real flaw: a prepaid flight or hotel deposit tagged to
   the trip the moment it's booked — often weeks before departure —
   pulls `fromDate` back to the booking date, inflating the day count
   and skewing every per-day figure. Fixed by extending `trip_details`
   with **`start_date`/`end_date`** (nullable date columns): `/trips`
   now prefers those when both are set, and only falls back to the
   derived guess otherwise. `TripSummary` grew a `datesAreExplicit`
   flag so the UI can tell the two cases apart — `TripsTable` shows a
   `~` after any date range that's still a guess, with a footnote
   explaining it and pointing at the edit affordance.
   - `EditTravelersModal.tsx` → renamed **`EditTripModal.tsx`** and
     expanded from a single travelers field to Start date / End date /
     Travelers together, all upserted in one call
     (`setTripDetailsAction`, replacing `setTripTravelersAction`) —
     deliberately **not** a partial update: `start_date`/`end_date` are
     always included in the payload (even as `null`) so clearing a
     date field back to "estimate it" actually takes, instead of a
     partial upsert silently leaving the old override in place.
     Validates that both dates are set together (not just one) and
     that start ≤ end. Pre-fills the two date inputs with the current
     derived guess when no explicit override exists yet, so editing
     starts from something plausible rather than blank.

Migration for this follow-up:

```sql
alter table public.trip_details
  add column start_date date,
  add column end_date date;
```

**Verification:** no local build (same constraint as above) — reviewed
`lib/trips/summary.ts`'s merge logic by hand (explicit-both-set →
explicit dates; anything else → derived guess, matching
`setTripDetailsAction`'s own "both or neither" validation so the two
never disagree about what counts as "explicit"); re-grepped every new/
changed JSX file for raw apostrophes in text children before pushing,
having just been burned by that exact class of error twice.

## Trips: annotated-screenshot feedback round (2026-09-19, same day)

The user reviewed the live page and marked up screenshots directly.
Six changes, all in `components/trips/*` + `app/actions/trips.ts`:

1. **Dropped the aggregate "N days away" figure** everywhere it summed
   day-counts across unrelated trips (page header meta, the hero
   badge, the "Average per day" KPI tile's sub-line) — summed across 6
   separate trips scattered through the year, "56 days away" reads as
   a real countdown when it isn't one. Per-trip day counts (ranked
   list, matrix column headers, the table's Days column) are untouched
   — those are unambiguous. `dayCount`/`personDayCount` are still
   computed internally for the per-day/per-person-day KPI values,
   just not surfaced as their own label any more.
2. **Removed the click-to-focus/dim interaction** (`selected` state
   that dimmed every other row/segment/cell when you tapped a trip) —
   "no need for the on-click filter, leave hover, remove filtering."
   Dropped `selected`/`onSelect` from `TripsRanked`, `TripsMix`,
   `TripsMatrix`, `TripsTable`, and the state itself from
   `TripsClient`. Ranked-list rows went from `<button onClick>` to a
   plain `<div>` — they're not interactive any more, just hover-lifted
   for visual feedback (kept per explicit request). Also dropped "on
   the ground" from the ranked list's per-trip subline (redundant with
   the "$/day" figure right before it) and the row's "Tap a trip to
   hold it in focus" instruction line, now dead.
3. **New Trips-only subcategory palette**
   (`lib/trips/subcategoryColor.ts`) — `categoryColor()`'s app-wide
   seven-hue set has three blue-ish hues (indigo/sky/navy) that read
   near-identical at segment/swatch size; landing two of them adjacent
   in the same trip's bar made it hard to read. Same hash-by-name
   mechanism, a wider/more-spread eight-hue set, used only by
   `TripsMix`/`TripsMatrix` — `categoryColor()` itself is untouched,
   so nothing outside Trips changes color.
4. **Real hover tooltip on the mix chart's segments**, replacing the
   native `title` attribute ("add tooltip with design, not like it is
   right now"). CSS-only (`group/seg` + `group-hover/seg:opacity-100`,
   no JS hover state per segment) — a dark `bg-ink` pill above the
   segment with a small triangle, showing name/amount/percent. Needed
   dropping `overflow-hidden` from the segment track (it would've
   clipped a tooltip escaping upward) in favor of
   `first:rounded-l-[8px] last:rounded-r-[8px]` on the segments
   themselves for the same rounded-bar look.
5. **Trip rename**, added to the existing "edit trip" modal
   (`EditTripModal.tsx`, née `EditTravelersModal`) as a Trip name field
   above dates/travelers — "add ability to re-name them." New
   `renameTripAction` moves every transaction's `trip` text from old
   to new (same free-text-label mechanism as everywhere else); if the
   new name is an existing trip this merges the two, matching how
   `renameCategoryAction`/`reassignCategoryAction` already treat a
   category rename that lands on an existing name. The `trip_details`
   row (dates/travelers) tries to rename alongside it; on a merge
   collision (new name already has its own `trip_details` row) that
   update fails against the `(budget_id, trip)` primary key, so this
   trip's override is dropped rather than failing the whole rename —
   the merge target's own dates/travelers win, which is the only
   sane outcome once transactions from both trips are indistinguishable.
6. **Verdict column self-explains** — "how do you calculate average?"
   answered by adding the actual average value and the ±10% rule to
   the table's footnote instead of leaving it to ask about. Also
   pulled the "Compare by" metric picker out of the hero into its own
   sticky, centered `CompareByBar` — the metric it drives affects
   sections well below the fold (ranked list, matrix, table), so it
   now stays reachable while scrolled down instead of requiring a trip
   back to the top. `top-[92px]` is a hand-estimated clearance under
   TopNav's own sticky bar, not a measured value — worth eyeballing on
   the actual deploy.

**Verification:** no local build (no Node in this worktree) — reviewed
every changed file by hand; re-grepped all of `components/trips/` for
raw apostrophes in JSX text again (the build-breaking class from
earlier today); traced `TripsHero`'s KPI math after removing the
`sub` lines to confirm `dayCount`/`personDayCount` are still computed
from real per-trip data rather than left as dead variables.

## Trips: second annotated-screenshot round — sticky bug, average fix, colors, drill-down (2026-09-19, same day)

Another round of marked-up screenshots, this time on the actual deploy
(so real bugs, not just taste calls) — one of the six items below is a
real fix that turned out to affect the whole app, not just Trips.

1. **`CompareByBar` wasn't actually sticky** ("it needs to move with
   the scroll to the bottom of the page" — it just sat in place). Root
   cause: `app/globals.css`'s `.ambient-ground` (the app shell's outer
   wrapper, `app/(app)/layout.tsx`) had `overflow: hidden` on it, and
   per the CSS spec, **any** ancestor with overflow other than
   `visible` breaks `position: sticky` for every descendant —
   regardless of whether that ancestor's own content actually
   overflows. This almost certainly also breaks `TopNav`'s own sticky
   positioning app-wide, just unnoticed until a page needed a *second*
   sticky element far enough down the page to expose it. Checked
   whether `.ambient-ground`'s `overflow: hidden` was actually load-
   bearing (it clips the decorative blurred `.ambient-blob` elements)
   before touching it: it's redundant — `.ambient-layer`, the blobs'
   own direct parent (`position: absolute; inset: 0`), already has its
   own `overflow: hidden` that clips them (and their blur bleed)
   identically. Removed it from `.ambient-ground`; `CompareByBar`
   keeps `position: sticky` (no workaround needed once the real bug
   was gone). This is an app-wide CSS fix, not scoped to Trips —
   worth confirming TopNav itself now sticks correctly too on the next
   pass over any page.
2. **"Average" was day-weighted, not trip-weighted** ("average should
   come only from trips, not from daily"). `averageMetric()`
   (`lib/trips/view.ts`) used to compute `total spend ÷ total days` for
   the per-day metric — a rate that lets one very long or very short
   trip pull the "average" toward its own daily rate far more than its
   one-trip-out-of-N share, which reads as "the average trip" but
   actually means "the average day across all travel." Rewritten to
   the plain mean of each trip's own metric value (`Σ trip values ÷
   trip count`) — one trip, one data point, regardless of length.
   `TripsHero`'s KPI tiles and `TripsTable`'s verdict-column baseline
   now both call this same function instead of each hand-rolling their
   own (previously day-weighted) version, so hero, ranked-list
   benchmark line, and table verdict are guaranteed to agree.
3. **Rank-based subcategory colors, not hash-based**
   (`lib/trips/subcategoryColor.ts` rewritten). The hash-per-name
   approach from the last round still left it to chance whether two
   unrelated subcategory names' hashes landed on similar hues — real
   feedback on a real five-subcategory set: "why only two colors."
   `buildSubcategoryColorMap(trips)` now ranks every subcategory by
   total spend once and assigns a hand-ordered, warm/cool-alternating
   eight-hue palette by that rank — guaranteed-distinct instead of
   hash luck. Computed once in `TripsClient` and passed down as a
   `Map<string, string>` to `TripsMix`/`TripsMatrix` so a given
   subcategory is the same color everywhere on the page, not just
   within one component's own hash.
4. **`TripsRanked` re-scoped**: dropped the above/below-average bar
   coloring ("no need to color this based on spent more or less than
   average, as it's gonna be always split in the middle") in favor of
   one uniform gradient, and switched the sort from "by metric value"
   to "by date, newest first" — a value-based ranking that visually
   splits ~50/50 around the average line on every reasonable dataset
   wasn't telling you much the bar lengths didn't already show; date
   order at least reads as a timeline. The average benchmark tick mark
   and footer line are untouched.
5. **Equal-height "Trips ranked"/"What the money went on" row** — the
   two cards visibly mismatched height whenever Ranked had more/taller
   rows than Mix, leaving a dead gap under the shorter card. Grid
   switched from `items-start` to `items-stretch`; `TripsMix`'s legend
   row gets `mt-auto` so leftover height collects as intentional-
   looking space above the legend (anchored to the card's bottom edge)
   instead of a void below everything.
6. **`TripsMix` becomes a drill-down, not just a summary** ("the right
   menu should be more about digging into each trip" — confirmed:
   inline expand, not a separate view). Each trip row is now a button
   that expands an accordion (one open at a time, same pattern as the
   Categories page's row disclosure) listing every subcategory with
   its own color dot, transaction count, percent of trip, and amount.
   Needed a `count` field added to `TripSummary.bySubcategory`
   (`lib/trips/summary.ts`) — tracked alongside `amount` in the same
   aggregation pass, no new query. The segment hover tooltip from the
   previous round is preserved on the (now slightly restructured)
   bar segments.

**Migration:** none — no schema changes this round.

**Verification:** no local build (no Node in this worktree) — reviewed
every changed file by hand; specifically checked the `TripsMix` row
button doesn't nest an interactive `<button>` inside another `<button>`
(an earlier draft did, via `IconButton` for the disclosure chevron —
swapped for a plain `Icon` in a non-interactive `<span>` since the row
button already owns the click); re-grepped `components/trips/` for raw
apostrophes in JSX text again; traced `averageMetric`'s new definition
against the 'total' case specifically to confirm it's unchanged
(`Σ totals ÷ count` was already un-weighted, so only perDay/
perPersonDay actually change behavior).
