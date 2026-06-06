import type { ReactNode } from "react";
import { cn } from "../lib/cn";

export type BadgeTone =
  | "neutral"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "purple";

const tones: Record<BadgeTone, string> = {
  neutral: "bg-gray-100 text-gray-700",
  success: "bg-green-50 text-green-700",
  warning: "bg-amber-50 text-amber-700",
  danger: "bg-red-50 text-red-700",
  info: "bg-blue-50 text-blue-700",
  purple: "bg-purple-50 text-purple-700",
};

/** Map a free-form status string to a sensible tone. */
function toneForStatus(status: string): BadgeTone {
  const s = status.toLowerCase();
  if (
    /(success|succeeded|approved|active|paid|completed|complete|done|resolved|open|live|enabled|ok|passed)/.test(
      s
    )
  )
    return "success";
  if (
    /(pending|processing|in[\s_-]?progress|review|waiting|queued|draft|scheduled)/.test(
      s
    )
  )
    return "warning";
  if (
    /(failed|error|rejected|declined|cancelled|canceled|denied|blocked|overdue|disabled|inactive|closed)/.test(
      s
    )
  )
    return "danger";
  if (/(info|new|created|note)/.test(s)) return "info";
  if (/(refunded|partial|hold|paused)/.test(s)) return "purple";
  return "neutral";
}

export interface StatusBadgeProps {
  /** Status string — color is inferred unless `tone` is provided. */
  status: string;
  /** Force a specific tone. */
  tone?: BadgeTone;
  /** Optional leading dot. Defaults to true. */
  dot?: boolean;
  /** Override the visible label (defaults to the status). */
  children?: ReactNode;
  className?: string;
}

const dotColors: Record<BadgeTone, string> = {
  neutral: "bg-gray-500",
  success: "bg-green-500",
  warning: "bg-amber-500",
  danger: "bg-red-500",
  info: "bg-blue-500",
  purple: "bg-purple-500",
};

export function StatusBadge({
  status,
  tone,
  dot = true,
  children,
  className,
}: StatusBadgeProps) {
  const resolved = tone ?? toneForStatus(status);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium capitalize",
        tones[resolved],
        className
      )}
    >
      {dot && (
        <span className={cn("h-1.5 w-1.5 rounded-full", dotColors[resolved])} />
      )}
      {children ?? status.replace(/[_-]+/g, " ")}
    </span>
  );
}
