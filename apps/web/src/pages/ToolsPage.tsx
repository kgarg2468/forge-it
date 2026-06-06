import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Hammer, Boxes, AlertCircle } from "lucide-react";
import { useTools, useMe } from "@/lib/queries";
import { ToolCard } from "@/components/ToolCard";
import { Pill } from "@/components/Pill";
import { EmptyState } from "@/components/EmptyState";
import { GridSkeleton } from "@/components/Skeleton";
import { Breadcrumb } from "@/components/Breadcrumb";
import { LinkButton } from "@/components/Button";
import type { Tool } from "@/types";

type FilterDef = {
  key: string;
  label: string;
  match: (t: Tool) => boolean;
  dot?: string;
};

const STATUS_FILTERS: FilterDef[] = [
  { key: "live", label: "Live", match: (t) => t.status === "live", dot: "#5C8A5A" },
  { key: "draft", label: "Draft", match: (t) => t.status === "draft", dot: "#9A9489" },
  {
    key: "review",
    label: "Needs Review",
    match: (t) => t.status === "review_needed",
    dot: "#f97316",
  },
];

const DEPT_FILTERS: FilterDef[] = [
  { key: "finance", label: "Finance", match: (t) => t.department === "Finance" },
  { key: "support", label: "Support", match: (t) => t.department === "Support" },
  { key: "sales", label: "Sales", match: (t) => t.department === "Sales" },
];

const APP_FILTERS: FilterDef[] = [
  { key: "gmail", label: "Uses Gmail", match: (t) => t.connectedApps.includes("gmail"), dot: "#EA4335" },
  { key: "stripe", label: "Uses Stripe", match: (t) => t.connectedApps.includes("stripe"), dot: "#635bff" },
  { key: "slack", label: "Uses Slack", match: (t) => t.connectedApps.includes("slack"), dot: "#611f69" },
];

const ALL_FILTERS = [...STATUS_FILTERS, ...DEPT_FILTERS, ...APP_FILTERS];

export function ToolsPage() {
  const { data: tools, isLoading, isError, refetch } = useTools();
  const { data: me } = useMe();
  const [active, setActive] = useState<string>("all");

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: tools?.length ?? 0 };
    if (tools) {
      for (const f of ALL_FILTERS) c[f.key] = tools.filter(f.match).length;
    }
    return c;
  }, [tools]);

  const filtered = useMemo(() => {
    if (!tools) return [];
    if (active === "all") return tools;
    const def = ALL_FILTERS.find((f) => f.key === active);
    return def ? tools.filter(def.match) : tools;
  }, [tools, active]);

  return (
    <div className="relative">
      <Breadcrumb
        items={[
          { label: "Home", to: "/" },
          { label: me?.workspace.name ?? "Workspace", to: "/tools" },
          { label: "Tools" },
        ]}
      />

      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-medium tracking-tight text-ink">
            Internal Tools
          </h1>
          <p className="mt-2 max-w-lg text-[15px] text-ink-muted">
            Every tool your team has forged — live, in progress, or waiting on review.
          </p>
        </div>
        <LinkButton to="/forge" leftIcon={<Hammer size={16} />}>
          Forge New Tool
        </LinkButton>
      </div>

      {/* Filter pills */}
      <div className="mt-8 flex flex-wrap items-center gap-2">
        <Pill active={active === "all"} onClick={() => setActive("all")} count={counts.all}>
          All
        </Pill>
        <span className="mx-1 h-5 w-px bg-line" />
        {STATUS_FILTERS.map((f) => (
          <Pill
            key={f.key}
            active={active === f.key}
            onClick={() => setActive(f.key)}
            count={counts[f.key]}
            leftDot={f.dot}
          >
            {f.label}
          </Pill>
        ))}
        <span className="mx-1 h-5 w-px bg-line" />
        {DEPT_FILTERS.map((f) => (
          <Pill key={f.key} active={active === f.key} onClick={() => setActive(f.key)} count={counts[f.key]}>
            {f.label}
          </Pill>
        ))}
        <span className="mx-1 h-5 w-px bg-line" />
        {APP_FILTERS.map((f) => (
          <Pill
            key={f.key}
            active={active === f.key}
            onClick={() => setActive(f.key)}
            count={counts[f.key]}
            leftDot={f.dot}
          >
            {f.label}
          </Pill>
        ))}
      </div>

      {/* Content */}
      <div className="mt-8">
        {isLoading && <GridSkeleton count={6} />}

        {isError && (
          <EmptyState
            icon={AlertCircle}
            title="Couldn’t load tools"
            description="The ForgeIt backend didn’t respond. Make sure it’s running on port 8787 and try again."
            action={
              <button
                onClick={() => refetch()}
                className="rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-cream-50 transition hover:bg-ink-soft"
              >
                Retry
              </button>
            }
          />
        )}

        {!isLoading && !isError && filtered.length === 0 && tools && tools.length > 0 && (
          <EmptyState
            icon={Boxes}
            title="No tools match this filter"
            description="Try a different filter, or forge something new."
            action={
              <button
                onClick={() => setActive("all")}
                className="rounded-full border border-line bg-cream-50 px-5 py-2.5 text-sm font-medium text-ink transition hover:bg-cream-200/60"
              >
                Clear filter
              </button>
            }
          />
        )}

        {!isLoading && !isError && tools && tools.length === 0 && (
          <EmptyState
            icon={Hammer}
            title="No tools yet"
            description="Describe an internal tool and ForgeIt will plan, build, and deploy it."
            action={
              <LinkButton to="/forge" leftIcon={<Hammer size={16} />}>
                Forge your first tool
              </LinkButton>
            }
          />
        )}

        {!isLoading && filtered.length > 0 && (
          <motion.div layout className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((tool, i) => (
              <ToolCard key={tool.id} tool={tool} index={i} />
            ))}
          </motion.div>
        )}
      </div>

      {/* Floating forge button */}
      <Link
        to="/forge"
        className="group fixed bottom-7 right-7 z-30 inline-flex items-center gap-2 rounded-full bg-forge-500 px-5 py-3.5 font-medium text-white shadow-glow transition hover:bg-forge-600 hover:shadow-soft-lg"
      >
        <Hammer size={18} className="transition-transform group-hover:rotate-[-12deg]" />
        Forge New Tool
      </Link>
    </div>
  );
}
