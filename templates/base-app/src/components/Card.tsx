import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../lib/cn";

export interface CardProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  /** Optional header title. */
  title?: ReactNode;
  /** Optional sub-text under the title. */
  description?: ReactNode;
  /** Right-aligned header content (buttons, filters …). */
  actions?: ReactNode;
  /** Remove inner padding (useful for tables that bleed to edges). */
  flush?: boolean;
}

export function Card({
  title,
  description,
  actions,
  flush = false,
  className,
  children,
  ...rest
}: CardProps) {
  const hasHeader = Boolean(title || description || actions);
  return (
    <div
      className={cn(
        "bg-white rounded-2xl border border-gray-100 shadow-card",
        className
      )}
      {...rest}
    >
      {hasHeader && (
        <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-gray-100">
          <div className="min-w-0">
            {title && (
              <h3 className="text-base font-semibold text-ink-900 truncate">
                {title}
              </h3>
            )}
            {description && (
              <p className="text-sm text-gray-500 mt-0.5">{description}</p>
            )}
          </div>
          {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
        </div>
      )}
      <div className={cn(!flush && "p-5")}>{children}</div>
    </div>
  );
}
