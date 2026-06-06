import type { ReactNode } from "react";
import { cx } from "@/lib/utils";

interface MetricStatProps {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
  className?: string;
}

export function MetricStat({ label, value, hint, icon, className }: MetricStatProps) {
  return (
    <div className={cx("flex flex-col gap-1", className)}>
      <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-faint">
        {icon}
        {label}
      </span>
      <span className="font-display text-lg leading-tight text-ink">{value}</span>
      {hint && <span className="text-xs text-ink-muted">{hint}</span>}
    </div>
  );
}
