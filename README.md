# Theus

Personal budget tracker — Next.js 15 + React 19 + TypeScript + Tailwind, backed by Supabase (auth + Postgres with RLS). Architecture decisions live in [docs/rehaul-plan.md](docs/rehaul-plan.md); the running build log is [docs/rehaul-progress.md](docs/rehaul-progress.md). `CLAUDE.md` is the handover document for anyone picking the project up.

## Local development

```bash
npm install
cp .env.example .env.local   # then fill in real values
npm run dev
```

Open http://localhost:3000.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Next.js dev server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Vitest (regression tests only) |
| `npm run format` | Prettier |

## Deployment

Vercel auto-deploys every push: `master` → production at https://p-budget.vercel.app; any other branch gets a preview URL.
