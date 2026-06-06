import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowUpRight, Building2 } from "lucide-react";
import type { Tool } from "@/types";
import { StatusBadge } from "@/components/StatusBadge";
import { AppChip } from "@/components/AppIcon";
import { Tag } from "@/components/Pill";
import { relativeTime } from "@/lib/utils";

function primaryAction(tool: Tool): { label: string; to: string } {
  switch (tool.status) {
    case "live":
      return { label: "Open", to: `/tools/${tool.id}` };
    case "building":
      return { label: "Continue", to: `/build/${tool.id}` };
    case "review_needed":
      return { label: "Review", to: `/tools/${tool.id}` };
    case "preview_ready":
      return { label: "Open preview", to: `/build/${tool.id}` };
    case "draft":
      return { label: "Edit", to: `/build/${tool.id}` };
    default:
      return { label: "Open", to: `/tools/${tool.id}` };
  }
}

export function ToolCard({ tool, index = 0 }: { tool: Tool; index?: number }) {
  const action = primaryAction(tool);
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.04, 0.3), ease: [0.16, 1, 0.3, 1] }}
    >
      <Link
        to={`/tools/${tool.id}`}
        className="group flex h-full flex-col rounded-3xl border border-line bg-cream-50 p-5 shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-ink/10 hover:shadow-soft-lg"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate font-display text-lg leading-tight text-ink">{tool.name}</h3>
            {tool.department && (
              <p className="mt-1 flex items-center gap-1.5 text-xs text-ink-muted">
                <Building2 size={12} className="text-ink-faint" />
                {tool.department}
              </p>
            )}
          </div>
          <StatusBadge status={tool.status} size="sm" />
        </div>

        <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-ink-soft">
          {tool.description}
        </p>

        {tool.connectedApps.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {tool.connectedApps.slice(0, 4).map((p) => (
              <AppChip key={p} provider={p} />
            ))}
          </div>
        )}

        {tool.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {tool.tags.slice(0, 3).map((t) => (
              <Tag key={t}>#{t}</Tag>
            ))}
            {tool.tags.length > 3 && <Tag>+{tool.tags.length - 3}</Tag>}
          </div>
        )}

        <div className="mt-auto flex items-center justify-between gap-2 pt-5">
          <span className="text-[11px] text-ink-faint">updated {relativeTime(tool.updatedAt)}</span>
          <Link
            to={action.to}
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 rounded-full bg-ink px-3.5 py-1.5 text-[13px] font-medium text-cream-50 shadow-soft transition group-hover:bg-ink-soft"
          >
            {action.label}
            <ArrowUpRight size={14} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>
      </Link>
    </motion.div>
  );
}
