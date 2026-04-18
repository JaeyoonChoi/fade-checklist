import { Topbar } from "@/components/Topbar";
import { ChecklistBoard } from "@/components/ChecklistBoard";
import { GlassCard } from "@/components/GlassCard";

export default function ChecklistPage() {
  return (
    <div className="max-w-[1400px]">
      <Topbar />

      <GlassCard strong className="p-7 mb-6">
        <p className="text-[11px] tracking-[0.2em] uppercase text-[var(--muted)] mb-2">
          Checklist
        </p>
        <h1 className="text-[26px] font-semibold tracking-tight">
          전체 체크리스트
        </h1>
        <p className="text-[13px] text-[var(--muted)] mt-2 leading-relaxed">
          카테고리별로 정리된 항목을 체크해보세요. 변경사항은 자동 저장되며, 하단의
          공유 URL로 다른 사람과 동일한 체크리스트를 함께 볼 수 있습니다.
        </p>
      </GlassCard>

      <ChecklistBoard mode="full" />
    </div>
  );
}
