# Theus

Personal budget tracker. Branch `experimental/theus-rehaul` is migrating the project from a single-file vanilla `index.html` to Next.js + TypeScript + Tailwind. The plan lives at [docs/rehaul-plan.md](docs/rehaul-plan.md).

The legacy single-file app is still fully functional and is served at `/legacy` until the new app reaches feature parity.

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
| `npm test` | Vitest (regression tests only — see plan §6) |
| `npm run format` | Prettier |

## Deployment

Vercel auto-deploys every push:

- `master` → production at https://p-budget.vercel.app
- `experimental/theus-rehaul` → preview URL provided by Vercel

## Structure

See [docs/rehaul-plan.md](docs/rehaul-plan.md) §6 for the planned folder layout and §7 for the chunked migration order.

## Reference designs

`design-refs/` contains Sterling and Theus brand reference files. Reference-only — never imported into production code.
