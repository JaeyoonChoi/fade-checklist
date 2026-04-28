-- 004: Supabase Auth 도입
--   기존 session_id 기반 데이터 제거 → user_id (auth.users) 기반으로 전환
--   주의: 기존 체크리스트/프로필 데이터는 모두 삭제됩니다.

-- 기존 데이터 정리
delete from checklist_items;
delete from checklists;
delete from user_profiles;

-- 기존 RLS 정책 제거
drop policy if exists "public read checklists" on checklists;
drop policy if exists "public write checklists" on checklists;
drop policy if exists "public read items" on checklist_items;
drop policy if exists "public write items" on checklist_items;
drop policy if exists "public read profiles" on user_profiles;
drop policy if exists "public write profiles" on user_profiles;

-- 인덱스 정리
drop index if exists idx_checklists_session;
drop index if exists idx_profiles_session;

-- 컬럼 교체
alter table checklists
  drop column if exists session_id,
  add column if not exists user_id uuid not null references auth.users(id) on delete cascade;
create index if not exists idx_checklists_user on checklists(user_id);

alter table user_profiles
  drop column if exists session_id,
  add column if not exists user_id uuid not null unique references auth.users(id) on delete cascade;
create index if not exists idx_profiles_user on user_profiles(user_id);

-- 새 RLS 정책: 본인 데이터만
create policy "own checklists" on checklists
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "own items" on checklist_items
  for all
  using (
    exists (
      select 1 from checklists c
      where c.id = checklist_items.checklist_id
        and c.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from checklists c
      where c.id = checklist_items.checklist_id
        and c.user_id = auth.uid()
    )
  );

create policy "own profile" on user_profiles
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- seed 함수 갱신: session_id → user_id
-- (파라미터명 변경 때문에 create or replace 불가 → drop 먼저)
drop function if exists seed_default_checklist(uuid);
create or replace function seed_default_checklist(p_user_id uuid)
returns uuid
language plpgsql
as $$
declare
  v_checklist_id uuid;
begin
  insert into checklists (user_id, title)
  values (p_user_id, '사후 체크리스트')
  returning id into v_checklist_id;

  perform _insert_default_items(v_checklist_id);
  return v_checklist_id;
end;
$$;
