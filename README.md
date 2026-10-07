# Theus

A personal budget tracker you can share with a partner. Built to replace a Google Sheets budget: it tracks spending and income, account balances, trips, a forecast, an ETF portfolio and RSU vesting, in EUR with USD accounts converted at historical rates.

Live at **https://theusapp.vercel.app**.

## What's in it

| Page | What it does |
| --- | --- |
| **Overview** | Balance, income / spend / net for the last completed month, spending mix, cash flow, savings rate, account cards |
| **Transactions** | Full ledger with search and filters, inline editing, bulk edit and delete, transfers between accounts |
| **Trends** | Spend by category and subcategory, one column per month, colour-coded month-over-month change; CSV export |
| **Trips** | Compare trips by total, per day or per person-day, with a subcategory × trip matrix |
| **Categories** | Categories and subcategories with this-month and year-to-date totals; full CRUD |
| **Accounts** | Balances, trajectory chart, net-worth split; full CRUD; EUR and USD accounts |
| **Forecast** | Projected year-end balance, burn rate per category, next savings milestone |
| **Investing** | One tracked ETF: lots, return vs invested, saved projection scenarios |
| **RSU** | Grants, vesting timeline, value at a share price you type in |
| **Members** | Share a budget by email invite or a one-time link |
| **Import CSV** | Sparkasse bank export: review every row, merchant-based category suggestions, likely duplicates start unticked |

Two behaviours worth knowing:

- **"This month" means the last completed month.** The budget is filled in at month-end, so Overview, Categories, Forecast and Trends anchor to the most recent month with data, and averages only divide by months that have transactions.
- **Transfers and adjustments are not income or spend.** They move balances but are excluded from totals.

## Stack

- **Next.js 15** (App Router), **React 19**, **TypeScript** (strict)
- **Tailwind 3** with CSS-variable tokens; "liquid glass" design, Plus Jakarta Sans
- **Supabase**: auth and Postgres, with row-level security on every table
- Charts are inline SVG, forms are plain `useState` plus server actions
- **Vitest** for the logic that has to stay correct (dates, money, CSV parsing, projections)
- Hosted on **Vercel**; FX rates from the Frankfurter API, ETF prices from Yahoo (both fetched server-side)

## Getting started

Requires Node 20+ and a Supabase project.

```bash
npm install
cp .env.example .env.local   # fill in the values below
npm run dev
```

Open http://localhost:3000.

### Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | yes | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | yes | The publishable (`sb_publishable_…`) key. Safe to expose; RLS is the gate |
| `NEXT_PUBLIC_SITE_URL` | recommended | Public origin used in emailed invite links (`https://theusapp.vercel.app`). Production only |
| `GMAIL_USER`, `GMAIL_APP_PASSWORD` | optional | Send invite emails through Gmail SMTP (needs a Google app password). Mark both sensitive |

With no email provider configured, invites still work: the owner copies the link and sends it themselves. There is no service-role key anywhere in the project, and there shouldn't be.

### Database

Auth and tables live in Supabase. The core schema (budgets, members, accounts, categories, transactions and the `is_budget_member()` RLS helper) is described in [CLAUDE.md](CLAUDE.md) §4 and §13. The later features each ship a migration you run by hand in the Supabase SQL Editor:

| File | Run it for |
| --- | --- |
| [`docs/invites-migration.sql`](docs/invites-migration.sql) | Email invitations with one-time links |
| [`docs/investing-rsu-migration.sql`](docs/investing-rsu-migration.sql) | Investing and RSU pages |
| [`docs/optional-migrations.sql`](docs/optional-migrations.sql) | Showing member emails on the Members page |
| [`docs/security-hardening.sql`](docs/security-hardening.sql) | Security fixes from the audit. Read its header first; **not applied automatically** |

Migrations are written to be safe to re-run.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Vitest |
| `npm run format` | Prettier |

Run `typecheck`, `test` and `build` before pushing.

## Project layout

```
app/
  (app)/        signed-in pages (one folder per route above)
  (auth)/       login, signup, password reset, invite acceptance
  auth/callback email-link landing: exchanges the code for a session
  actions/      'use server' mutations: the only write path
components/     UI by feature (ui/ holds the shared primitives)
lib/
  data/         server-only reads, called from server components
  supabase/     browser, server and middleware clients
  validation.ts runtime input checks used by every server action
  csv/ trips/ investing/ rsu/ forecast/ ...  pure logic, unit-tested
middleware.ts   refreshes the session cookie, gates protected routes
styles/tokens.css   the design tokens (single source of truth)
docs/           plans, build log, security audit, SQL migrations
```

Rules the code follows:

- Components never import the Supabase client for data; reads go through `lib/data/*`, writes through `app/actions/*`.
- A server action is a public endpoint. Every one validates its input at runtime and allow-lists the columns it writes.
- Never use `localStorage` for app data; everything lives in Supabase.
- Dates are parsed as literal `YYYY-MM-DD` strings (`lib/date.ts`), never `new Date('2026-01-01')`, which shifts a day east of UTC.

## Deployment

Vercel deploys every push. `master` is production; any other branch gets a preview URL. For anything risky, push a branch, check its preview, then fast-forward `master`.

## Security

Authorization is Supabase RLS. The app sends a strict CSP and security headers (`next.config.mjs`), redirects only to same-site paths after login, and never exposes a privileged key. See [`docs/security-audit.md`](docs/security-audit.md) for the latest audit and what is still open.

## More documentation

- [`CLAUDE.md`](CLAUDE.md): handover notes, schema, and the bugs not to reintroduce
- [`docs/rehaul-plan.md`](docs/rehaul-plan.md): architecture decisions
- [`docs/rehaul-progress.md`](docs/rehaul-progress.md): running build log
- [`docs/security-audit.md`](docs/security-audit.md): security findings and status
