import { Loader2 } from "lucide-react";
import { cn } from "../lib/cn";

export interface SpinnerProps {
  /** Tailwind size classes, e.g. "h-5 w-5". Defaults to "h-5 w-5". */
  className?: string;
  /** Optional label rendered next to the spinner. */
  label?: string;
}

export function Spinner({ className, label }: SpinnerProps) {
  return (
    <span className="inline-flex items-center gap-2 text-gray-500">
      <Loader2
        className={cn("animate-spin h-5 w-5", className)}
        aria-hidden
      />
      {label && <span className="text-sm">{label}</span>}
    </span>
  );
}

/** Centered, full-area loading state. */
export function LoadingBlock({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center py-12">
      <Spinner label={label} />
    </div>
  );
}
