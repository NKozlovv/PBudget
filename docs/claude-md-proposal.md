# Proposed CLAUDE.md update — for review

The current `CLAUDE.md` documents the **pre-rehaul** single-file `index.html`
architecture. Several sections are now stale or actively misleading for any
future agent picking up the project. This file proposes a rewrite. Do not
apply until approved.

The plan (in `docs/rehaul-plan.md`) committed to flagging staleness rather
than touching `CLAUDE.md` unilaterally — this is that flag.

---

## What stays unchanged

- §1 (Project in one paragraph) — still accurate.
- §2 (Where everything lives) — Vercel + Supabase URL + auth URL config still match. Update the file paths to point at the new structure.
- §4 (Supabase schema) — unchanged. The schema and RLS policies were not touched.
- §8 (Bugs we fixed along the way) — keep verbatim. Every gotcha still applies.
- §10 (Development workflow) — Vercel auto-deploy still applies, just with build step + lint + typecheck on top.
- §11 (User preferences) — unchanged.
- §13 (Supabase setup SQL) — unchanged.

## What needs rewriting

### §3 — Tech stack

Replace with:

> - **Framework:** Next.js 15 (App Router), React 19, TypeScript (strict, `noUncheckedIndexedAccess`).
> - **Styling:** Tailwind v3 with semantic CSS-variable tokens (`styles/tokens.css`).
> - **Auth + data:** Supabase via `@supabase/ssr` (browser client + server client + middleware-cookie refresh).
> - **Charts:** inline SVG components — no chart library. Modeled after the design refs.
> - **Forms:** vanilla `useState` + server actions (no react-hook-form yet).
> - **Tests:** Vitest, Node env. Regression-critical only — `lib/date.ts`, `lib/money.ts`, `lib/xlsx/classify.ts`.
> - **XLSX:** SheetJS `xlsx` via the official CDN tarball (npm-registry version is far behind).
> - **FX:** Frankfurter API, server-side cache.

### §5 — What's built so far

Mark as **"Pre-rehaul snapshot — frozen at v1.0.1"**. Add a new section:

> ## 5b. Post-rehaul (Theus, v2.0.0-α)
>
> Available at the new app's `/`. The legacy `v1.0.1` app remains reachable
> at `/legacy` until explicitly retired.
>
> Routes (under `app/(app)/`):
> - `/dashboard` — hero balance, KPI strip, Income vs Spend bars, category donut, recent tx
> - `/transactions` — full table with filters (search/month/type/account/category/subcategory), URL-driven sortable headers, inline edit per cell, bulk select + delete
> - `/accounts` — trajectory chart + distribution donut + accounts table with CRUD
> - `/categories` — expense + income panels with subcategories, per-row this-month + YTD totals, full CRUD
> - `/forecast` — projected EOY balance, YTD averages, forecast bars (actual + projected), per-category burn-rate tables
> - `/import` — XLSX bulk import (drag-drop, FX preflight, classifier with §8a regression coverage)

### §6 — Modern Soft direction

Mark as **superseded**. Add:

> ## 6. Design direction
>
> Sterling structural language + Theus identity. Tokens in
> `styles/tokens.css`. Detail in `docs/rehaul-plan.md` §5.
> The "Modern Soft" direction below is historical — kept for context.

### §7 — Roadmap

Mark as **superseded**. The new chunk sequence lives in
`docs/rehaul-plan.md` §7 and the running log in `docs/rehaul-progress.md`.

### §9 — Code architecture notes

Replace with:

> ## 9. Code architecture
>
> ```
> app/
>   (auth)/           # login, signup, reset (split-screen Sterling layout)
>   (app)/            # dashboard, transactions, accounts, categories,
>                     # forecast, import — all gated by middleware + layout
>   actions/          # 'use server' mutations
>   styleguide/       # dev-only token + primitives reference
>
> components/
>   ui/               # primitives (Card, Button, Pill, Input, Field, Mono, Num, Modal, Select, KpiTile)
>   nav/              # Sidebar, NavItem, UserCard, PageHeader, Stub
>   auth/             # SignInForm, SignUpForm, ResetForm, BrandPanel, AuthHeader, TheusMark
>   transactions/     # Filters, TransactionsTable, TransactionForm, EditableCell, SortableHeader, BulkActionBar
>   accounts/         # AccountsTable, AccountForm
>   categories/       # CategoriesPanel, NameForm
>   charts/           # IncomeSpendBars, CategoryDonut, Donut, AccountsTrajectory, ForecastBars, Sparkline
>   forecast/         # BurnRateTable
>   import/           # ImportDropzone
>
> lib/
>   supabase/         # client, server, middleware, types
>   data/             # read-only repos: budgets, accounts, categories, transactions
>   xlsx/             # parse, classify, dates
>   date.ts, money.ts, balance.ts, categoryColor.ts, fx.ts, env.ts, utils.ts, version.ts
>
> styles/             # tokens.css (single source of palette truth)
> test/lib/           # date.test.ts, money.test.ts, xlsx/classify.test.ts
> design-refs/        # reference-only — never imported into prod
> public/legacy/      # the v1.0.1 single-file app, served at /legacy
> ```
>
> Data-flow rule: components never import `@supabase/supabase-js` directly.
> Reads go through `lib/data/*` (server-only) on server components; writes go
> through `app/actions/*` server actions. Middleware (`middleware.ts`) refreshes
> the auth cookie and redirects unauth visits to protected routes.

### §12 — First actions for Claude Code

Replace with:

> ## 12. First actions for any future agent
>
> 1. Read `docs/rehaul-progress.md` first — running log of every chunk, what
>    landed, what was skipped, and why.
> 2. Read `docs/rehaul-plan.md` for the original architecture decisions.
> 3. Check the sidebar version marker on the live preview (`v2.0.0-α` at
>    minimum) so you know which build you're looking at.
> 4. The legacy app is still at `/legacy` — useful for visual diffs and
>    parity checks. Not the source of truth anymore.
> 5. Don't break `master`. Treat it as production. Every change goes via
>    `experimental/theus-rehaul` (current rehaul branch) until the user
>    explicitly merges.

---

## Confirm before applying

When you're ready, say "apply CLAUDE.md update" and I'll commit the rewrite
in a single focused commit (no behaviour changes, docs only).
