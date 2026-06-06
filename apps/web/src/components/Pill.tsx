import type { ReactNode } from "react";
import { cx } from "@/lib/utils";

interface PillProps {
  children: ReactNode;
  active?: boolean;
  onClick?: () => void;
  count?: number;
  leftDot?: string;
  className?: string;
}

export function Pill({ children, active, onClick, count, leftDot, className }: PillProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        "group inline-flex items-center gap-2 rounded-full border px-4 h-9 text-[13px] font-medium transition-all duration-200 active:scale-[0.97]",
        active
          ? "border-ink bg-ink text-cream-50 shadow-soft"
          : "border-line bg-cream-50 text-ink-soft hover:border-ink/20 hover:bg-cream-200/60",
        className,
      )}
    >
      {leftDot && (
        <span
          className="size-2 rounded-full"
          style={{ backgroundColor: leftDot }}
          aria-hidden
        />
      )}
      {children}
      {count !== undefined && (
        <span
          className={cx(
            "ml-0.5 min-w-[18px] rounded-full px-1.5 text-[11px] font-semibold tabular-nums",
            active ? "bg-cream-50/20 text-cream-50" : "bg-ink/[0.06] text-ink-muted",
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}

interface TagProps {
  children: ReactNode;
  tone?: "neutral" | "ink" | "ember";
  className?: string;
}

export function Tag({ children, tone = "neutral", className }: TagProps) {
  const tones = {
    neutral: "bg-cream-200/70 text-ink-muted border-line",
    ink: "bg-ink/[0.05] text-ink-soft border-ink/10",
    ember: "bg-forge-50 text-forge-600 border-forge-100",
  };
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
