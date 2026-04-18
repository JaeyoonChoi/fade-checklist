import { HTMLAttributes } from "react";

type Props = HTMLAttributes<HTMLDivElement> & {
  strong?: boolean;
  hoverable?: boolean;
};

export function GlassCard({
  strong = false,
  hoverable = false,
  className = "",
  children,
  ...rest
}: Props) {
  const base = strong ? "glass-strong" : "glass";
  const hover = hoverable ? "glass-hover" : "";
  return (
    <div
      {...rest}
      className={`rounded-2xl ${base} ${hover} ${className}`.trim()}
    >
      {children}
    </div>
  );
}
