-- 003: 사용자 프로필 (맞춤 체크리스트 생성용 입력값)
--   세션당 1개 row.

create table if not exists user_profiles (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null unique,
  current_age_bracket text,
  expected_death_bracket text,
  real_estate_bracket text,
  financial_assets text,
  life_insurance_bracket text,
  marital_status text,
  spouse jsonb,
  children jsonb not null default '[]'::jsonb,
  grandchildren jsonb not null default '[]'::jsonb,
  other_notes text,
  updated_at timestamptz not null default now()
);
create index if not exists idx_profiles_session on user_profiles(session_id);

alter table user_profiles enable row level security;
drop policy if exists "public read profiles" on user_profiles;
drop policy if exists "public write profiles" on user_profiles;
create policy "public read profiles"  on user_profiles for select using (true);
create policy "public write profiles" on user_profiles for all using (true) with check (true);
