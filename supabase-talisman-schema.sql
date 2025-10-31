-- Talisman NFT Collections and User Talismans Schema

-- Talisman collections (NFT metadata)
create table if not exists public.talisman_collections (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  emoji text not null,
  nft_collection_id text, -- Hedera NFT collection ID
  metadata_ipfs_url text, -- IPFS URL for NFT metadata JSON
  image_ipfs_url text, -- IPFS URL for NFT image
  perk_type text not null, -- 'home_defense', 'scholar', 'daily_planter', etc.
  perk_config jsonb default '{}', -- perk-specific configuration
  rarity text default 'common', -- 'common', 'rare', 'epic', 'legendary'
  created_at timestamptz default now()
);

-- User's talisman NFTs
create table if not exists public.user_talismans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.user_profiles(id) on delete cascade,
  collection_id uuid references public.talisman_collections(id) on delete cascade,
  nft_serial_number text, -- NFT serial number on Hedera
  is_active boolean default false, -- only one can be active per user
  minted_at timestamptz default now(),
  activated_at timestamptz,
  created_at timestamptz default now()
);

-- Talisman activation history
create table if not exists public.talisman_activations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.user_profiles(id) on delete cascade,
  talisman_id uuid references public.user_talismans(id) on delete cascade,
  activated_at timestamptz default now(),
  deactivated_at timestamptz
);

-- Talisman perk usage tracking
create table if not exists public.talisman_perk_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.user_profiles(id) on delete cascade,
  talisman_id uuid references public.user_talismans(id) on delete cascade,
  perk_type text not null,
  usage_data jsonb default '{}', -- perk-specific usage data
  used_at timestamptz default now()
);

-- Indexes
create index if not exists idx_user_talismans_user_id on public.user_talismans(user_id);
create index if not exists idx_user_talismans_active on public.user_talismans(user_id, is_active) where is_active = true;
create index if not exists idx_talisman_activations_user on public.talisman_activations(user_id);
create index if not exists idx_talisman_perk_usage_user on public.talisman_perk_usage(user_id);

-- RLS policies (dev-friendly)
alter table public.talisman_collections enable row level security;
alter table public.user_talismans enable row level security;
alter table public.talisman_activations enable row level security;
alter table public.talisman_perk_usage enable row level security;

-- Permissive policies for development
drop policy if exists tc_select_any on public.talisman_collections;
drop policy if exists tc_insert_any on public.talisman_collections;
drop policy if exists tc_update_any on public.talisman_collections;

create policy tc_select_any on public.talisman_collections for select using (true);
create policy tc_insert_any on public.talisman_collections for insert with check (true);
create policy tc_update_any on public.talisman_collections for update using (true);

drop policy if exists ut_select_any on public.user_talismans;
drop policy if exists ut_insert_any on public.user_talismans;
drop policy if exists ut_update_any on public.user_talismans;

create policy ut_select_any on public.user_talismans for select using (true);
create policy ut_insert_any on public.user_talismans for insert with check (true);
create policy ut_update_any on public.user_talismans for update using (true);

drop policy if exists ta_select_any on public.talisman_activations;
drop policy if exists ta_insert_any on public.talisman_activations;
drop policy if exists ta_update_any on public.talisman_activations;

create policy ta_select_any on public.talisman_activations for select using (true);
create policy ta_insert_any on public.talisman_activations for insert with check (true);
create policy ta_update_any on public.talisman_activations for update using (true);

drop policy if exists tpu_select_any on public.talisman_perk_usage;
drop policy if exists tpu_insert_any on public.talisman_perk_usage;
drop policy if exists tpu_update_any on public.talisman_perk_usage;

create policy tpu_select_any on public.talisman_perk_usage for select using (true);
create policy tpu_insert_any on public.talisman_perk_usage for insert with check (true);
create policy tpu_update_any on public.talisman_perk_usage for update using (true);

-- Insert default talisman collections
insert into public.talisman_collections (name, description, emoji, perk_type, perk_config, rarity) values
('Home Defender', 'Protects your virtual home from invasions and raids', '🏠', 'home_defense', '{"defense_bonus": 50, "cooldown_hours": 24}', 'rare'),
('Scholar', 'Enhances learning and knowledge acquisition', '🧠', 'scholar', '{"xp_bonus": 25, "course_discount": 0.1}', 'common'),
('Daily Planter', 'Rewards consistent daily engagement', '🌿', 'daily_planter', '{"streak_bonus": 2, "required_streak": 7}', 'epic'),
('Lucky Charm', 'Increases rare item drop rates', '🍀', 'lucky_charm', '{"drop_rate_bonus": 0.15, "rarity_boost": 1}', 'legendary'),
('Speed Demon', 'Reduces cooldowns and wait times', '⚡', 'speed_demon', '{"cooldown_reduction": 0.3, "energy_boost": 20}', 'rare'),
('Guardian Angel', 'Provides protection and healing bonuses', '👼', 'guardian_angel', '{"healing_bonus": 40, "protection_duration": 3600}', 'epic')
on conflict do nothing;
