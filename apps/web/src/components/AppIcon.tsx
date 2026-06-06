import {
  Mail,
  MessageSquare,
  CreditCard,
  Users,
  FileText,
  GitBranch,
  Table,
  Grid3x3,
  Github,
  Boxes,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cx } from "@/lib/utils";

interface ProviderMeta {
  icon: LucideIcon;
  accent: string;
  label: string;
}

// Mirrors the backend catalog accents; lucide icons stand in for brand logos.
const PROVIDERS: Record<string, ProviderMeta> = {
  gmail: { icon: Mail, accent: "#EA4335", label: "Gmail" },
  slack: { icon: MessageSquare, accent: "#611f69", label: "Slack" },
  stripe: { icon: CreditCard, accent: "#635bff", label: "Stripe" },
  hubspot: { icon: Users, accent: "#ff7a59", label: "HubSpot" },
  notion: { icon: FileText, accent: "#1a1714", label: "Notion" },
  linear: { icon: GitBranch, accent: "#5e6ad2", label: "Linear" },
  sheets: { icon: Table, accent: "#0f9d58", label: "Sheets" },
  airtable: { icon: Grid3x3, accent: "#fcb400", label: "Airtable" },
  github: { icon: Github, accent: "#1a1714", label: "GitHub" },
};

export function providerMeta(provider: string): ProviderMeta {
  return PROVIDERS[provider] ?? { icon: Boxes, accent: "#6F6A60", label: provider };
}

interface AppIconProps {
  provider: string;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
  /** Override accent (e.g. from live catalog). */
  accent?: string;
}

const sizeMap = {
  xs: { box: "size-6 rounded-lg", icon: 13 },
  sm: { box: "size-8 rounded-[10px]", icon: 16 },
  md: { box: "size-10 rounded-xl", icon: 19 },
  lg: { box: "size-12 rounded-2xl", icon: 23 },
};

export function AppIcon({ provider, size = "sm", className, accent }: AppIconProps) {
  const meta = providerMeta(provider);
  const Icon = meta.icon;
  const color = accent ?? meta.accent;
  const s = sizeMap[size];
  return (
    <span
      className={cx(
        "inline-flex items-center justify-center border border-black/5 shadow-sm",
        s.box,
        className,
      )}
      style={{
        backgroundColor: `${color}14`,
        color,
      }}
      title={meta.label}
    >
      <Icon size={s.icon} strokeWidth={2} />
    </span>
  );
}

/** Compact chip with icon + label, used on tool cards. */
export function AppChip({ provider, accent }: { provider: string; accent?: string }) {
  const meta = providerMeta(provider);
  const Icon = meta.icon;
  const color = accent ?? meta.accent;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border border-line bg-cream-50 py-1 pl-1.5 pr-2.5 text-[11px] font-medium text-ink-soft"
      title={meta.label}
    >
      <span
        className="inline-flex size-4 items-center justify-center rounded-md"
        style={{ backgroundColor: `${color}1f`, color }}
      >
        <Icon size={10} strokeWidth={2.5} />
      </span>
      {meta.label}
    </span>
  );
}

/** Overlapping avatar-style stack of provider icons. */
export function AppStack({ providers, max = 4 }: { providers: string[]; max?: number }) {
  const shown = providers.slice(0, max);
  const extra = providers.length - shown.length;
  return (
    <div className="flex items-center">
      {shown.map((p, i) => {
        const meta = providerMeta(p);
        const Icon = meta.icon;
        return (
          <span
            key={p}
            className="inline-flex size-7 items-center justify-center rounded-lg border-2 border-cream-50 shadow-sm"
            style={{
              backgroundColor: `${meta.accent}1a`,
              color: meta.accent,
              marginLeft: i === 0 ? 0 : -7,
              zIndex: shown.length - i,
            }}
            title={meta.label}
          >
            <Icon size={13} strokeWidth={2.4} />
          </span>
        );
      })}
      {extra > 0 && (
        <span
          className="inline-flex size-7 items-center justify-center rounded-lg border-2 border-cream-50 bg-cream-200 text-[10px] font-semibold text-ink-muted shadow-sm"
          style={{ marginLeft: -7 }}
        >
          +{extra}
        </span>
      )}
    </div>
  );
}
