# Rehaul Progress Log

Append-only log, one entry per chunk. Each entry: what was done, what's next, open questions.

---

## Chunk 0 — repo bootstrap (2026-05-01)

**Done:**
- Next.js 15 + React 19 + TypeScript (strict, with `noUncheckedIndexedAccess`) scaffold
- Tailwind v3 with Theus dark tokens wired through CSS variables → `tailwind.config.ts`
- ESLint (next/core-web-vitals + next/typescript) + Prettier + Vitest configs
- `app/layout.tsx` loads Inter, JetBrains Mono, Instrument Serif via `next/font/google` (self-hosted, no Google CDN at runtime)
- `app/page.tsx` placeholder rendered in Theus identity (forest bg, cream ink, brass accent, italic-serif tagline)
- Security headers configured in `next.config.mjs`: nosniff, X-Frame-Options DENY, Referrer-Policy, Permissions-Policy
- Legacy app moved to `public/legacy/index.html`, reachable at `/legacy` via Next.js rewrite (`master` is unaffected)
- `.env.example` committed; real keys go to Vercel project settings
- README rewritten

**Verified locally:**
- `npm install` clean
- `npm run typecheck` clean
- `npm run lint` clean
- `npm run build` clean
- `/` renders Theus placeholder; `/legacy` serves the old app

**Next:** Chunk 1 — design system foundation (`components/ui/` primitives + `/styleguide` route + WCAG report).

**Open questions:** none.
