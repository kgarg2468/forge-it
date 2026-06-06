import { forwardRef } from "react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Link } from "react-router-dom";
import { cx } from "@/lib/utils";
import { Spinner } from "@/components/Spinner";

type Variant = "primary" | "secondary" | "ghost" | "outline" | "danger" | "ember";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 font-medium rounded-full transition-all duration-200 select-none disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-cream-100 active:scale-[0.98]";

const variants: Record<Variant, string> = {
  primary:
    "bg-ink text-cream-50 shadow-soft hover:bg-ink-soft hover:shadow-soft-lg focus-visible:ring-ink/40",
  ember:
    "bg-forge-500 text-white shadow-glow hover:bg-forge-600 focus-visible:ring-forge-500/40",
  secondary:
    "bg-cream-50 text-ink border border-line hover:bg-cream-200/70 hover:border-ink/15 focus-visible:ring-ink/20",
  outline:
    "bg-transparent text-ink border border-ink/15 hover:bg-ink/[0.04] focus-visible:ring-ink/20",
  ghost: "bg-transparent text-ink-soft hover:bg-ink/[0.05] focus-visible:ring-ink/20",
  danger:
    "bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 focus-visible:ring-red-400/40",
};

const sizes: Record<Size, string> = {
  sm: "text-[13px] px-3.5 h-9",
  md: "text-sm px-5 h-11",
  lg: "text-[15px] px-7 h-[52px]",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", loading, leftIcon, rightIcon, className, children, disabled, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cx(base, variants[variant], sizes[size], className)}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? <Spinner size={size === "lg" ? 18 : 15} /> : leftIcon}
      {children}
      {!loading && rightIcon}
    </button>
  );
});

export interface LinkButtonProps {
  to: string;
  variant?: Variant;
  size?: Size;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  className?: string;
  children: ReactNode;
}

export function LinkButton({
  to,
  variant = "primary",
  size = "md",
  leftIcon,
  rightIcon,
  className,
  children,
}: LinkButtonProps) {
  return (
    <Link to={to} className={cx(base, variants[variant], sizes[size], className)}>
      {leftIcon}
      {children}
      {rightIcon}
    </Link>
  );
}
