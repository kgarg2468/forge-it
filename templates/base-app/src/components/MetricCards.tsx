import type { ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "../lib/cn";

export interface Metric {
  /** Short label, e.g. "Pending refunds". */
  label: string;
  /** The primary value (already formatted). */
  value: ReactNode;
  /** Optional delta vs previous period. */
  delta?: {
    value: string;
    /** Direction of the change — controls color & arrow. */
    direction?: "up" | "down" | "neutral";
    /** When true, "up" is treated as bad (e.g. error rate). */
    invertColor?: boolean;
  };
  /** Optional leading icon. */
  icon?: ReactNode;
  /** Optional sub-text below the value. */
  hint?: string;
}

export interface MetricCardsProps {
  metrics: Metric[];
  /** Tailwind grid column count for >= md screens. Defaults to 4 (auto-clamped). */
  columns?: 2 | 3 | 4;
  className?: string;
}

const colClass: Record<number, string> = {
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-2 lg:grid-cols-3",
  4: "sm:grid-cols-2 lg:grid-cols-4",
};

export function MetricCards({
  metrics,
  columns = 4,
  className,
}: MetricCardsProps) {
  return (
    <div className={cn("grid grid-cols-1 gap-4", colClass[columns], className)}>
      {metrics.map((m, i) => {
        const dir = m.delta?.direction ?? "neutral";
        const good = m.delta?.invertColor ? dir === "down" : dir === "up";
        const deltaColor =
          dir === "neutral"
            ? "text-gray-500"
            : good
            ? "text-green-600"
            : "text-red-600";
        return (
          <div
            key={i}
            className="bg-white rounded-2xl border border-gray-100 shadow-card p-5 transition-shadow hover:shadow-card-hover"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-500">{m.label}</p>
              {m.icon && (
                <span className="text-gray-400" aria-hidden>
                  {m.icon}
                </span>
              )}
            </div>
            <div className="mt-2 flex items-end gap-2">
              <span className="text-2xl font-semibold tracking-tight text-ink-900">
                {m.value}
              </span>
              {m.delta && (
                <span
                  className={cn(
                    "inline-flex items-center gap-0.5 text-xs font-medium pb-1",
                    deltaColor
                  )}
                >
                  {dir === "up" && (
                    <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
                  )}
                  {dir === "down" && (
                    <ArrowDownRight className="h-3.5 w-3.5" aria-hidden />
                  )}
                  {m.delta.value}
                </span>
              )}
            </div>
            {m.hint && (
              <p className="text-xs text-gray-400 mt-1">{m.hint}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
