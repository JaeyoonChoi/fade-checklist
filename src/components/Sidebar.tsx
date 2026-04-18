import Link from "next/link";

const NAV = [
  { href: "/", label: "대시보드", hint: "overview" },
  { href: "/checklist", label: "체크리스트", hint: "list" },
  { href: "/settings", label: "프롬프트 설정", hint: "prompt" },
];

export function Sidebar() {
  return (
    <aside className="w-[240px] shrink-0 px-5 py-7 flex flex-col gap-8">
      <div className="flex items-center gap-2">
        <div className="size-9 rounded-xl bg-[var(--text)] text-[var(--accent-contrast)] grid place-items-center text-sm font-semibold">
          Af
        </div>
        <div className="leading-tight">
          <p className="text-[15px] font-semibold tracking-tight">Afterlife</p>
          <p className="text-[11px] text-[var(--muted)]">사후 체크리스트</p>
        </div>
      </div>

      <div>
        <p className="text-[10px] tracking-[0.18em] text-[var(--muted-soft)] uppercase mb-3 px-2">
          Overview
        </p>
        <nav className="flex flex-col gap-1">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="px-3 py-2 rounded-lg text-[14px] text-[var(--text-soft)] hover:bg-black/5 transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="mt-auto">
        <p className="text-[10px] tracking-[0.18em] text-[var(--muted-soft)] uppercase mb-3 px-2">
          Session
        </p>
        <div className="rounded-xl hairline border px-3 py-3">
          <p className="text-[11px] text-[var(--muted)]">세션 ID</p>
          <p className="text-[12px] font-mono text-[var(--text-soft)] truncate">
            미생성
          </p>
        </div>
      </div>
    </aside>
  );
}
