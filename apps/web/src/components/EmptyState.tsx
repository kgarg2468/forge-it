import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cx } from "@/lib/utils";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cx(
        "flex flex-col items-center justify-center rounded-3xl border border-dashed border-line bg-cream-50/60 px-8 py-16 text-center",
        className,
      )}
    >
      {Icon && (
        <span className="mb-4 inline-flex size-14 items-center justify-center rounded-2xl bg-cream-200/80 text-ink-faint">
          <Icon size={24} strokeWidth={1.75} />
        </span>
      )}
      <h3 className="font-display text-xl text-ink">{title}</h3>
      {description && (
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-ink-muted">{description}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
