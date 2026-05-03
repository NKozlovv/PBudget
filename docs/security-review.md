# Security review — pre-merge

A point-in-time check of the new Theus app, taken before merging
`experimental/theus-rehaul` into `master`. Run by Claude as part of
Chunk 11; please confirm anything in this list is acceptable to you
before merging.

## Headers (verified in `next.config.mjs`)

| Header | Value |
| --- | --- |
| `Content-Security-Policy` | Permissive — needs to allow CDN scripts and inline styles for the `/legacy` bundle |
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` |
| `Strict-Transport-Security` | 2-year max-age + preload |

CSP is currently broad to keep `/legacy` working. When the legacy app is
retired, tighten by removing `unsafe-inline` and `unsafe-eval` from
`script-src`, dropping the CDN allow-list, and switching to nonce-based
inline scripts.

## Auth + RLS

- Browser uses `@supabase/ssr` `createBrowserClient` with the public
  `sb_publishable_*` key (already exposed in legacy `index.html`).
- All database access goes through Supabase's RLS — every table has
  `is_budget_member()`-gated policies (CLAUDE.md §4). RLS unchanged
  during the rehaul.
- Server components use `createServerClient` with `cookies()` from
  `next/headers` for session-aware queries.
- Middleware (`middleware.ts`) refreshes the auth cookie on every
  protected request and redirects unauth visits to `/login`.
- Protected routes also re-check session in their layout (defense-in-depth).
- Sign-out wipes the Supabase cookie via `supabase.auth.signOut()`.

## Secrets

- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
  read via `lib/env.ts`. No service-role key anywhere in the codebase.
- `.env.example` documents both. `.env.local` is gitignored.
- No API keys for any third-party service committed.

## Input validation

- Server actions validate budget membership implicitly via RLS — every
  insert/update/delete is gated by the active user's session.
- `importXlsxAction`: file presence check, `instanceof File`, ≤ 25 MB
  size cap, `.xlsx`/`.xls` MIME or extension check.
- `listTransactions` filters: search uses `ilike` with `%`/`_` escaped
  before passing to Supabase. Sort field validated against an allowlist.
- `Filters` URL params parsed and validated server-side.

## XSS

- All user-generated text rendered via React text nodes (auto-escaped).
- No `dangerouslySetInnerHTML` anywhere in the new code (`grep`
  confirms).

## Dependencies

- `next` pinned to `^15.5.15` (current latest patched release on the
  `15.5` line — `eslint-config-next` doesn't ship `15.6`+).
- `xlsx` via SheetJS CDN tarball — official distribution path now that
  npm-registry SheetJS is far behind.
- `@supabase/ssr` and `@supabase/supabase-js` at current latest.
- Run `npm audit` locally before each release — Vercel will not surface
  audit warnings; only known-vulnerable Next.js versions are blocked
  (which already caught the `15.5.4` issue at the start of this rehaul).

## What's NOT in scope yet (deferred)

- Light mode (Phase 4 — explicitly dropped from this rehaul)
- Member invitations / multi-budget UI — Chunk 12 + 13. The CSP and
  rate-limit posture will need an update when those land (server route
  + email side-channel).
- CSRF — Next.js server actions ship with built-in CSRF tokens; no
  additional config needed for the surface we have today.
- Lighthouse a11y score ≥ 95 — recommended but I can't run it from this
  environment. Run on the live preview before merging.

## Merge checklist

- [ ] `npm audit` clean locally
- [ ] Lighthouse a11y ≥ 95 on `/login` and `/dashboard`
- [ ] CSP header confirmed in browser dev tools
- [ ] `/legacy` still loads and works (round-trip a transaction there)
- [ ] New app round-trips (sign in → import → see hero balance match)
- [ ] You've reviewed `docs/claude-md-proposal.md` and decided yes/no
- [ ] Merge `experimental/theus-rehaul` → `master` (Vercel still serves
      `/legacy` post-merge, so users on the production URL keep working
      while you decide if/when to flip the default)
