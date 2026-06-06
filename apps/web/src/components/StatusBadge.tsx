import { cx } from "@/lib/utils";
import type { JobStatus, ToolStatus } from "@/types";

interface StatusMeta {
  label: string;
  dot: string;
  className: string;
  pulse?: boolean;
}

const toolStatusMap: Record<string, StatusMeta> = {
  live: {
    label: "Live",
    dot: "bg-sage-500",
    className: "bg-sage-100 text-sage-600 border-sage-500/20",
  },
  draft: {
    label: "Draft",
    dot: "bg-ink-faint",
    className: "bg-cream-200/80 text-ink-muted border-line",
  },
  building: {
    label: "Building",
    dot: "bg-amber-500",
    className: "bg-amber-50 text-amber-700 border-amber-200",
    pulse: true,
  },
  review_needed: {
    label: "Needs review",
    dot: "bg-orange-500",
    className: "bg-orange-50 text-orange-700 border-orange-200",
  },
  preview_ready: {
    label: "Preview ready",
    dot: "bg-blue-500",
    className: "bg-blue-50 text-blue-700 border-blue-200",
  },
  failed: {
    label: "Failed",
    dot: "bg-red-500",
    className: "bg-red-50 text-red-700 border-red-200",
  },
};

export function statusMeta(status: string): StatusMeta {
  return (
    toolStatusMap[status] ?? {
      label: status.replace(/[_-]+/g, " "),
      dot: "bg-ink-faint",
      className: "bg-cream-200/80 text-ink-muted border-line",
    }
  );
}

export function StatusBadge({
  status,
  size = "md",
}: {
  status: ToolStatus;
  size?: "sm" | "md";
}) {
  const meta = statusMeta(String(status));
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 rounded-full border font-medium capitalize",
        meta.className,
        size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs",
      )}
    >
      <span
        className={cx("size-1.5 rounded-full", meta.dot, meta.pulse && "animate-pulse-soft")}
        aria-hidden
      />
      {meta.label}
    </span>
  );
}

const jobStatusMap: Record<JobStatus, { label: string; className: string }> = {
  queued: { label: "Queued", className: "bg-cream-200 text-ink-muted" },
  running: { label: "Running", className: "bg-amber-50 text-amber-700" },
  waiting_for_user: { label: "Waiting", className: "bg-blue-50 text-blue-700" },
  succeeded: { label: "Succeeded", className: "bg-sage-100 text-sage-600" },
  failed: { label: "Failed", className: "bg-red-50 text-red-700" },
  cancelled: { label: "Cancelled", className: "bg-cream-200 text-ink-muted" },
};

export function JobBadge({ status }: { status: JobStatus }) {
  const meta = jobStatusMap[status] ?? jobStatusMap.queued;
  return (
    <span className={cx("rounded-full px-2.5 py-1 text-xs font-medium", meta.className)}>
      {meta.label}
    </span>
  );
}
