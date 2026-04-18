export function Topbar() {
  return (
    <div className="flex items-center gap-4 mb-6">
      <div className="glass rounded-full flex-1 h-12 px-5 flex items-center gap-3">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-[var(--muted)]"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <input
          type="text"
          placeholder="체크리스트 항목 검색"
          className="bg-transparent outline-none text-[14px] text-[var(--text)] placeholder:text-[var(--muted-soft)] flex-1"
        />
      </div>
      <button
        type="button"
        className="glass glass-hover size-12 rounded-full grid place-items-center"
        aria-label="알림"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 8 3 8H3s3-1 3-8" />
          <path d="M10 21a2 2 0 0 0 4 0" />
        </svg>
      </button>
      <div className="glass rounded-full h-12 pl-2 pr-5 flex items-center gap-3">
        <div className="size-9 rounded-full bg-[var(--text)] text-[var(--accent-contrast)] grid place-items-center text-[12px] font-semibold">
          나
        </div>
        <span className="text-[14px] text-[var(--text-soft)]">사용자</span>
      </div>
    </div>
  );
}
