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
  title text not null,
  description text not null default '',
  completed boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists idx_items_checklist on checklist_items(checklist_id);
create index if not exists idx_items_sort on checklist_items(checklist_id, sort_order);

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

-- 4. 기본 더미 데이터 삽입 함수 (신규 세션 초기화에 사용)
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

  insert into checklist_items (checklist_id, category, title, description, sort_order) values
    (v_checklist_id, '행정·신고', '사망신고서 제출', '사망 후 1개월 이내, 가까운 주민센터 또는 시·구청에 사망신고를 접수합니다.', 1),
    (v_checklist_id, '행정·신고', '사망진단서 발급 (여러 부)', '장례·상속·보험 처리에 다수 필요합니다. 기본 7~10부 확보를 권장합니다.', 2),
    (v_checklist_id, '행정·신고', '주민등록 말소 확인', '사망신고 후 자동 처리되지만, 가족관계증명서에서 말소 여부를 확인합니다.', 3),
    (v_checklist_id, '장례·의례', '장례식장 및 장례 방식 결정', '매장·화장·수목장 등 고인의 생전 의사와 가족 합의에 따라 결정합니다.', 4),
    (v_checklist_id, '장례·의례', '부고 전달', '가까운 지인·직장·단체에 부고를 알립니다.', 5),
    (v_checklist_id, '금융·상속', '안심상속 원스톱 서비스 신청', '정부24에서 고인의 금융·부동산·세금 내역을 한 번에 조회할 수 있습니다.', 6),
    (v_checklist_id, '금융·상속', '상속 재산·부채 파악', '상속 포기·한정승인 여부 판단에 필요합니다. 사망일로부터 3개월 이내 결정.', 7),
    (v_checklist_id, '금융·상속', '보험금 청구', '생명보험·상해보험 수익자 확인 후 청구 서류를 준비합니다.', 8),
    (v_checklist_id, '디지털 자산', '온라인 계정 정리', '이메일·SNS·클라우드 등 주요 계정의 해지 또는 추모 전환을 처리합니다.', 9),
    (v_checklist_id, '디지털 자산', '자동결제·구독 해지', '카드 명세를 기준으로 정기결제 항목을 확인하고 해지합니다.', 10);

  return v_checklist_id;
end;
$$;
