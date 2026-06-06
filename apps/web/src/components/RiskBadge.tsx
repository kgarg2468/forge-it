import { ShieldCheck, ShieldAlert, ShieldX } from "lucide-react";
import { cx } from "@/lib/utils";

const map: Record<string, { className: string; icon: typeof ShieldCheck; label: string }> = {
  low: { className: "bg-sage-100 text-sage-600 border-sage-500/20", icon: ShieldCheck, label: "low risk" },
  medium: { className: "bg-amber-50 text-amber-700 border-amber-200", icon: ShieldAlert, label: "medium risk" },
  high: { className: "bg-red-50 text-red-700 border-red-200", icon: ShieldX, label: "high risk" },
};

export function RiskBadge({ risk }: { risk: string }) {
  const meta = map[risk?.toLowerCase()] ?? {
    className: "bg-cream-200/80 text-ink-muted border-line",
    icon: ShieldCheck,
    label: `${risk} risk`,
  };
  const Icon = meta.icon;
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium",
        meta.className,
      )}
    >
      <Icon size={12} strokeWidth={2.2} />
      {meta.label}
    </span>
  );
}
