# Ledger — Project Handover

This document hands off the Ledger project from a Claude.ai chat session to Claude Code. Paste this into your first Claude Code session OR save it as `CLAUDE.md` in the project root so every future session starts with this context.

---

## 1. Project in one paragraph

Ledger is a personal budget tracker that the user (bananapie322@gmail.com) is building to replace a Google Sheets-based tracker. It's a single-file HTML app deployed on Vercel, backed by Supabase for auth and data. The user wants it to eventually support shared/collaborative budgets (partner + possibly others). Design direction: **"Modern Soft"** — warm off-white surfaces, navy primary, gentle rounded cards, friendly palette, inspired by Monzo/Revolut/Copilot-Money but calmer.

---

## 2. Where everything lives

**Frontend:**
- **Single file:** `index.html` (~2,900 lines, ~100KB)
- **GitHub repo:** the user has a repo (private) with `index.html` at the root
- **Deployment:** Vercel — https://p-budget.vercel.app
- Vercel auto-deploys on every GitHub push

**Backend (Supabase):**
- **Project URL:** `https://udcfjiuybkugbydlaltk.supabase.co`
- **Publishable key (safe to expose, in code):** `sb_publishable_-GYV876glbqSw-JJt4knfg_Ks9PTj8z`
- **Dashboard:** supabase.com/dashboard → user's project
- Both values are already hardcoded in `index.html` under `window.LEDGER_CONFIG`

**Auth URL config in Supabase:**
- Site URL: `https://p-budget.vercel.app`
- Redirect URL allowed: `https://p-budget.vercel.app/**`
- `https://claude.ai` was used earlier for testing; can be removed now

---

## 3. Tech stack details

- Plain HTML / CSS / vanilla JavaScript. No build step. No framework.
- External CDN libraries loaded in the HTML:
  - SheetJS (`xlsx`) — xlsx parsing
  - Chart.js — charts
  - Supabase JS client v2 (UMD build via jsdelivr)
- Uses `@supabase/supabase-js` client for auth + data access
- Data layer uses Postgres through Supabase's REST API

---

## 4. Supabase schema (already set up)

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

## 5. What's built so far (v0.5.3)

### Working end-to-end

- ✅ Login / signup / password reset via Supabase Auth
- ✅ On first login, bootstraps a budget for the user (creates a default "My Budget")
- ✅ XLSX import — parses user's Google Sheets export, pushes to Supabase in batches
- ✅ All transactions persist to Supabase
- ✅ Add / edit / delete transactions
- ✅ Add / rename / delete expense categories and subcategories
- ✅ Add / rename / delete income categories
- ✅ Add / edit / delete accounts (currency EUR/USD, opening balance, name)
- ✅ FX rate: global rate is stored on budget; per-transaction historical FX rate fetched from Frankfurter API on import and for new USD transactions
- ✅ Version marker in bottom-right corner (from `window.LEDGER_CONFIG.BUILD_VERSION`)

### Current UI (what needs redesigning)

Existing UI is "warm editorial / almanac" style — Fraunces serif, Inter Tight, JetBrains Mono, cream palette, burnt-red accent. User wants to pivot to "Modern soft" direction — see Section 6.

Current pages:
- **Dashboard** — hero (3 stats), monthly flow bar chart, balance trajectory line, category list, recent transactions
- **Transactions** — unified feed with filters (month / category / account / type / search), summary stat row
- **Accounts** — matrix of month-by-account balances, donut chart of current distribution, line chart of per-account trajectories
- **Categories** — lists expense categories + subcategories with spend totals, income categories section, all editable
- **Forecast** — YTD averages, projected balance trajectory, per-category burn rate

---

## 6. Design direction the user chose: "Modern Soft"

Finalized in the chat. Plan approved for Builds 2-5.

**Palette:**
- Page: warm off-white `#f5f3ef`
- Cards: white `#ffffff`
- Primary dark: deep navy `#1a1a2e` (hero balance card, primary buttons, headings)
- Success/income: sage green `#1a7a4a`
- Expense/spending: terracotta `#c44536`
- Highlight/active: warm gold `#d8a64a`
- Secondary info: dusty blue `#7daad0`
- Category palette: warm earthy (terracotta, gold, sage, dusty blue, mauve, olive) rather than saturated primaries

**Typography:**
- Drop Fraunces. Single font family: Inter Tight
- Numbers: JetBrains Mono in dense tables only; large display numbers use Inter Tight bold
- Weights: 400 regular, 500 medium, 600 bold (no 700)

**Shape:**
- Card corners: 14–18px (cards), 20px+ (buttons/pills), 10px (inputs)
- Subtle shadows: `0 1px 2px rgba(20,15,10,0.04)`
- No hard dividers — rely on whitespace and card separation

**Interactions:**
- Tiny hover lift (translateY -1px) on clickable cards/rows
- Category pills are colored chips, not plain text
- Segmented time controls (1M / 3M / YTD / All) on every chart
- Tooltips on chart hover

**Category colors — how to auto-assign:**
- Semantic fit: Food = warm gold, Health = soft coral, Travel = dusty blue, Home = terracotta, Bills = sage muted, Entertainment = purple, Tech = cool gray-blue, Kent (pet) = warm green
- Top categories (by spend) get maximally distinct hues
- Consistent across the app — same color in dashboard donut, pill, drill-down header, forecast bars
- User wants to be able to edit colors later, but NOT in v1 build

---

## 7. Roadmap — what's next

**Build 2 (next):** Global visual refresh + new Dashboard
- Swap CSS tokens to Modern Soft palette
- New Dashboard layout with:
  - Dark navy hero card with balance + sparkline + time range pills
  - 4 metric tiles: This month net, Avg monthly spend, **Savings rate**, **Projected EOY balance**
  - Monthly flow bar chart (income green + expenses red + projected future months in muted tan)
  - Savings rate mini-chart (line chart with YTD trend)
  - Category donut + list with click-to-drill-down
  - Recent activity (replace avatars with small category-color dots)
- Mockup reference was shown in chat and approved

**Build 3:** Transactions page refresh
- Checkbox column + bulk action bar (dark navy, shows count + total) with Recategorize / Change account / Delete actions
- **Sortable columns** — click any column header to sort asc/desc; Date default desc
- Inline editing — click any cell (notes, amount, date, category, account) to edit in place. Enter saves, Esc cancels. NOT on currency.
- Category pills: colored per-category chips

**Build 4:** Category drill-down modal
- Opens when clicking a category anywhere (dashboard donut, category pill, Categories page)
- Modal header tinted with the category's color at low opacity
- 3 stats: this month / monthly avg / YTD with trend arrows
- Monthly trend bar chart with forecasted future months in muted tan
- Sub-category breakdown with **sort controls** (by amount, name, or transaction count)
- Recent transactions list (5 shown, "Show all N →" deep-links to Transactions pre-filtered)

**Build 5:** Polish
- Accounts page refresh to match Modern Soft
- Categories page refresh
- Forecast page refresh
- Apply category color auto-assignment everywhere

**Phase 4 (after visual builds):** Multiple budgets
- User can create additional budgets
- Budget switcher in topbar
- Keep the existing single-budget flow as the default

**Phase 5:** Inviting others
- Owner can invite via email
- Invitee signs up → auto-joins via the `trg_accept_pending_invites` trigger
- Members list + revoke access UI

---

## 8. Bugs we fixed along the way (don't reintroduce)

Critical gotchas discovered during development. Keep these in mind:

### 8a. "Account adjustment" classification

In the user's xlsx, rows in the **expense block** with category = "Account adjustment" are actually **transfers / refunds, not real expenses**. If imported naively as `type: 'expense'`, they inflate expense totals (was inflating by €13,632 in test data).

**Correct behavior:** On import, any row (expense block OR income block) where category = "Account adjustment" must be stored as `type: 'adjustment'`. For rows from the expense block, amount should be **negative** (money left the account). The aggregation code already excludes adjustments from expense/income totals while still applying them to account balances.

### 8b. Timezone off-by-one on dates

`new Date('2026-01-01')` parses as UTC midnight. For users east of UTC (user is in Germany UTC+1/2), calling `.getFullYear()` or `.getMonth()` returns the **previous day's** values. And `.toISOString().slice(0, 10)` shifts local midnight backwards a day.

**Fix applied:** Custom date helpers that parse YYYY-MM-DD strings literally (regex extract year/month/day) and format Date objects using `.getFullYear()` / `.getMonth() + 1` / `.getDate()` with local zero-padding. See `dateToLocalISO()`, `dateStr()`, `monthOfDate()`, `yearOfDate()`, `dateDisplay()` in the code.

**Symptoms if broken:** Jan 1st transactions disappear (filed as Dec 31 previous year). All dates shift one day back. Month totals off.

### 8c. Supabase RLS with new `sb_publishable_` keys

The user is on the new API key system (not legacy anon/service_role). Early RLS policies failed inexplicably. The working config:
- Policies scoped to `to authenticated` explicitly
- `set search_path = public` on SECURITY DEFINER functions
- Trigger `trg_add_owner_as_member` is SECURITY DEFINER (bypasses RLS to insert membership)
- After a fresh install of the app, users need a hard refresh (Cmd+Shift+R) after the RLS SQL runs to clear stale Supabase client state

### 8d. Parser silent drops

Early parser used `XLSX.utils.sheet_to_json({header:1})` which has edge cases with blank leading rows. **Current parser** iterates cells directly via `ws[XLSX.utils.encode_cell({r, c})]` and is defensive against null/undefined. Don't revert.

### 8e. USD opening balances

For USD-denominated accounts (e.g. "Deel, $"), store opening balance in **native USD** (not pre-converted to EUR). EUR conversions happen at display time using either the stored per-tx `fx_rate` or the global `state.fxRate`. The Accounts Balance sheet has separate `€` (col C) and `$` (col D) columns — read `$` for USD accounts, `€` for EUR accounts.

---

## 9. Code architecture notes

### State shape (in-memory)

```js
state = {
  budgetId,        // active budget uuid
  accounts,        // [{id, name, currency}]
  categories,      // {name: [subcategories]} — expense only
  incomeTypes,     // [string]
  transactions,    // [{id, date, type, amount, currency, fx_rate, category, subcategory, account, comment}]
  openingBalances, // {accountId: native-currency-amount}
  fxRate,          // current USD→EUR rate (used only for new txs without stored rate)
  baseCurrency,    // 'EUR'
  activeView,      // 'dashboard'|'transactions'|'accounts'|'categories'|'forecast'
  txFilters,       // {month, category, account, type, search}
  hasData,
}
```

### Data flow

- `init()` — runs on page load → calls `checkAuth()` → if authed, calls `ensureBudget()` → `loadBudgetData()` → `render()`
- `ensureBudget()` — finds user's budget or creates a default "My Budget"
- `loadBudgetData(budgetId)` — fetches accounts, categories, transactions into `state`
- All mutations go through `cloud*()` functions (e.g. `cloudCreateTx`, `cloudUpdateCategory`) which write to Supabase, then update `state` on success, then `render()`
- `render()` — dispatches to `renderDashboard()`, `renderTransactions()`, `renderAccounts()`, `renderCategories()`, `renderForecast()` based on `state.activeView`

### Key functions

- `parseXlsxRaw(arrayBuffer)` — the robust xlsx parser
- `fetchHistoricalFxRate(dateISO)` / `fetchRatesForDates(dates)` — Frankfurter API client, cached in `_fxCache`
- `txToEUR(tx)` — preferred conversion: uses tx's stored `fx_rate` if present, falls back to `state.fxRate`
- `accountBalanceAtMonth(accountId, month, year)` — returns EUR balance at end of month
- `accountBalanceNative(accountId, month, year)` — returns native-currency balance
- `monthlyTotals(year)` — returns `{expenses[12], income[12]}`
- `categoryTotals(year, monthFilter)` / `subcategoryTotals(year, monthFilter, cat)`
- `forecastSpend(year)` — historical-average-based projection

### Version marker

Bottom-right corner shows `BUILD_VERSION · BUILD_DATE` from `window.LEDGER_CONFIG`. Bump on every deploy so the user knows the build is live. Current: `v0.5.3 — account CRUD`.

---

## 10. Development workflow

### Deploy flow

- Edit `index.html` locally
- `git add . && git commit -m "..." && git push`
- Vercel auto-deploys in ~30 seconds
- User checks `p-budget.vercel.app` to verify; version marker confirms the new build is live

### Testing approach

Before any deploy, Claude Code should:
1. Run a syntax check: extract the main `<script>` block and check it parses as valid JS (Node `new Function(code)` or similar)
2. For complex changes, also run a quick smoke test (e.g. verify certain functions exist, key selectors are present)

### Don't forget

- Never use `localStorage`/`sessionStorage` — this user's setup doesn't; everything is Supabase
- Single-file architecture is intentional; don't split into multiple files unless the user asks
- Keep `window.LEDGER_CONFIG` at the top, with publishable key and version constants
- When adding new Supabase tables, write the migration SQL in the chat so user can run it in Supabase SQL Editor

---

## 11. User preferences and working style

- Prefers incremental builds, each producing a working deployable file, over big-bang rewrites
- Wants a version marker so they know the new build is live (very important — they've been burned by stale caches)
- Is in Germany (UTC+1/2) — timezone-correct code matters
- Uses EUR as base currency, has USD accounts (Deel, Wise, Cash, etc.)
- Has a partner they'll eventually share the budget with (Phase 5)
- Tolerant of back-and-forth debugging; wants honest explanations when things break
- Prefers structured updates: what changed, what to test, what's deferred
- Has a Claude Pro subscription; not on Max

---

## 12. First actions for Claude Code

When starting a new session:

1. **Read `index.html`** to see current code — it's the source of truth
2. **Check the current version marker** (`grep BUILD_VERSION index.html`)
3. **Ask the user**: "Picking up from v0.5.3. Should we start Build 2 (visual refresh + new Dashboard)?"
4. **Plan the build in small increments** — typically 3-5 focused edits per session
5. **After each edit**: verify syntax, commit, push, confirm deploy. Keep the user's version marker updated.

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

Everything you need to pick up development is above. Read the current `index.html` for implementation details, confirm with the user what to build next, and follow the Modern Soft design direction for all visual work.

Good luck 🏗️
