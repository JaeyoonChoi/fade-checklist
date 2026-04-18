import { Topbar } from "@/components/Topbar";
import { GlassCard } from "@/components/GlassCard";
import { ChecklistBoard } from "@/components/ChecklistBoard";

type Props = {
  params: Promise<{ sessionId: string }>;
};

export default async function SharedChecklistPage({ params }: Props) {
  const { sessionId } = await params;

  return (
    <div className="max-w-[1400px]">
      <Topbar />

      <GlassCard strong className="p-7 mb-6">
        <p className="text-[11px] tracking-[0.2em] uppercase text-[var(--muted)] mb-2">
          공유된 체크리스트
        </p>
        <h1 className="text-[26px] font-semibold tracking-tight">
          함께 보는 체크리스트
        </h1>
        <p className="text-[13px] text-[var(--muted)] mt-2 leading-relaxed break-all">
          세션 <span className="font-mono">{sessionId}</span>의 체크리스트입니다.
          변경사항은 모두에게 공유됩니다.
        </p>
      </GlassCard>

      <ChecklistBoard mode="full" forcedSessionId={sessionId} />
    </div>
  );
}
