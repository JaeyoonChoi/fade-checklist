-- Afterlife Checklist — Supabase schema
-- Run this in Supabase SQL Editor once per project.

-- 1. 체크리스트 루트 (세션당 1개 이상)
create table if not exists checklists (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null,
  title text not null default '사후 체크리스트',
  created_at timestamptz not null default now()
);
create index if not exists idx_checklists_session on checklists(session_id);

-- 2. 체크리스트 항목
create table if not exists checklist_items (
  id uuid primary key default gen_random_uuid(),
  checklist_id uuid not null references checklists(id) on delete cascade,
  category text not null default '기타',
  phase text not null default 'month',
  title text not null,
  description text not null default '',
  completed boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists idx_items_checklist on checklist_items(checklist_id);
create index if not exists idx_items_sort on checklist_items(checklist_id, sort_order);
create index if not exists idx_items_phase on checklist_items(checklist_id, phase);

-- 2-b. 사용자 프로필 (맞춤 체크리스트 생성용 입력값)
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

-- 3. RLS: 인증 없음 → anon key로 전체 읽기/쓰기 허용
--   공유는 session_id 기반, 실제 서비스에선 세션 id 유출시 누구나 수정 가능함을 유의.
alter table checklists enable row level security;
alter table checklist_items enable row level security;

drop policy if exists "public read checklists" on checklists;
drop policy if exists "public write checklists" on checklists;
drop policy if exists "public read items" on checklist_items;
drop policy if exists "public write items" on checklist_items;

create policy "public read checklists" on checklists for select using (true);
create policy "public write checklists" on checklists for all using (true) with check (true);
create policy "public read items" on checklist_items for select using (true);
create policy "public write items" on checklist_items for all using (true) with check (true);

alter table user_profiles enable row level security;
drop policy if exists "public read profiles" on user_profiles;
drop policy if exists "public write profiles" on user_profiles;
create policy "public read profiles"  on user_profiles for select using (true);
create policy "public write profiles" on user_profiles for all using (true) with check (true);

-- 4. 기본 항목 삽입 헬퍼
create or replace function _insert_default_items(p_checklist_id uuid)
returns void
language plpgsql
as $$
begin
  insert into checklist_items (checklist_id, category, phase, title, description, sort_order) values
    (p_checklist_id, '행정·신고',  'immediate', '사망진단서 발급',
       '사망진단서는 장례·상속·보험·은행 등 여러 곳에서 필요합니다. 7~10부 정도 여유있게 준비하세요.', 1),
    (p_checklist_id, '장례·의례',  'immediate', '장례 진행',
       '장례식장 선정, 장례 방식(매장·화장·수목장) 결정 및 장례 절차를 진행합니다.', 2),
    (p_checklist_id, '장례·의례',  'immediate', '부고·조문 관리',
       '가까운 지인·직장·단체에 부고를 전하고, 조문·부의 기록을 정리합니다.', 3),
    (p_checklist_id, '행정·신고',  'month',     '사망신고서 제출',
       '사망일로부터 1개월 이내 주민센터 또는 시·구청에 사망신고를 접수합니다.', 4),
    (p_checklist_id, '행정·신고',  'month',     '사망 등본 발급',
       '사망신고 처리 후 가족관계증명서·주민등록등본에서 사망(말소) 표기를 확인·발급합니다.', 5),
    (p_checklist_id, '금융·상속',  'month',     '안심상속 원스톱 서비스 신청',
       '사망신고 직후 정부24에서 금융·채무·부동산·보험·세금 체납 여부를 한 번에 조회할 수 있습니다.', 6),
    (p_checklist_id, '금융·상속',  'quarter',   '상속 여부 결정 (상속포기·한정승인)',
       '사망일로부터 3개월 이내 단순승인·한정승인·상속포기 중 선택합니다. 채무가 있으면 한정승인이 안전할 수 있습니다.', 7),
    (p_checklist_id, '금융·상속',  'halfyear',  '상속세 신고',
       '사망일로부터 6개월 이내 관할 세무서에 상속세를 신고합니다.', 8),
    (p_checklist_id, '금융·상속',  'halfyear',  '부동산 명의 이전',
       '상속 부동산의 소유권 이전 등기 및 취득세 신고를 처리합니다.', 9);
end;
$$;

-- 5. 기본 더미 데이터 삽입 함수 (신규 세션 초기화에 사용)
create or replace function seed_default_checklist(p_session_id uuid)
returns uuid
language plpgsql
as $$
declare
  v_checklist_id uuid;
begin
  insert into checklists (session_id, title)
  values (p_session_id, '사후 체크리스트')
  returning id into v_checklist_id;

  perform _insert_default_items(v_checklist_id);
  return v_checklist_id;
end;
$$;
