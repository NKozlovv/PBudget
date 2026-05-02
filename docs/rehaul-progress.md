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
