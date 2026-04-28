-- 005: 사용자당 체크리스트 1개 보장 + 시드 함수 멱등화
--   원인: dev StrictMode 등으로 ensureChecklist 동시 호출 → 같은 user에게 여러 체크리스트 생성
--   해결: user_id unique 제약 + seed 함수가 기존 체크리스트를 우선 반환하도록 수정

-- 기존 중복 정리: user별로 가장 오래된 1개만 남기고 나머지 삭제
delete from checklists c
using checklists older
where c.user_id = older.user_id
  and c.created_at > older.created_at;

-- 한 사용자당 한 체크리스트
alter table checklists
  add constraint checklists_user_id_key unique (user_id);

-- 시드 함수 멱등화: 이미 있으면 그것을 반환
drop function if exists seed_default_checklist(uuid);
create or replace function seed_default_checklist(p_user_id uuid)
returns uuid
language plpgsql
as $$
declare
  v_checklist_id uuid;
begin
  select id into v_checklist_id
  from checklists
  where user_id = p_user_id
  limit 1;

  if v_checklist_id is not null then
    return v_checklist_id;
  end if;

  insert into checklists (user_id, title)
  values (p_user_id, '사후 체크리스트')
  returning id into v_checklist_id;

  perform _insert_default_items(v_checklist_id);
  return v_checklist_id;
end;
$$;
