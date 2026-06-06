import { forwardRef } from "react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "../lib/cn";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  /** Icon rendered before the label. */
  leftIcon?: ReactNode;
  /** Icon rendered after the label. */
  rightIcon?: ReactNode;
}

const base =
  "inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-colors select-none disabled:opacity-50 disabled:cursor-not-allowed focus-visible:focus-ring whitespace-nowrap";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-ink-900 text-white hover:bg-ink-700 active:bg-ink-800",
  secondary:
    "bg-white text-ink-900 border border-gray-200 hover:bg-gray-50 active:bg-gray-100",
  ghost: "bg-transparent text-ink-900 hover:bg-gray-100 active:bg-gray-200",
  danger: "bg-red-600 text-white hover:bg-red-700 active:bg-red-800",
};

const sizes: Record<ButtonSize, string> = {
  sm: "text-sm h-8 px-3",
  md: "text-sm h-10 px-4",
  lg: "text-base h-12 px-5",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      variant = "primary",
      size = "md",
      loading = false,
      leftIcon,
      rightIcon,
      className,
      children,
      disabled,
      ...rest
    },
    ref
  ) {
    return (
      <button
        ref={ref}
        className={cn(base, variants[variant], sizes[size], className)}
        disabled={disabled || loading}
        {...rest}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        ) : (
          leftIcon
        )}
        {children}
        {!loading && rightIcon}
      </button>
    );
  }
);
