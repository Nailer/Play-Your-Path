-- HTS config table to store token id and treasury credentials
create table if not exists public.hts_config (
  id int primary key default 1,
  reward_token_id text,
  token_symbol text default 'PLANT',
  decimals int default 8,
  daily_amount bigint default 1000,
  use_supply_on_claim boolean default false,
  treasury_account_id text,
  treasury_private_key text,
  supply_private_key text,
  updated_at timestamptz default now()
);

-- Migrations for existing tables (safe to re-run)
do $$ begin
  begin alter table public.hts_config add column if not exists token_symbol text default 'PLANT'; exception when duplicate_column then null; end;
  begin alter table public.hts_config add column if not exists decimals int default 8; exception when duplicate_column then null; end;
  begin alter table public.hts_config add column if not exists daily_amount bigint default 1000; exception when duplicate_column then null; end;
  begin alter table public.hts_config add column if not exists use_supply_on_claim boolean default false; exception when duplicate_column then null; end;
end $$;

-- single-row constraint
insert into public.hts_config (id)
values (1)
on conflict (id) do nothing;

-- RLS (dev-friendly)
alter table public.hts_config enable row level security;
drop policy if exists hts_select_any on public.hts_config;
drop policy if exists hts_upsert_any on public.hts_config;
create policy hts_select_any on public.hts_config for select using (true);
create policy hts_upsert_any on public.hts_config for insert with check (true);
create policy hts_update_any on public.hts_config for update using (true);

-- Optional: tighter prod policies can be added later

