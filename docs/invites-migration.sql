-- Email invitations with a one-time link.
-- Run in Supabase dashboard → SQL Editor. Safe to re-run.
--
-- Flow: owner invites an email → app emails /invite/<token> → the invitee
-- creates an account (or signs in) → clicks "Join" → accept_invite() checks
-- the token AND that the signed-in, email-confirmed account owns the invited
-- address, then adds them to the budget and deletes the invite.

-- ── 1. Token + expiry on invites ─────────────────────────────────────
alter table public.budget_invites
  add column if not exists token uuid not null default gen_random_uuid();
alter table public.budget_invites
  add column if not exists expires_at timestamptz not null default (now() + interval '14 days');

create unique index if not exists budget_invites_token_key on public.budget_invites (token);

-- ── 2. Public preview of an invite (anyone holding the token) ────────
-- Returns only what the invite page needs. The token is a random UUID, so
-- knowing it is the proof of having received the email.
create or replace function public.get_invite_preview(p_token uuid)
returns table (budget_name text, email text, expired boolean)
language sql
security definer
stable
set search_path = public
as $$
  select b.name, i.email, (i.expires_at < now())
  from public.budget_invites i
  join public.budgets b on b.id = i.budget_id
  where i.token = p_token;
$$;
grant execute on function public.get_invite_preview(uuid) to anon, authenticated;

-- ── 3. Accept ────────────────────────────────────────────────────────
create or replace function public.accept_invite(p_token uuid)
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  inv public.budget_invites%rowtype;
  u   auth.users%rowtype;
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;

  select * into inv from public.budget_invites where token = p_token;
  if not found then raise exception 'invite_not_found'; end if;
  if inv.expires_at < now() then raise exception 'invite_expired'; end if;

  select * into u from auth.users where id = auth.uid();
  if u.email_confirmed_at is null then raise exception 'email_not_confirmed'; end if;
  if lower(u.email) <> lower(inv.email) then raise exception 'email_mismatch'; end if;

  insert into public.budget_members (budget_id, user_id, role)
  values (inv.budget_id, auth.uid(), 'member')
  on conflict do nothing;

  delete from public.budget_invites where id = inv.id;
  return inv.budget_id;
end;
$$;
revoke all on function public.accept_invite(uuid) from public, anon;
grant execute on function public.accept_invite(uuid) to authenticated;

-- ── 4. Retire the signup auto-accept trigger ─────────────────────────
-- It added anyone who signed up with an invited address to the budget
-- immediately — without confirming they own that address — so anyone who
-- guessed an invited email could register it and get in. Acceptance now
-- goes through accept_invite() above (token + confirmed email).
drop trigger if exists trg_accept_pending_invites on auth.users;
