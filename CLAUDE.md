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
- **GitHub repo:** the user has a private repo with the project on the
  `experimental/theus-rehaul` branch (still side-by-side with `master`)
- **Production:** `master` branch → https://p-budget.vercel.app (legacy
  app at `index.html`, until the user explicitly merges)
- **Preview:** every push to `experimental/theus-rehaul` → unique Vercel
  preview URL

**Frontend (legacy):**
- Single-file `public/legacy/index.html` (~2,900 lines, ~100 KB), served
  at `/legacy` from the new app via Next.js rewrite. Frozen at v1.0.1.
  Kept reachable indefinitely per user's side-by-side decision.

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
  (`styles/tokens.css`). Inter + JetBrains Mono (mono labels and
  numerics) + Instrument Serif italic for brand moments only.
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
- **`subcategories`** — per category
- **`transactions`** — per budget (date, type ∈ {'expense','income','adjustment'}, amount, currency, **fx_rate**, category (text), subcategory (text), account_id, comment, created_by, created_at, updated_at)
  - `fx_rate` column was added later via ALTER TABLE. It stores the USD→EUR rate in effect on the transaction's date. Null for EUR tx.

### RLS policies

All tables have RLS enabled. The policies are scoped to the `authenticated` role. The current (working) policy set was established after debugging — earlier iterations failed, so be careful not to regress. Here's the correct setup:

- **`budgets`** — select if you're a member; insert requires `owner_id = auth.uid()`; update/delete requires you're the owner
- **`budget_members`** — select if you're a member; insert requires you're adding yourself OR you own the budget; delete same rule
- **`budget_invites`** — owner of budget manages, or you see invites to your own email
- **`accounts`, `categories`, `subcategories`, `transactions`** — "for all" policies gated on `public.is_budget_member(budget_id)`

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
- `/forecast` — projected EOY balance, YTD averages, forecast bars
  (actual + projected), per-category burn-rate tables
- `/import` — XLSX bulk import with FX preflight (drag-drop)

Plus auth routes under `app/(auth)/` (login / signup / reset) on a
split-screen Sterling-style layout, and `/styleguide` for the dev-only
token + primitives reference.

The sidebar shows the build version (`v2.0.0-α`) at the bottom — visual
confirmation a deploy is live.

---

## 6. Design direction (current)

**Sterling 1:1, palette TBD.** The structural language now matches the
Sterling references in `design-refs/src/*.jsx` cell-for-cell across
Dashboard / Transactions / Accounts / Categories / Forecast / Coach /
Auth. Palette tokens (the deep-green / brass / sage / rust set) live in
`styles/tokens.css` and are still the working theme, but treat them as
**provisional** — the user may swap palettes once structure is locked.

Notes:
- **JetBrains Mono is back.** Mono uppercase tracked labels (kickers,
  KPI labels, footers, divider text, mono-numeric values where the ref
  uses mono) render in JBM via `font-mono` (configured in
  `app/layout.tsx` + `tailwind.config.ts`). Earlier rehaul iterations
  dropped JBM in favour of Inter; that decision is reversed.
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

Status as of last update:
- ✅ Chunks 0–11: bootstrap → cutover-ready
- 🟡 Chunk 12: Multi-budget UI (next)
- 🟡 Chunk 13: Member invitations + tightened server hardening
- 🚫 Out of scope: light mode, mobile, coach view, per-category color
  editor, drill-down modal

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
                      # EditableCell, SortableHeader, BulkActionBar
  accounts/           # AccountsTable, AccountForm
  categories/         # CategoriesPanel, NameForm
  charts/             # IncomeSpendBars, CategoryDonut, Donut,
                      # AccountsTrajectory, ForecastBars, Sparkline
  forecast/           # BurnRateTable
  import/             # ImportDropzone

lib/
  supabase/           # client (browser), server (RSC), middleware
                      # (cookie refresh), types
  data/               # read-only repos: budgets, accounts, categories,
                      # transactions
  xlsx/               # parse, classify, dates
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

Sidebar bottom shows `BUILD_VERSION · BUILD_DATE` from `lib/version.ts`.
Bump on every meaningful deploy so the user knows the new build is live.
Current: `v2.0.0-α — Theus rehaul, feature parity reached`.

---

## 10. Development workflow

### Deploy flow

- Edit code locally on `experimental/theus-rehaul`
- `git add . && git commit -m "..." && git push`
- Vercel auto-deploys in ~30 seconds (preview URL for the experimental
  branch; production URL only on `master`)
- User checks the preview URL; the sidebar version marker confirms the
  new build is live

### Local checks

```
npm run typecheck   # strict TS
npm run lint        # ESLint (next/core-web-vitals + next/typescript)
npm test            # Vitest regression suite
npm run build       # full production build
```

### Don't forget

- Don't break `master`. The legacy app at `master` is currently
  production. The rehaul lives on `experimental/theus-rehaul` until the
  user explicitly merges (and even then, side-by-side per their decision).
- Never use `localStorage` / `sessionStorage` — everything is Supabase.
- Keep the publishable key in `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`,
  not in source.
- When adding new Supabase tables, write the migration SQL in chat so
  the user can run it in Supabase SQL Editor.

---

## 11. User preferences and working style

- Prefers incremental builds, each producing a working deployable file,
  over big-bang rewrites
- Wants a version marker so they know the new build is live (very
  important — they've been burned by stale caches)
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
3. Check the sidebar version marker on the live preview (`v2.0.0-α` or
   newer) so you know which build you're looking at.
4. The legacy app is still at `/legacy` — useful for visual diffs and
   parity checks. Not the source of truth anymore.
5. Don't break `master`. Treat it as production. Every change goes via
   `experimental/theus-rehaul` (current rehaul branch) until the user
   explicitly merges.
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
