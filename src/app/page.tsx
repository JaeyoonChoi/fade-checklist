import Link from "next/link";
import { Topbar } from "@/components/Topbar";
import { GlassCard } from "@/components/GlassCard";
import { ChecklistBoard } from "@/components/ChecklistBoard";

export default function Dashboard() {
  return (
    <div className="max-w-[1400px]">
      <Topbar />

      <GlassCard strong className="relative overflow-hidden p-8 mb-6">
        <div className="absolute inset-0 opacity-60 pointer-events-none">
          <div className="absolute -top-20 -right-10 size-64 rounded-full bg-black/5 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 size-48 rounded-full bg-black/5 blur-3xl" />
        </div>
        <div className="relative">
          <p className="text-[11px] tracking-[0.2em] uppercase text-[var(--muted)] mb-3">
            Afterlife Checklist
          </p>
          <h1 className="text-[30px] md:text-[36px] font-semibold tracking-tight leading-tight max-w-[640px]">
            떠나기 전에, 그리고 떠난 뒤에
            <br />
            해야 할 일들을 차근차근
          </h1>
          <p className="text-[14px] text-[var(--muted)] mt-4 max-w-[560px] leading-relaxed">
            행정·금융·디지털 자산까지 — 혼란스러운 순간에도 놓치지 않도록 정리된
            체크리스트를 제공합니다. 상태는 자동 저장되고 URL로 공유할 수 있어요.
          </p>
          <div className="mt-6 flex gap-3">
            <Link
              href="/checklist"
              className="inline-flex items-center gap-2 px-5 h-11 rounded-full bg-[var(--text)] text-[var(--accent-contrast)] text-[14px] font-medium hover:opacity-90 transition"
            >
              체크리스트 보기
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </Link>
            <Link
              href="/settings"
              className="inline-flex items-center px-5 h-11 rounded-full hairline border text-[14px] font-medium text-[var(--text-soft)] hover:bg-black/5 transition"
            >
              프롬프트 설정
            </Link>
          </div>
        </div>
      </GlassCard>

      <ChecklistBoard mode="preview" />
    </div>
  );
}
