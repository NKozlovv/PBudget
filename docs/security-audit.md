# Security audit — 2026-10-08

Full read of the repo (middleware, auth forms, every server action, the data
layer, config, dependencies, git history). Replaces the Chunk 11 pre-merge
review, which predated Trips, the CSV importer, multi-budget and invites.

**Limits.** Code-only: the live Supabase policies were not inspected, so the
database findings below are inferred from what `CLAUDE.md` §4 says the policies
are. No Node in the audit environment, so nothing was built, linted or run —
run `npm run typecheck && npm test && npm run build` before merging.

Status key: **fixed** = changed on branch `audit/security-and-trim`;
**SQL** = needs `docs/security-hardening.sql` run by you; **open** = your call.

## Findings

| # | Sev | Finding | Status |
|---|-----|---------|--------|
| 1 | High | **Stored XSS in the old app at `/legacy`.** `tx.comment`, `tx.category`, `acc.name` and others were interpolated into `innerHTML` unescaped. `/legacy` shared an origin with the new app, the CSP allowed `unsafe-inline`/`unsafe-eval`, and Supabase auth cookies are not `httpOnly`. A bank-transfer reference imported from a Sparkasse CSV, or anything a shared-budget partner types, would run script in your session. | **fixed** — `public/legacy` deleted, rewrites and CDN allowances removed |
| 2 | High | **`budget_members` self-insert (inferred).** `CLAUDE.md` §4 describes the insert policy as "adding yourself OR you own the budget". If that is literally the policy, any signed-in user can insert `(their id, any budget_id)`. A revoked member still knows the budget UUID and can re-add themselves, so "revoke" is not a real revocation, and `role` may be self-chosen. The app never writes this table from the client. | **SQL** §1 — verify with the section 0 query first |
| 3 | Med | **Invite acceptance before email confirmation.** The sign-up trigger `trg_accept_pending_invites` added anyone registering an invited address, without proving they own it. `master` already replaced it with token + confirmed-email `accept_invite()` and drops the trigger; the first version of `security-hardening.sql` wrongly re-created it. | **SQL** §2 (corrected — drops it again) |
| 4 | Med | **Open redirect after login.** `/login?next=https://evil.com` was passed to `router.push` and navigated off-site after a successful sign-in (phishing). | **fixed** — `safeNextPath()` in `SignInForm.tsx` |
| 5 | Med | **Server actions trusted client types.** The `patch` objects went straight into `.update()`; `type`, `currency`, `date`, `amount` and string lengths were never checked at runtime (TypeScript types vanish at the network boundary). A crafted call could set `created_by`/`budget_id`, store NaN/∞/huge amounts, or attach a transaction to an account in a different budget. | **fixed** — `lib/validation.ts`; allow-listed fields and an account-belongs-to-budget check in transactions/accounts/import/trips/budgets/categories/members actions |
| 6 | Low | **Unvalidated date in an outbound URL.** `getHistoricalRate(date)` put a client-supplied string into the Frankfurter request path (fixed host, so limited to path/query games), and its cache was unbounded. | **fixed** — `isIsoDate` check, 5 s timeout, 5 000-entry cap |
| 7 | Low | **CSV formula injection.** The Trends export wrote category names verbatim; a name like `=HYPERLINK(...)` executes in Excel/Sheets. In a shared budget, the partner controls those names. | **fixed** — `safeText()` in `ExportButton.tsx` |
| 8 | Low | **Middleware auth gate missed `/import`, `/members`, `/coach`.** Protected only by the layout check (still in place). | **fixed** — added to `PROTECTED_PREFIXES` |
| 9 | Low | **CSP too broad.** `unsafe-eval` in production, three CDN script hosts, Google Fonts hosts and Frankfurter in `connect-src` — none needed (fonts are self-hosted by `next/font`, FX is server-side). No `object-src`. | **fixed** — `unsafe-eval` dev-only, allowances dropped, `object-src 'none'`. `unsafe-inline` for scripts stays: Next's bootstrap needs it without nonces |
| 10 | Low | **Active-budget cookie without `Secure`.** | **fixed** (production only) |
| 11 | Low | **No `package-lock.json` is committed.** Every Vercel build resolves `^` ranges fresh, so a compromised or buggy new release ships without review. | **open** — run `npm install` locally and commit the lockfile |
| 12 | Low | **Third-party tarball dependency** (`xlsx` from `cdn.sheetjs.com`) that nothing imports. | **fixed** — removed from `package.json` |
| 13 | Low | **Unbounded bulk operations.** `.in('id', ids)` with hundreds of UUIDs can exceed URL limits; 100k-row CSV imports. | **fixed** — 100-id chunks, 5 000-row import cap, 5 MB CSV cap |
| 14 | Info | **Weak password policy.** Only `minLength=6` in the browser; no login throttling beyond Supabase's. | **open** — Supabase dashboard settings, listed in `security-hardening.sql` §5 |
| 15 | Info | **Server actions return raw Postgres error text** (constraint names, etc.) to the browser. Acceptable for a two-person app; wrap if the audience grows. | **open** |
| 16 | Info | **Invite/revoke rate limiter is per-instance memory** (documented in `members.ts`). A speed-bump, not a limit. | **open** |
| 17 | Info | **Password reset was incomplete.** | **fixed on `master`** (`/auth/callback` + `/reset/update`) |
| 18 | Med | **Stored DoS in RSU grants.** `months` / `every` were unbounded and the vest schedule is expanded in a loop, so one grant with `months = 2000000000` hangs `/rsu` for every member of the budget. | **fixed** — integer bounds (`months` ≤ 600, `every` ≤ `months`, shares ≤ 1e9) |
| 19 | Med | **Invite mailer is an open relay for any signed-in user.** Sign-up is open, any user can create a budget, then invite arbitrary addresses; mail goes out from your Gmail with an attacker-chosen budget name. The only limiter was per-instance memory. | **fixed** (partly) — durable cap of 20 invites/hour per user and a 60 s per-invite resend throttle. **Open:** turn off public sign-ups once you and your partner are in |
| 20 | Med | **SMTP command injection via `budget_invites.email`.** The mailer interpolates the address into `RCPT TO`. The action validates it, but a budget owner can insert rows directly with the public key (RLS allows it), then trigger a resend. | **fixed** — re-validated at the sink in `lib/email.ts`; DB check constraint in SQL §2 |
| 21 | Low | **Investing/RSU actions unvalidated:** `Infinity` shares/price, unbounded jsonb plan, no UUID checks. Yahoo price fetch had no timeout. | **fixed** — bounded numbers, 20 KB plan cap, 8 s timeout |
| 22 | Info | **Emailed invite links use the request's `Host` header** unless `NEXT_PUBLIC_SITE_URL` is set. | **open** — set it to `https://p-budget.vercel.app` in Vercel |

Checked and clean: no `dangerouslySetInnerHTML`/`eval`/`innerHTML` anywhere in
the Next app; no service-role key or other secret in the tree or in git history;
`.env.local` is ignored; the publishable key in `.env.example` is public by
design; transaction search escapes `%`/`_`; sort columns are allow-listed;
every table access goes through the user's session, never an admin client.

## What a reviewer should still test by hand

1. Log in, open `/login?next=https://example.com`, sign in → lands on `/dashboard`.
2. Add a transaction, edit it inline, bulk-select 150+ rows and bulk-delete.
3. Import a Sparkasse CSV; export Trends and open the CSV in a spreadsheet.
4. Create a second budget, invite an email, revoke a member.
5. After running the SQL: as a second account, try
   `insert into budget_members (budget_id, user_id, role) values ('<uuid>', auth.uid(), 'owner')`
   from the Supabase JS client — it must be refused.
