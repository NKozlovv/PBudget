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
