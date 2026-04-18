import { GlassCard } from "./GlassCard";

type Props = {
  total: number;
  done: number;
};

export function StatsPanel({ total, done }: Props) {
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);

  return (
    <aside className="w-[300px] shrink-0 flex flex-col gap-5">
      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-[14px] font-semibold tracking-tight">진행률</h3>
          <button
            type="button"
            aria-label="more"
            className="text-[var(--muted)] hover:text-[var(--text)]"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="5" cy="12" r="1.5" />
              <circle cx="12" cy="12" r="1.5" />
              <circle cx="19" cy="12" r="1.5" />
            </svg>
          </button>
        </div>

        <div className="flex flex-col items-center mb-4">
          <ProgressRing percent={percent} />
          <p className="mt-4 text-[15px] font-medium">차근차근 준비하세요</p>
          <p className="text-[12px] text-[var(--muted)] mt-1">
            완료된 항목 {done}개 / 전체 {total}개
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2 mt-4">
          {["이번 주", "지난 주", "총합"].map((label, i) => (
            <div
              key={label}
              className="rounded-xl hairline border py-3 flex flex-col items-center"
            >
              <p className="text-[11px] text-[var(--muted)]">{label}</p>
              <p className="text-[15px] font-semibold mt-0.5">
                {i === 2 ? done : i === 0 ? Math.min(done, 3) : 0}
              </p>
            </div>
          ))}
        </div>
      </GlassCard>

      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[14px] font-semibold tracking-tight">가이드</h3>
        </div>
        <ul className="flex flex-col gap-3">
          {[
            "필요한 서류는 여유있게 준비하세요",
            "상속 결정은 3개월 이내",
            "디지털 자산도 잊지 마세요",
          ].map((tip) => (
            <li
              key={tip}
              className="flex gap-3 text-[13px] text-[var(--text-soft)]"
            >
              <span className="mt-1.5 size-1 rounded-full bg-[var(--text)] shrink-0" />
              {tip}
            </li>
          ))}
        </ul>
      </GlassCard>
    </aside>
  );
}

function ProgressRing({ percent }: { percent: number }) {
  const size = 120;
  const stroke = 8;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (percent / 100) * c;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="rgba(0,0,0,0.08)"
          strokeWidth={stroke}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="var(--text)"
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 400ms ease" }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <span className="text-[22px] font-semibold tracking-tight">
          {percent}%
        </span>
      </div>
    </div>
  );
}
