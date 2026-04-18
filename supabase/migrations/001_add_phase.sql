-- 001: 체크리스트 항목에 시계열(phase) 컬럼 추가
-- Supabase SQL Editor에서 한 번 실행.

alter table checklist_items
  add column if not exists phase text not null default 'month';

create index if not exists idx_items_phase
  on checklist_items(checklist_id, phase);

-- 기존 시드 데이터 backfill (제목 기준)
update checklist_items set phase = 'immediate'
  where title in ('사망진단서 발급 (여러 부)', '장례식장 및 장례 방식 결정', '부고 전달');
update checklist_items set phase = 'week'
  where title = '자동결제·구독 해지';
update checklist_items set phase = 'month'
  where title in ('사망신고서 제출', '주민등록 말소 확인', '안심상속 원스톱 서비스 신청');
update checklist_items set phase = 'quarter'
  where title in ('상속 재산·부채 파악', '보험금 청구');
update checklist_items set phase = 'halfyear'
  where title = '온라인 계정 정리';

-- seed 함수 갱신: phase 포함
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

  insert into checklist_items (checklist_id, category, phase, title, description, sort_order) values
    (v_checklist_id, '행정·신고', 'month',     '사망신고서 제출', '사망 후 1개월 이내, 가까운 주민센터 또는 시·구청에 사망신고를 접수합니다.', 1),
    (v_checklist_id, '행정·신고', 'immediate', '사망진단서 발급 (여러 부)', '장례·상속·보험 처리에 다수 필요합니다. 기본 7~10부 확보를 권장합니다.', 2),
    (v_checklist_id, '행정·신고', 'month',     '주민등록 말소 확인', '사망신고 후 자동 처리되지만, 가족관계증명서에서 말소 여부를 확인합니다.', 3),
    (v_checklist_id, '장례·의례', 'immediate', '장례식장 및 장례 방식 결정', '매장·화장·수목장 등 고인의 생전 의사와 가족 합의에 따라 결정합니다.', 4),
    (v_checklist_id, '장례·의례', 'immediate', '부고 전달', '가까운 지인·직장·단체에 부고를 알립니다.', 5),
    (v_checklist_id, '금융·상속', 'month',     '안심상속 원스톱 서비스 신청', '정부24에서 고인의 금융·부동산·세금 내역을 한 번에 조회할 수 있습니다.', 6),
    (v_checklist_id, '금융·상속', 'quarter',   '상속 재산·부채 파악', '상속 포기·한정승인 여부 판단에 필요합니다. 사망일로부터 3개월 이내 결정.', 7),
    (v_checklist_id, '금융·상속', 'quarter',   '보험금 청구', '생명보험·상해보험 수익자 확인 후 청구 서류를 준비합니다.', 8),
    (v_checklist_id, '디지털 자산', 'halfyear', '온라인 계정 정리', '이메일·SNS·클라우드 등 주요 계정의 해지 또는 추모 전환을 처리합니다.', 9),
    (v_checklist_id, '디지털 자산', 'week',     '자동결제·구독 해지', '카드 명세를 기준으로 정기결제 항목을 확인하고 해지합니다.', 10);

  return v_checklist_id;
end;
$$;
