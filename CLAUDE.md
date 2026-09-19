# Theus — Project Handover

This document is the entry point for any agent picking up the project. Read
this first, then `docs/rehaul-progress.md` (running log) and
`docs/rehaul-plan.md` (architectural decisions).

---

## 1. Project in one paragraph

Theus (formerly "Ledger") is a personal budget tracker that the user
(bananapie322@gmail.com) is building to replace a Google Sheets-based
tracker. It's deployed on Vercel and backed by Supabase for auth + data.
The user wants it to eventually support shared/collaborative budgets
(partner + possibly others). Design direction: **Sterling structural
language dressed in Theus identity** — deep forest green background, brass
accent, sage / rust semantic colors, Inter + Instrument Serif. See
`docs/rehaul-plan.md` §5 for the full token reference.

---

## 2. Where everything lives

**Frontend (active):**
- Next.js 15 + React 19 + TypeScript app at the repo root
- **GitHub repo:** the user's private repo, `NKozlovv/PBudget`
- **Production:** `master` branch → https://p-budget.vercel.app — **is
  the Next.js Theus app as of 2026-09-15.** The user explicitly ordered
  the cutover ("push everything to master and let's make the new theus
  our main page, not what was the old one"). This was a clean fast-
  forward (master's old tip, `cd6e2bf`, was a direct ancestor of the
  rehaul history — the rehaul had branched off it at Chunk 0), so
  nothing was lost or overwritten.
- Three now-superseded branches exist on the remote, frozen at whatever
  they last had: `experimental/theus-rehaul` (stale, stuck at Chunk
  13), `experimental/theus-sterling-1to1` (Chunks 12–18), and
  `claude/budget-app-features-fa62f0` (frozen 2026-09-15 — was kept in
  sync with `master` push-for-push right after the cutover out of
  habit; the user pointed out that's pointless once `master` **is**
  the working branch, so it stopped). None has any commit that isn't
  already on `master`. Not deleted — ask the user before cleaning them
  up.
- **Push only to `master`** going forward — there's no reason to
  double-push to a second branch now that `master` is both working
  branch and production (see §10).
- **Preview:** Vercel deploys a preview for any other branch pushed to
  the repo, if you deliberately want one for a risky change (see §10)
  — that's how Chunks 0–19 were checked before the cutover.

**Frontend (legacy):**
- Single-file `public/legacy/index.html` (~2,900 lines, ~100 KB), served
  at `/legacy` from the new app via Next.js rewrite. Frozen at v1.0.1.
  Still reachable at https://p-budget.vercel.app/legacy — the cutover
  only changed what's at `/`, nothing was deleted.

**Backend (Supabase):**
- **Project URL:** `https://udcfjiuybkugbydlaltk.supabase.co`
- **Publishable key (safe to expose):** `sb_publishable_-GYV876glbqSw-JJt4knfg_Ks9PTj8z`
- Both values live in Vercel env (`NEXT_PUBLIC_SUPABASE_URL` and
  `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`) and in `.env.local` for dev.
  `.env.example` is the template.

**Auth URL config in Supabase:**
- Site URL: `https://p-budget.vercel.app`
- Redirect URL allowed: `https://p-budget.vercel.app/**`

---

## 3. Tech stack

- **Framework:** Next.js 15 (App Router), React 19, TypeScript (strict,
  `noUncheckedIndexedAccess`).
- **Styling:** Tailwind v3 with semantic CSS-variable tokens
  (`styles/tokens.css`). Inter for everything (including mono-style
  labels — the `font-mono` Tailwind class resolves to Inter, not an
  actual monospace face; see §6) + Instrument Serif italic for brand
  moments only.
- **Auth + data:** Supabase via `@supabase/ssr` (browser client + server
  client + middleware-cookie refresh). Server components run direct
  queries via `lib/data/*`; mutations go through `app/actions/*` server
  actions.
- **Charts:** inline SVG, no library. Modeled after the design refs in
  `design-refs/`.
- **Forms:** vanilla `useState` + server actions (no react-hook-form).
- **Tests:** Vitest, Node env. Regression-critical only —
  `lib/date.ts`, `lib/money.ts`, `lib/xlsx/classify.ts`.
- **XLSX:** SheetJS `xlsx` via the official CDN tarball (npm-registry
  version is far behind).
- **FX:** Frankfurter API with server-side cache (`lib/fx.ts`).

---

## 4. Supabase schema (unchanged across the rehaul)

### Tables

- **`budgets`** — workspace (id, name, owner_id, fx_rate, base_currency, created_at)
- **`budget_members`** — who has access to which budget (budget_id, user_id, role)
- **`budget_invites`** — pending invites by email (id, budget_id, email, invited_by, created_at)
- **`accounts`** — per budget (id, budget_id, name, currency, opening_balance, sort_order)
- **`categories`** — per budget, kind ∈ {'expense', 'income'}
- **`subcategories`** — per category. Also **`is_fixed_cost`** (boolean, default false, added 2026-09-19) — Trips page cost-type split (see below); only meaningful for subcategories under the Travel category, set via a toggle in that category's drill-down modal.
- **`transactions`** — per budget (date, type ∈ {'expense','income','adjustment'}, amount, currency, **fx_rate**, category (text), subcategory (text), **trip** (text, nullable), account_id, comment, created_by, created_at, updated_at)
  - `fx_rate` column was added later via ALTER TABLE. It stores the USD→EUR rate in effect on the transaction's date. Null for EUR tx.
  - `trip` was added in the v4 rehaul (branch `claude/design-handoff-implementation-724101`, "Add trip tagging for Travel-category transactions"). Free-text trip label, only ever set when `category` is exactly `'Travel'` (`lib/transactions/constants.ts`'s `TRAVEL_CATEGORY`/`isTravelCategory`/`enforceTripRule` — every write path that touches `category` nulls `trip` out if the new category isn't Travel). There is no `trips` table; a trip **is** just this text value shared across transactions, autocompleted from prior values (`TripField.tsx`).
- **`trip_details`** — added 2026-09-19 for the Trips page (`/trips`). One row per (budget_id, trip) — `travelers` (integer, default 1) is the only field, since a trip's date range/day count is derived from its own tagged transactions' dates, not stored. PK is `(budget_id, trip)` rather than an id, matching `trip`'s own name-not-id identity above.

### RLS policies

All tables have RLS enabled. The policies are scoped to the `authenticated` role. The current (working) policy set was established after debugging — earlier iterations failed, so be careful not to regress. Here's the correct setup:

- **`budgets`** — select if you're a member; insert requires `owner_id = auth.uid()`; update/delete requires you're the owner
- **`budget_members`** — select if you're a member; insert requires you're adding yourself OR you own the budget; delete same rule
- **`budget_invites`** — owner of budget manages, or you see invites to your own email
- **`accounts`, `categories`, `subcategories`, `transactions`, `trip_details`** — "for all" policies gated on `public.is_budget_member(budget_id)`

### Helper function (already in DB)

```sql
create or replace function public.is_budget_member(b uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists(
    select 1 from public.budget_members
    where budget_id = b and user_id = auth.uid()
  );
$$;
```

### Triggers (already in DB)

- `trg_add_owner_as_member` on `budgets` — when a budget is created, the owner is auto-added to `budget_members` with role='owner'
- `trg_accept_pending_invites` on `auth.users` — when a new user signs up, any pending invites matching their email are auto-accepted

---

## 5. Pre-rehaul snapshot (frozen at v1.0.1)

The legacy single-file `index.html` is kept at `public/legacy/index.html`
and served at `/legacy`. **Use it for visual diffs and parity checks**;
do not treat it as the source of truth for the new architecture.

What it had end-to-end:
- Login / signup / password reset via Supabase Auth
- XLSX import with FX backfill
- Add / edit / delete transactions / accounts / categories / subcategories
- Five views: Dashboard / Transactions / Accounts / Categories / Forecast
- Version marker bottom-right (v1.0.1 — capitalize Adjustment type badge)

---

## 5b. Post-rehaul (Theus, v2.0.0-α)

Active at the new app's `/`. Routes under `app/(app)/`:

- `/dashboard` — hero balance, KPI strip (Income/Spend/Net MTD), Income vs
  Spend bars, category donut, recent tx
- `/transactions` — full table with filters
  (search/month/type/account/category/subcategory), URL-driven sortable
  headers, inline edit per cell, bulk select + delete
- `/accounts` — trajectory chart + distribution donut + accounts table
  with full CRUD
- `/categories` — expense + income panels with subcategories, per-row
  this-month + YTD totals, full CRUD
- `/trends` — spend by category & subcategory, one column per month,
  cells color-coded by month-over-month change (±10% dead zone)
- `/forecast` — projected EOY balance, YTD averages, forecast bars
  (actual + projected), per-category burn-rate tables
- `/import` — XLSX bulk import with FX preflight (drag-drop)
- `/trips` — added 2026-09-19. Trips ranked, subcategory mix, a
  subcategory × trip matrix, and a full side-by-side table, all driven
  by a "Compare by" toggle (Total / Per day / Per person-day). Reads
  Travel-category transactions carrying a `trip` tag (see §4) — no
  route exists without at least one tagged transaction. See this
  file's Trips entry in `docs/rehaul-progress.md` for the full build
  log; unlike the rest of this section it was built directly against
  v4 (`components/trips/*`, `lib/trips/*`), not ported from Sterling.

Plus auth routes under `app/(auth)/` (login / signup / reset) on a
split-screen Sterling-style layout, and `/styleguide` for the dev-only
token + primitives reference.

The sidebar shows the build version (`v2.0.0-α`) at the bottom — visual
confirmation a deploy is live.

---

## 6. Design direction (current)

> **⚠ Superseded 2026-09-17.** Everything below this note describes the
> Sterling navy dark theme, which the v4 "liquid glass" rehaul has now
> replaced app-wide: light ambient ground, frosted-glass panels, one
> type family (Plus Jakarta Sans), capsule controls, a fixed six-hue
> category map, a top nav instead of a sidebar. Source of truth:
> `design_handoff_theus_rehaul/README.md` + `Theus Rehaul v4.dc.html`
> (the approved prototype) and `docs/rehaul-progress.md`'s **Chunk 20**
> entry (full landing log, branch `claude/design-handoff-implementation-724101`).
> This section, §5b, and the component lists in §9 still describe
> Sterling and haven't been rewritten for v4 yet — treat them as
> historical context for *why* things are shaped the way they are, not
> as the current palette/token names.

**Sterling 1:1, palette TBD.** The structural language now matches the
Sterling references in `design-refs/src/*.jsx` cell-for-cell across
Dashboard / Transactions / Accounts / Categories / Forecast / Coach /
Auth. Palette tokens (the deep-green / brass / sage / rust set) live in
`styles/tokens.css` and are still the working theme, but treat them as
**provisional** — the user may swap palettes once structure is locked.

Notes:
- **JetBrains Mono is dropped again (2026-09) — third and hopefully
  final reversal.** Direct user feedback: "replace this idiotic
  typewriter font." `app/layout.tsx` no longer loads JetBrains Mono;
  `tailwind.config.ts`'s `mono` family now points at `var(--font-inter)`
  instead of `var(--font-mono)`. This means every existing `font-mono`
  class and every `Mono`/`Num` component usage kept working with **zero
  per-component edits** — same trick as Chunk 6. If a future agent (or
  the user) wants monospace back, do NOT re-add a `JetBrains_Mono`
  loader and hope it sticks — ask first, this has flip-flopped twice
  already. Two inline SVG chart labels
  (`components/accounts/AccountMiniChart.tsx`,
  `components/charts/ForecastLine.tsx`) had a literal
  `fontFamily="var(--font-mono)"` and were switched to
  `var(--font-inter)` directly since they don't go through Tailwind.
- **Icon component** (`components/ui/Icon.tsx`) — monoline stroke icon
  set ported from `design-refs/src/icons.jsx`, plus the `logo-google`
  and `logo-apple` brand glyphs used by the auth SSO row.
- **Topbar** — full-width header on each protected page (search,
  period toggle, "+ Add" CTA) per the Sterling shell. Sidebar still
  shows the build version at the bottom.
- Cards `rounded-2xl` (16 px) / `rounded-[14px]` (Sterling panels),
  buttons `rounded-[10px]`, pills `rounded-full`.
- Italic Instrument Serif is reserved for the brand tagline ("money
  understood.") — auth brand panel + dashboard hero only.

The earlier "Modern Soft" direction in the legacy CLAUDE.md is
**superseded**. Same goes for the v0.5.3 roadmap (Builds 2–5) — see
`docs/rehaul-plan.md` for the chunk plan and `docs/rehaul-progress.md`
for what's landed.

---

## 7. Roadmap

The chunk plan lives in `docs/rehaul-plan.md` §7 and the running log is
`docs/rehaul-progress.md`.

Status as of last update (2026-09-15):
- ✅ Chunks 0–13: bootstrap → multi-budget UI → member invitations
- ✅ Chunk 12 (Sterling foundations) + Chunks 14–18: Sterling 1:1
  structural rebuild of every page, on `experimental/theus-sterling-1to1`
- ✅ Chunk 19: bug-fix/feature-request batch (subcategory picker,
  global add-transaction shortcut, `/trends` page, last-completed-month
  default, JBM→Inter, etc.) — see `docs/rehaul-progress.md`
- ✅ **Production cutover**: `master` fast-forwarded to the full
  Next.js app; the old static site lives on at `/legacy` — see §2
- 🚫 Out of scope (still, per plan §4): light mode, mobile-optimized
  layout, per-category color editor, Coach's real insight engine
  (currently a stub), forecast scenarios/goals
- 🟡 Open: two user-reported bugs ("income importing as expense",
  "spending-by-category numbers wrong") investigated but not
  reproduced from code alone — see Chunk 19 entry in
  `docs/rehaul-progress.md` for what was checked and what's needed to
  pin it down

---

## 8. Bugs we fixed along the way (don't reintroduce)

Critical gotchas discovered during development. Keep these in mind:

### 8a. "Account adjustment" classification

In the user's xlsx, rows in the **expense block** with category = "Account adjustment" are actually **transfers / refunds, not real expenses**. If imported naively as `type: 'expense'`, they inflate expense totals (was inflating by €13,632 in test data).

**Correct behavior:** On import, any row (expense block OR income block) where category = "Account adjustment" must be stored as `type: 'adjustment'`. For rows from the expense block, amount should be **negative** (money left the account). The aggregation code already excludes adjustments from expense/income totals while still applying them to account balances.

Regression coverage: `test/lib/xlsx/classify.test.ts`.

### 8b. Timezone off-by-one on dates

`new Date('2026-01-01')` parses as UTC midnight. For users east of UTC (user is in Germany UTC+1/2), calling `.getFullYear()` or `.getMonth()` returns the **previous day's** values. And `.toISOString().slice(0, 10)` shifts local midnight backwards a day.

**Fix applied:** Custom date helpers that parse YYYY-MM-DD strings literally (regex extract year/month/day) and format Date objects using `.getFullYear()` / `.getMonth() + 1` / `.getDate()` with local zero-padding. See `lib/date.ts`.

**Symptoms if broken:** Jan 1st transactions disappear (filed as Dec 31 previous year). All dates shift one day back. Month totals off.

Regression coverage: `test/lib/date.test.ts`.

### 8c. Supabase RLS with new `sb_publishable_` keys

The user is on the new API key system (not legacy anon/service_role). Early RLS policies failed inexplicably. The working config:
- Policies scoped to `to authenticated` explicitly
- `set search_path = public` on SECURITY DEFINER functions
- Trigger `trg_add_owner_as_member` is SECURITY DEFINER (bypasses RLS to insert membership)
- After a fresh install of the app, users need a hard refresh (Cmd+Shift+R) after the RLS SQL runs to clear stale Supabase client state

### 8d. Parser silent drops

Early parser used `XLSX.utils.sheet_to_json({header:1})` which has edge cases with blank leading rows. **Current parser** (`lib/xlsx/parse.ts`) iterates cells directly via `ws[XLSX.utils.encode_cell({r, c})]` and is defensive against null/undefined. Don't revert.

### 8e. USD opening balances

For USD-denominated accounts (e.g. "Deel, $"), store opening balance in **native USD** (not pre-converted to EUR). EUR conversions happen at display time using either the stored per-tx `fx_rate` or the budget's live `fxRate`. The Accounts Balance sheet has separate `€` (col C) and `$` (col D) columns — read `$` for USD accounts, `€` for EUR accounts.

### 8f. "This month" means the last completed month (2026-09 decision)

The user fills in the budget at month-end, reviewing the month that just
ended — not the in-progress one. So on **Dashboard** and **Categories**,
every "this month" calculation (KPIs, spending mix, category YTD-avg,
the Greeting insight line) is anchored to `workingMonth(now)`
(`lib/dashboard/period.ts`) — last calendar month, not `now`'s month —
and `/trends` uses the same anchor for its rightmost column.

**Exception:** account balances (hero tile, sparkline, accounts page)
stay anchored to the true current date — a balance is a real-time
number, not a monthly summary. Don't route balance code through
`workingMonth`.

**Forecast** was deliberately left alone (it already has its own
horizon toggle and is forward-looking, not a "this month" view).

### 8g. Unbounded Supabase selects silently truncate at ~1000 rows (2026-09)

**This one produced wrong financial numbers with no error anywhere** — an
account's displayed balance quietly stopped reflecting its real
transaction history. Root cause: PostgREST caps any `select()` with no
explicit `.range()`/`.limit()` at a server-side default (`db-max-rows`,
1000 unless the Supabase project changed it). Every "give me every
transaction in this budget" call (`listTransactions({ budgetId })` with
no `limit` — Dashboard, Accounts, Categories, Forecast, Trends all call
it exactly this way) was written assuming that returns everything. Once
a budget passed 1000 total transactions, it silently came back
truncated — ordered by `date desc`, so the **oldest** transactions were
the ones dropped — and every balance/total computed from that array
was wrong, with no error, no warning, nothing to indicate the array
was incomplete.

**Fix applied:** `lib/data/transactions.ts`'s `listTransactions()` (and
`listCategorySubcategoryPairs()`) now page through explicitly when no
`limit` is requested, using an exact row count fetched via
`{ count: 'exact' }` on the first page so the loop terminates on
"collected that many rows," not on "a page came back shorter than
asked for" (the latter would itself be silently wrong if this
project's real per-request cap is below the 1000-row page size used
here — a short page would look identical to "no more data"). Pages
beyond the first fetch in parallel once the total is known — see the
functions' own doc comments for the full reasoning. (A third function,
`listMonthsWithTransactions()`, used to page the same way but was
removed in the Transactions-page rewrite that made filtering
client-side — see §5b's Transactions entry — since the full
transaction list is already in the browser at that point and months
are just derived from it.)

**If you add a new place that needs every transaction in a budget:**
use `listTransactions({ budgetId })` (no `limit`) — don't write a fresh
`supabase.from('transactions').select('*').eq('budget_id', …)` inline
anywhere, even in a `'use server'` action. `app/actions/transactionFormData.ts`
currently still has one small unbounded read (the category/subcategory
pairs query, for the "most used subcategory" suggestion) — low-stakes
since it only affects a suggestion, not a displayed total, but worth
routing through the paginated helper if it's ever touched again.

**Symptom to watch for:** any total, balance, or average that looks
"stuck" or lower than it should be, especially for data reaching back
further than a few hundred transactions. Regression coverage: none yet
(would need a >1000-row fixture) — this was caught from a user-reported
discrepancy on the Accounts page, not a test.

---

## 9. Code architecture

```
app/
  (auth)/             # login, signup, reset (split-screen Sterling layout)
  (app)/              # dashboard, transactions, accounts, categories,
                      # forecast, import — all gated by middleware + layout
  actions/            # 'use server' mutations
  styleguide/         # dev-only token + primitives reference

components/
  ui/                 # primitives (Card, Button, Pill, Input, Field, Mono,
                      # Num, Modal, Select, KpiTile)
  nav/                # Sidebar, NavItem, UserCard, PageHeader, Stub
  auth/               # SignInForm, SignUpForm, ResetForm, BrandPanel,
                      # AuthHeader, TheusMark
  transactions/       # Filters, TransactionsTable, TransactionForm,
                      # DayGroupedList, BulkActionBar,
                      # GlobalAddTransactionModal (mounted in the app
                      # shell — "N" keyboard shortcut + Topbar "+ New")
  accounts/           # AccountsGrid, AccountCard, AccountForm
  categories/         # CategoriesClient, CategoryRow, CategoryDetailModal,
                      # NameForm
  trends/             # TrendTable — /trends month-over-month breakdown
  charts/             # IncomeSpendBars, CategoryDonut, Donut,
                      # ForecastLine, Sparkline
  forecast/           # BurnRateTable
  import/             # ImportDropzone
  trips/              # added 2026-09-19 — TripsClient, TripsHero,
                      # TripsRanked, TripsMix, TripsMatrix, TripsTable,
                      # EditTravelersModal (/trips)

lib/
  supabase/           # client (browser), server (RSC), middleware
                      # (cookie refresh), types
  data/               # read-only repos: budgets, accounts, categories,
                      # transactions, trips (trip_details only — trip
                      # aggregation itself is lib/trips/summary.ts,
                      # computed from listTransactions())
  trips/              # summary (per-trip aggregation from Travel-
                      # category, trip-tagged transactions), view
                      # (metric picker helpers — /trips)
  xlsx/               # parse, classify, dates
  categories/         # summary (Categories page), formOptions
                      # (subcategory dropdown + most-used auto-pick),
                      # monthlyTrend (/trends)
  accounts/           # defaultAccount (Cash EUR pick for Add-transaction)
  dashboard/          # period (incl. workingMonth — see §8f), categoryIcon
  date.ts, money.ts, balance.ts, categoryColor.ts, fx.ts, env.ts,
  utils.ts, version.ts

styles/               # tokens.css (single source of palette truth)
test/lib/             # date.test.ts, money.test.ts, xlsx/classify.test.ts
design-refs/          # reference-only — never imported into prod
public/legacy/        # the v1.0.1 single-file app, served at /legacy
docs/                 # rehaul-plan.md, rehaul-progress.md,
                      # security-review.md, claude-md-proposal.md
```

**Data-flow rules:**
- Components never import `@supabase/supabase-js` directly.
- Reads → `lib/data/*` (server-only) called from server components.
- Writes → `app/actions/*` server actions.
- Active session is refreshed by `middleware.ts` on every protected
  request; protected layouts re-check defense-in-depth.

### Version marker

**Removed 2026-09-19.** The `BUILD_VERSION · BUILD_DATE` footer that used
to sit at the bottom of every page's content area is gone — direct
feedback was that it read as unfinished/rudimentary once the app was past
the stale-cache-confusion phase that motivated adding it in the first
place (§11 below still says the user considered it "very important,"
which was true earlier in the project but is now superseded by this).
`lib/version.ts` itself is untouched (still exports `BUILD_VERSION`/
`BUILD_DATE`) in case it's wanted again somewhere less prominent, but
nothing in the app renders it — don't re-add the footer without asking
first, the same way the JetBrains Mono flip-flops taught us to check
before reintroducing something that's been deliberately removed.

---

## 10. Development workflow

### Deploy flow

**Since the 2026-09-15 cutover, `master` is both the working branch and
production** — there's no separate `experimental/theus-rehaul` staging
step anymore (see §2). This means every push to `master` deploys
straight to https://p-budget.vercel.app for real. Two ways to work
safely:
- For a small, well-understood change: commit and push directly to
  `master` (`git add . && git commit -m "..." && git push`), same as
  every chunk before it — just know it's live in ~30s this time, not a
  preview.
- For anything larger or riskier: push to a feature/session branch
  first, let Vercel build its own preview URL, confirm it works, *then*
  merge/push to `master`. This project doesn't currently enforce PRs or
  branch protection on `master` — that's a deliberate simplicity
  tradeoff, not an oversight, but it means nothing stops a bad push
  from going live immediately. If the user wants that changed
  (required PR review, a protected branch, etc.), it hasn't been asked
  for yet.
- User checks the deploy; the sidebar version marker confirms the
  new build is live

### Local checks

```
npm run typecheck   # strict TS
npm run lint        # ESLint (next/core-web-vitals + next/typescript)
npm test            # Vitest regression suite
npm run build       # full production build
```

### Don't forget

- Don't break `master`. It **is** the Next.js Theus app now (the
  legacy app moved to `/legacy` in the 2026-09-15 cutover — see §2) and
  it deploys live on every push, so treat any push to it with the care
  that implies. Node isn't available in most agent worktrees for this
  project (see "Local checks" above) — when in doubt about a risky
  change, push to a side branch and check the Vercel preview first.
- Never use `localStorage` / `sessionStorage` — everything is Supabase.
- Keep the publishable key in `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`,
  not in source.
- When adding new Supabase tables, write the migration SQL in chat so
  the user can run it in Supabase SQL Editor.

---

## 11. User preferences and working style

- Prefers incremental builds, each producing a working deployable file,
  over big-bang rewrites
- Wanted a version marker early on so they'd know the new build was live
  (they'd been burned by stale caches) — since superseded: had it removed
  2026-09-19 as looking rudimentary once that was no longer a live
  concern (see §9's "Version marker" note)
- Is in Germany (UTC+1/2) — timezone-correct code matters
- Uses EUR as base currency, has USD accounts (Deel, Wise, Cash, etc.)
- Has a partner they'll eventually share the budget with (Phase 5)
- Tolerant of back-and-forth debugging; wants honest explanations when
  things break
- Prefers structured updates: what changed, what to test, what's
  deferred
- Has a Claude Pro subscription; not on Max

---

## 12. First actions for any future agent

1. Read `docs/rehaul-progress.md` — running log of every chunk, what
   landed, what was skipped, and why. Most important file in the project.
2. Skim `docs/rehaul-plan.md` for the original architecture decisions
   and chunk numbering.
3. There's no on-page version marker any more (removed 2026-09-19, see
   §9) — check `git log` on `master` for the latest commit instead of
   looking for a build string on the live site.
4. The legacy app is still at `/legacy` — useful for visual diffs and
   parity checks. Not the source of truth anymore.
5. `master` **is** production and there's no separate staging branch as
   of the 2026-09-15 cutover — see §2 and §10. Push carefully; prefer a
   side branch + Vercel preview for anything non-trivial.
6. When in doubt about scope or design, ask. The user has corrected
   typography and geometry mistakes mid-chunk; they prefer the
   correction over the polish.

---

## 13. Supabase setup SQL (for reference — already applied)

If the schema ever needs rebuilding from scratch, the consolidated working setup is:

```sql
-- Tables (budgets, budget_members, budget_invites, accounts, categories, subcategories, transactions)
-- See the conversation history for full table DDL. Transactions has an fx_rate numeric column.

-- Helper function
create or replace function public.is_budget_member(b uuid)
returns boolean language sql security definer stable
set search_path = public
as $$
  select exists(select 1 from public.budget_members where budget_id = b and user_id = auth.uid());
$$;

grant execute on function public.is_budget_member(uuid) to authenticated, anon;

-- Enable RLS on all tables
alter table public.budgets enable row level security;
-- ... (repeat for all 7 tables)

-- Policies — all scoped to `authenticated` role, gated via is_budget_member()
-- See conversation history for full policy DDL.

-- Owner-as-member trigger
create or replace function public.add_owner_as_member()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.budget_members (budget_id, user_id, role)
  values (new.id, new.owner_id, 'owner') on conflict do nothing;
  return new;
end;
$$;

create trigger trg_add_owner_as_member
after insert on public.budgets for each row
execute function public.add_owner_as_member();

-- Accept-pending-invites trigger on auth.users signup
create or replace function public.accept_pending_invites()
returns trigger language plpgsql security definer as $$
begin
  insert into public.budget_members (budget_id, user_id, role)
  select budget_id, new.id, 'member'
  from public.budget_invites where lower(email) = lower(new.email)
  on conflict do nothing;
  delete from public.budget_invites where lower(email) = lower(new.email);
  return new;
end;
$$;

create trigger trg_accept_pending_invites
after insert on auth.users for each row
execute function public.accept_pending_invites();
```

---

## End of handover

Read `docs/rehaul-progress.md` for the latest state. Confirm with the
user what to build next, follow the Sterling × Theus design direction
for all visual work, and don't break `master`.
