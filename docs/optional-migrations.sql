-- Optional Supabase migrations.
-- Apply via Supabase dashboard → SQL Editor when you want the feature.

-- ─────────────────────────────────────────────────────────────────────
-- 1. Member emails on the /members page (Chunk 13)
-- ─────────────────────────────────────────────────────────────────────
--
-- The Theus app currently shows members by truncated user_id only,
-- because the publishable key can't read auth.users (and that's
-- intentional — we don't want a full user enumeration vector).
--
-- This RPC exposes ONLY emails of users who already share a budget
-- with the caller, gated by is_budget_member(). Apply it and the UI
-- can be extended to call:
--
--   const { data } = await supabase.rpc('get_budget_member_emails', { b: budgetId });
--
-- to render member rows with email instead of user_id.

create or replace function public.get_budget_member_emails(b uuid)
returns table(user_id uuid, email text, joined_at timestamptz)
language sql
security definer
stable
set search_path = public, auth
as $$
  select bm.user_id, u.email::text, u.created_at
  from public.budget_members bm
  join auth.users u on u.id = bm.user_id
  where bm.budget_id = b
    and public.is_budget_member(b);
$$;

grant execute on function public.get_budget_member_emails(uuid) to authenticated;
