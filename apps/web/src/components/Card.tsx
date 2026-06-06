import type { HTMLAttributes, ReactNode } from "react";
import { cx } from "@/lib/utils";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  hover?: boolean;
  padded?: boolean;
}

export function Card({ children, hover, padded = true, className, ...rest }: CardProps) {
  return (
    <div
      className={cx(
        "rounded-3xl border border-line bg-cream-50 shadow-card",
        padded && "p-6",
        hover &&
          "transition-all duration-300 hover:-translate-y-0.5 hover:shadow-soft-lg hover:border-ink/10",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

export function SectionLabel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p
      className={cx(
        "text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-faint",
        className,
      )}
    >
      {children}
    </p>
  );
}
