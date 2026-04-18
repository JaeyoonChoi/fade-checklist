type Props = {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
};

const SIZE_MAP = {
  sm: "text-[22px]",
  md: "text-[34px]",
  lg: "text-[64px]",
  xl: "text-[96px] md:text-[128px]",
};

const LETTERS = [
  { ch: "F", opacity: 1 },
  { ch: "A", opacity: 0.68 },
  { ch: "D", opacity: 0.38 },
  { ch: "E", opacity: 0.18 },
];

export function Wordmark({ size = "md", className = "" }: Props) {
  return (
    <span
      className={`inline-flex font-black tracking-[-0.04em] leading-none select-none text-[var(--text)] ${SIZE_MAP[size]} ${className}`.trim()}
      aria-label="FADE"
    >
      {LETTERS.map((l, i) => (
        <span key={i} aria-hidden style={{ opacity: l.opacity }}>
          {l.ch}
        </span>
      ))}
    </span>
  );
}
