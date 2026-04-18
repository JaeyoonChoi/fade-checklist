# Afterlife Checklist

사망 후 유가족 또는 당사자가 수행해야 할 일들을 체크리스트로 관리하는 웹앱.

- **스택**: Next.js 16 (App Router) + TypeScript + Tailwind 4 + Supabase
- **디자인**: Monochrome + Glassmorphism
- **인증**: 없음 (브라우저 UUID 세션)
- **공유**: `/c/[sessionId]` URL

## 빠른 시작

### 1. 의존성 설치

```bash
npm install
```

### 2. Supabase 프로젝트 준비

1. [supabase.com](https://supabase.com)에서 새 프로젝트 생성
2. Project Settings → API 에서 **Project URL** 과 **anon public key** 복사
3. 루트에 `.env.local` 생성:

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
   ```

4. Supabase Dashboard → **SQL Editor**에서 [`supabase/schema.sql`](supabase/schema.sql) 전체 내용을 붙여넣고 실행

### 3. 개발 서버 실행

```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000) 접속.

## Phase 진행 상황

- [x] **Phase 1**: 프로젝트 골격 + 정적 UI (Monochrome/Glassmorphism 디자인)
- [x] **Phase 2**: Supabase 연동 — 체크 상태 저장 + 공유 URL (`/c/[sessionId]`)
- [ ] **Phase 3**: AI 프롬프트 편집 + AI가 체크리스트 생성
- [ ] **Phase 4**: Vercel 배포 및 공유

## 구조

```
src/
├─ app/
│  ├─ page.tsx            # 대시보드 (내 체크리스트 미리보기)
│  ├─ checklist/page.tsx  # 전체 체크리스트 (카테고리별)
│  ├─ settings/page.tsx   # AI 프롬프트 설정 (Phase 3에서 활성화)
│  └─ c/[sessionId]/page.tsx  # 공유된 체크리스트
├─ components/            # Sidebar, Topbar, StatsPanel, GlassCard, ChecklistBoard
└─ lib/                   # supabase, session, checklists 데이터 레이어
supabase/schema.sql       # 1회 실행용 스키마
```

## 공유 방법

페이지 하단에 표시되는 `/c/{sessionId}` URL을 공유하면, 상대방이 같은 체크리스트를 보고 수정할 수 있습니다. **세션 ID가 노출된 사람은 누구나 수정 가능함**을 유의하세요 (Phase 2 한정, 인증 없음).
