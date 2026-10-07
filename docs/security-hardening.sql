-- Theus — database hardening from the 2026-10-08 security audit.
-- Run in Supabase dashboard → SQL Editor. Nothing here has been applied.
-- The audit was done from the code only; the live policies were NOT inspected,
-- so run section 0 first and compare against what the later sections assume.
-- See docs/security-audit.md for the reasoning behind each item.

-- ─────────────────────────────────────────────────────────────────────
-- 0. Inspect (read-only) — run these first and keep the output
-- ─────────────────────────────────────────────────────────────────────

select tablename, policyname, cmd, roles, qual, with_check
from pg_policies
where schemaname = 'public'
order by tablename, cmd, policyname;

-- SECURITY DEFINER functions and whether they pin search_path:
select p.proname, p.prosecdef as security_definer, p.proconfig
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.prosecdef;


-- ─────────────────────────────────────────────────────────────────────
-- 1. budget_members must not be writable from the client   (HIGH)
-- ─────────────────────────────────────────────────────────────────────
--
-- CLAUDE.md §4 describes the budget_members insert policy as "you're adding
-- yourself OR you own the budget". The "adding yourself" half lets any signed-in
-- user insert (their own user_id, ANY budget_id) — so a revoked member, who still
-- knows the budget's UUID, can simply re-add themselves, and nothing stops them
-- from choosing role = 'owner'. If section 0 shows an INSERT or UPDATE policy on
-- budget_members that is not strictly owner-gated, drop it.
--
-- The app never writes budget_members from the client: the owner row is created
-- by trg_add_owner_as_member and invites are accepted by trg_accept_pending_invites,
-- both SECURITY DEFINER (they bypass RLS). So no INSERT/UPDATE policy is needed.
--
-- NOTE: this drops policies of cmd INSERT/UPDATE only. If section 0 shows a
-- policy with cmd = 'ALL' on budget_members, split it by hand (keep SELECT and
-- DELETE) — an ALL policy also grants INSERT/UPDATE.

do $$
declare p record;
begin
  for p in
    select policyname from pg_policies
    where schemaname = 'public' and tablename = 'budget_members' and cmd in ('INSERT', 'UPDATE')
  loop
    execute format('drop policy %I on public.budget_members', p.policyname);
  end loop;
end $$;

revoke insert, update on public.budget_members from authenticated, anon;


-- ─────────────────────────────────────────────────────────────────────
-- 2. Retire the sign-up auto-accept trigger; harden invites     (MEDIUM)
-- ─────────────────────────────────────────────────────────────────────
--
-- IMPORTANT — correction to the first version of this file: it re-created
-- trg_accept_pending_invites. docs/invites-migration.sql §4 retires that trigger
-- ON PURPOSE (acceptance now goes through accept_invite(): token + confirmed
-- email + expiry). If you already ran the first version, run this to undo it.
-- The trigger ignored the invite's expiry and token; accept_invite() does not.

drop trigger if exists trg_accept_pending_invites on auth.users;
drop function if exists public.accept_pending_invites();

-- budget_invites.email is interpolated into SMTP commands by the app's mailer.
-- The app validates it, but a budget owner can also write this table directly
-- with the public key, so enforce the same shape in the database:
alter table public.budget_invites
  add constraint budget_invites_email_chk
  check (char_length(email) <= 254 and email ~ '^[^\s@<>",;]+@[^\s@<>",;]+\.[^\s@<>",;]+$') not valid;
-- alter table public.budget_invites validate constraint budget_invites_email_chk;


-- ─────────────────────────────────────────────────────────────────────
-- 3. Cross-budget references (optional but recommended)         (LOW)
-- ─────────────────────────────────────────────────────────────────────
--
-- RLS only asks "are you a member of this row's budget?". It does not stop a
-- transaction in budget A pointing at an account in budget B when you belong to
-- both. The server actions now check this, but the database should enforce it.
--
-- First make sure no existing row violates it (expect 0):
--   select count(*) from public.transactions t
--   join public.accounts a on a.id = t.account_id
--   where a.budget_id <> t.budget_id;

alter table public.accounts
  add constraint accounts_id_budget_uniq unique (id, budget_id);

alter table public.transactions
  add constraint transactions_account_budget_fk
  foreign key (account_id, budget_id) references public.accounts (id, budget_id);


-- ─────────────────────────────────────────────────────────────────────
-- 4. Basic value constraints (optional)                         (LOW)
-- ─────────────────────────────────────────────────────────────────────
--
-- The actions validate these now; this keeps the table honest if anything else
-- ever writes to it. Skip any constraint that already exists (names may clash).
-- `not valid` skips checking old rows; run the `validate` lines once you've
-- confirmed the old rows are clean.

alter table public.transactions
  add constraint transactions_type_chk check (type in ('expense', 'income', 'adjustment')) not valid,
  add constraint transactions_currency_chk check (currency in ('EUR', 'USD')) not valid,
  add constraint transactions_comment_len_chk check (comment is null or char_length(comment) <= 500) not valid;

-- alter table public.transactions validate constraint transactions_type_chk;
-- alter table public.transactions validate constraint transactions_currency_chk;
-- alter table public.transactions validate constraint transactions_comment_len_chk;


-- ─────────────────────────────────────────────────────────────────────
-- 5. Dashboard settings (not SQL — do these in the Supabase UI)
-- ─────────────────────────────────────────────────────────────────────
--
--  * Authentication → Providers → Email: "Confirm email" ON.
--  * Authentication → Policies (or Sign In / Up): minimum password length 8+ and
--    require mixed characters; enable leaked-password protection (Pro plan).
--    The app only enforces `minLength=6` in the browser.
--  * Authentication → Rate Limits: leave the defaults on; the app has no login
--    throttling of its own.
--  * Authentication → URL Configuration: Site URL https://p-budget.vercel.app and
--    redirect URL https://p-budget.vercel.app/** only (no wildcards for other hosts).
--  * Project Settings → API: keep "Max rows" at its default; the app pages explicitly.
--  * Consider turning off public sign-ups once you and your partner have accounts
--    (Authentication → Sign In / Up → "Allow new users to sign up").
