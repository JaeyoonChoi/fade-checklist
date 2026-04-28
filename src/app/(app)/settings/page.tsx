import { Topbar } from "@/components/Topbar";
import { GlassCard } from "@/components/GlassCard";

export default function SettingsPage() {
  return (
    <div className="max-w-[900px]">
      <Topbar />

      <GlassCard strong className="p-7 mb-6">
        <p className="text-[11px] tracking-[0.2em] uppercase text-[var(--muted)] mb-2">
          Settings
        </p>
        <h1 className="text-[26px] font-semibold tracking-tight">
          AI 프롬프트 설정
        </h1>
        <p className="text-[13px] text-[var(--muted)] mt-2 leading-relaxed">
          체크리스트 생성에 사용할 기본 시스템 프롬프트입니다. Phase 3에서 편집·저장
          기능이 활성화됩니다.
        </p>
      </GlassCard>

      <GlassCard className="p-6">
        <label className="block text-[13px] font-medium mb-3">
          시스템 프롬프트
        </label>
        <textarea
          readOnly
          rows={12}
          defaultValue={`당신은 한국 법·행정 기준을 숙지한 사후 처리 가이드입니다.
사용자의 상황(연령, 가족 구성, 재산 형태, 특이사항)을 입력받아,
사망 후 유가족 또는 당사자가 수행해야 할 일들을 체크리스트로 정리해 주세요.

- 행정·신고, 장례·의례, 금융·상속, 디지털 자산 등 카테고리로 분류
- 각 항목은 title과 description을 포함
- 출력 형식은 JSON 배열: [{ category, title, description }]`}
          className="w-full bg-white/40 border hairline rounded-xl p-4 text-[13px] font-mono leading-relaxed text-[var(--text-soft)] outline-none resize-none"
        />
        <div className="flex items-center justify-between mt-4">
          <p className="text-[12px] text-[var(--muted)]">
            편집·저장은 Phase 3에서 제공됩니다
          </p>
          <div className="flex gap-2">
            <button
              disabled
              className="px-4 h-10 rounded-full hairline border text-[13px] text-[var(--muted)] cursor-not-allowed"
            >
              기본값으로 리셋
            </button>
            <button
              disabled
              className="px-4 h-10 rounded-full bg-[var(--text)]/40 text-white text-[13px] cursor-not-allowed"
            >
              저장
            </button>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
