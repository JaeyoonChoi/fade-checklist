import { Topbar } from "@/components/Topbar";
import { GlassCard } from "@/components/GlassCard";
import { TaxReportPanel } from "@/components/TaxReportPanel";

export default function ReportPage() {
  return (
    <div className="max-w-[900px]">
      <Topbar />
      <GlassCard strong className="p-7 mb-5">
        <p className="text-[11px] tracking-[0.2em] uppercase text-[var(--muted)] mb-2">
          Tax Strategy
        </p>
        <h1 className="text-[22px] font-semibold tracking-tight mb-2">
          맞춤 절세 전략 리포트
        </h1>
        <p className="text-[13px] text-[var(--muted)] leading-relaxed">
          프로필에 입력한 정보와 아래 추가 정보를 바탕으로, 한국 상속·증여세
          기준 절세 전략 리포트를 AI가 생성합니다. 결과는 저장되며, 추천 항목을
          체크리스트에 바로 반영할 수 있어요.
        </p>
      </GlassCard>
      <TaxReportPanel />
    </div>
  );
}
