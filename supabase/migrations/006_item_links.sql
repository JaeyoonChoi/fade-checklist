-- 006: 체크리스트 항목별 외부 링크
--   각 항목에서 실제 처리할 수 있는 정부/공공 사이트 URL을 첨부
--   기존 체크 상태는 보존 (재시드 없음)

alter table checklist_items
  add column if not exists link_url text;

-- 기본 항목 함수 갱신: 신규 시드 시 link_url 함께 삽입
create or replace function _insert_default_items(p_checklist_id uuid)
returns void
language plpgsql
as $$
begin
  insert into checklist_items (checklist_id, category, phase, title, description, sort_order, link_url) values
    (p_checklist_id, '행정·신고',  'immediate', '사망진단서 발급',
       '사망진단서는 장례·상속·보험·은행 등 여러 곳에서 필요합니다. 7~10부 정도 여유있게 준비하세요.', 1,
       null),
    (p_checklist_id, '장례·의례',  'immediate', '장례 진행',
       '장례식장 선정, 장례 방식(매장·화장·수목장) 결정 및 장례 절차를 진행합니다.', 2,
       'https://www.ehaneul.go.kr'),
    (p_checklist_id, '장례·의례',  'immediate', '부고·조문 관리',
       '가까운 지인·직장·단체에 부고를 전하고, 조문·부의 기록을 정리합니다.', 3,
       null),
    (p_checklist_id, '행정·신고',  'month',     '사망신고서 제출',
       '사망일로부터 1개월 이내 주민센터 또는 시·구청에 사망신고를 접수합니다.', 4,
       'https://www.gov.kr'),
    (p_checklist_id, '행정·신고',  'month',     '사망 등본 발급',
       '사망신고 처리 후 가족관계증명서·주민등록등본에서 사망(말소) 표기를 확인·발급합니다.', 5,
       'https://efamily.scourt.go.kr'),
    (p_checklist_id, '금융·상속',  'month',     '안심상속 원스톱 서비스 신청',
       '사망신고 직후 정부24에서 금융·채무·부동산·보험·세금 체납 여부를 한 번에 조회할 수 있습니다.', 6,
       'https://www.gov.kr/portal/onestopSvc/safeInheritance'),
    (p_checklist_id, '금융·상속',  'quarter',   '상속 여부 결정 (상속포기·한정승인)',
       '사망일로부터 3개월 이내 단순승인·한정승인·상속포기 중 선택합니다. 채무가 있으면 한정승인이 안전할 수 있습니다.', 7,
       'https://ecfs.scourt.go.kr'),
    (p_checklist_id, '금융·상속',  'halfyear',  '상속세 신고',
       '사망일로부터 6개월 이내 관할 세무서에 상속세를 신고합니다.', 8,
       'https://hometax.go.kr'),
    (p_checklist_id, '금융·상속',  'halfyear',  '부동산 명의 이전',
       '상속 부동산의 소유권 이전 등기 및 취득세 신고를 처리합니다.', 9,
       'http://www.iros.go.kr');
end;
$$;

-- 기존 체크리스트의 항목들에 링크 채우기 (체크 상태는 그대로)
update checklist_items set link_url = 'https://www.ehaneul.go.kr'
  where title = '장례 진행' and link_url is null;
update checklist_items set link_url = 'https://www.gov.kr'
  where title = '사망신고서 제출' and link_url is null;
update checklist_items set link_url = 'https://efamily.scourt.go.kr'
  where title = '사망 등본 발급' and link_url is null;
update checklist_items set link_url = 'https://www.gov.kr/portal/onestopSvc/safeInheritance'
  where title = '안심상속 원스톱 서비스 신청' and link_url is null;
update checklist_items set link_url = 'https://ecfs.scourt.go.kr'
  where title = '상속 여부 결정 (상속포기·한정승인)' and link_url is null;
update checklist_items set link_url = 'https://hometax.go.kr'
  where title = '상속세 신고' and link_url is null;
update checklist_items set link_url = 'http://www.iros.go.kr'
  where title = '부동산 명의 이전' and link_url is null;
