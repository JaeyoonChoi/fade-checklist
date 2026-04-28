-- 008: 절세 전략 리포트 저장
--   사용자 입력 + 프로필 스냅샷을 바탕으로 AI가 생성한 리포트를 저장
--   recommended_items는 체크리스트 반영 시 사용

create table if not exists tax_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  profile_snapshot jsonb,
  report_input jsonb not null,
  summary text,
  markdown text not null,
  recommended_items jsonb not null default '[]'::jsonb,
  applied_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_tax_reports_user_created
  on tax_reports(user_id, created_at desc);

alter table tax_reports enable row level security;

create policy "own tax reports" on tax_reports
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
