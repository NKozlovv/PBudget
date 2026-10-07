-- Investing (WEBN via Interactive Brokers) + RSU pages.
-- Run in Supabase dashboard → SQL Editor. Safe to re-run (if not exists / drop policy if exists).
--
-- Design note: gains are NEVER stored as transactions. A "lot" is a buy
-- (cash moved bank → broker); value, return and yield are derived from
-- lots × the daily price history (lib/market.ts). That keeps "Saved" on
-- the cash pages free of market noise — see the Investing page's
-- Return vs Invested split.

-- ── Investing: buys of the one tracked asset ─────────────────────────
create table if not exists public.investment_lots (
  id         uuid primary key default gen_random_uuid(),
  budget_id  uuid not null references public.budgets(id) on delete cascade,
  type       text not null check (type in ('buy', 'open')),
  date       date not null,
  shares     numeric not null check (shares > 0),
  price      numeric not null check (price > 0),   -- EUR per share
  fee        numeric not null default 0 check (fee >= 0),
  created_at timestamptz not null default now()
);
create index if not exists investment_lots_budget_idx on public.investment_lots (budget_id, date);

-- ── Investing: saved projection sliders + up to 3 scenarios ──────────
create table if not exists public.investment_plans (
  budget_id  uuid primary key references public.budgets(id) on delete cascade,
  plan       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- ── RSU ──────────────────────────────────────────────────────────────
create table if not exists public.rsu_grants (
  id         uuid primary key default gen_random_uuid(),
  budget_id  uuid not null references public.budgets(id) on delete cascade,
  name       text not null,
  start_date date not null,
  shares     integer not null check (shares > 0),
  months     integer not null check (months > 0),   -- total duration
  every      integer not null check (every > 0),    -- vests every N months
  cliff      integer not null default 0 check (cliff >= 0),
  created_at timestamptz not null default now()
);
create index if not exists rsu_grants_budget_idx on public.rsu_grants (budget_id, start_date);

create table if not exists public.rsu_settings (
  budget_id   uuid primary key references public.budgets(id) on delete cascade,
  share_price numeric not null default 0 check (share_price >= 0),  -- EUR, typed by hand
  updated_at  timestamptz not null default now()
);

-- ── RLS: same shape as accounts / trip_details ───────────────────────
alter table public.investment_lots  enable row level security;
alter table public.investment_plans enable row level security;
alter table public.rsu_grants       enable row level security;
alter table public.rsu_settings     enable row level security;

drop policy if exists investment_lots_all  on public.investment_lots;
drop policy if exists investment_plans_all on public.investment_plans;
drop policy if exists rsu_grants_all       on public.rsu_grants;
drop policy if exists rsu_settings_all     on public.rsu_settings;

create policy investment_lots_all  on public.investment_lots  for all to authenticated
  using (public.is_budget_member(budget_id)) with check (public.is_budget_member(budget_id));
create policy investment_plans_all on public.investment_plans for all to authenticated
  using (public.is_budget_member(budget_id)) with check (public.is_budget_member(budget_id));
create policy rsu_grants_all       on public.rsu_grants       for all to authenticated
  using (public.is_budget_member(budget_id)) with check (public.is_budget_member(budget_id));
create policy rsu_settings_all     on public.rsu_settings     for all to authenticated
  using (public.is_budget_member(budget_id)) with check (public.is_budget_member(budget_id));

-- ── RSU: share price at grant (added after first release; safe to re-run) ──
alter table public.rsu_grants add column if not exists grant_price numeric check (grant_price is null or grant_price >= 0);  -- EUR/share on the grant date
