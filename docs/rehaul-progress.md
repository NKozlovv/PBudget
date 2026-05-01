# Rehaul Progress Log

Append-only log, one entry per chunk. Each entry: what was done, what's next, open questions.

---

## Chunk 0 — repo bootstrap (2026-05-01)

**Done:**
- Next.js 15 + React 19 + TypeScript (strict, with `noUncheckedIndexedAccess`) scaffold
- Tailwind v3 with Theus dark tokens via CSS variables → `tailwind.config.ts`
- ESLint + Prettier + Vitest configs
- Three Google fonts (Inter, JetBrains Mono, Instrument Serif) self-hosted via `next/font/google`
- Placeholder home page in Theus identity
- Security headers configured in `next.config.mjs`
- Legacy `index.html` moved to `public/legacy/`, reachable at `/legacy` via Next.js rewrite (master untouched)
- `.env.example` committed; `.gitignore` updated

**Bumps applied during deploy:**
- `next` and `eslint-config-next` pinned to `^15.5.15` after Vercel rejected `15.5.4` for a vulnerability and `15.6.0` didn't exist for `eslint-config-next`.

**Vercel result:** build green, preview confirmed serving `/` and `/legacy`.

**Next:** Chunk 1 — design system foundation.

---

## Chunk 1 — design system foundation (2026-05-01)

**Done:**
- Tokens extracted to `styles/tokens.css` as the single source of truth (imported by `app/globals.css`)
- Six core UI primitives in `components/ui/`: `Mono`, `Num`, `Card` (+ `CardHeader`), `Pill`, `Button`, `KpiTile` (+ `KpiStrip` for the 1-pixel-grid divider technique from `theus-dashboard.jsx`)
- `lib/utils.ts` → tiny `cn()` class-merger (no `clsx` dep yet — adds later if needed)
- `/styleguide` route exercises every primitive at every variant (palette swatches, type scale, mono labels, pills, buttons, KPI strip, cards)
- Real WCAG contrast computation (awk) → `docs/contrast-report.md` with full FG/BG matrix
- **Two tokens nudged for AA compliance:** `--ink-mute` `#7E7762` → `#8E866E` (3.99 → 4.91), `--neg` `#D9603A` → `#E9673E` (4.82 → 5.50). Justified deviation from `design-refs/src/theus-tokens.jsx`, documented in contrast report.
- Home page now links to `/styleguide`

**Verified:**
- All FG × BG pairs in the matrix pass WCAG AA; ink and ink-soft pass AAA.
- Two intentionally avoided combinations flagged in the report (`ink-mute` on `bg-panel`, `neg` on `bg-panel`).

**Skipped (deliberate parsimony):**
- `Sans` wrapper component — Tailwind's `font-sans` + standard text classes are sufficient.
- `Divider` component — `<hr className="border-rule" />` is enough.
- `IconButton` — adds when first real icon ships.
- `clsx` dep — `cn()` helper is 4 lines.

**Next:** Chunk 2 — Supabase SSR client, env config, auth shell.

**Open questions:** none.

**Vercel env reminder:** still not needed yet. When Chunk 2 lands you'll add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in Vercel project settings.

### Chunk 1.1 — Sterling re-alignment (2026-05-01)

User feedback: too much Theus geometry, not enough Sterling. Re-checked
`design-refs/src/dashboard.jsx` and confirmed Sterling uses heavily
rounded surfaces (radius 8 / 10 / 14 / 16). Realigned:

- `Button` → `rounded-[10px]`, padding `22×12`, `text-[13px]`, primary `font-semibold` (matches `brand-system.jsx` button primitive 103–104)
- `Card` → `rounded-2xl` (16px), default `p-6` (24px), `bg-bg-soft` surface (matches dashboard cards 126/152/166)
- `KpiTile` → rounded surface card with optional `cents` slot for the 56/22 dual-size numeral pattern from the Sterling hero
- Dropped `KpiStrip` 1-px-grid divider (that was the Theus pattern); KPI cards now sit in a regular grid with gap
- Styleguide rebuilt: hero balance display, Sterling time-range pill container, separate KPI cards
- Home page wrapped in a rounded surface card

No token changes; this was geometry-only.
