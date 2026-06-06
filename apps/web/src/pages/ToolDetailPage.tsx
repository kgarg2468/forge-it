import { useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  ExternalLink,
  Pencil,
  Share2,
  Users,
  Database,
  Workflow as WorkflowIcon,
  GitPullRequest,
  Rocket,
  ScrollText,
  LayoutGrid,
  Server,
  Building2,
  Clock,
  X,
  Check,
  Ban,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { api } from "@/lib/api";
import { useTool, qk } from "@/lib/queries";
import { Breadcrumb } from "@/components/Breadcrumb";
import { StatusBadge } from "@/components/StatusBadge";
import { Button, LinkButton } from "@/components/Button";
import { MetricStat } from "@/components/MetricStat";
import { AppChip } from "@/components/AppIcon";
import { Tag } from "@/components/Pill";
import { RiskBadge } from "@/components/RiskBadge";
import { PlanView } from "@/components/PlanView";
import { EmptyState } from "@/components/EmptyState";
import { Spinner } from "@/components/Spinner";
import { Skeleton } from "@/components/Skeleton";
import { cx, formatDate, relativeTime, titleCase } from "@/lib/utils";
import { toast } from "@/lib/store";
import type { DataTable } from "@/types";

type TabKey =
  | "overview"
  | "data"
  | "workflows"
  | "permissions"
  | "changes"
  | "deployments"
  | "logs";

const TABS: { key: TabKey; label: string; icon: LucideIcon }[] = [
  { key: "overview", label: "Overview", icon: LayoutGrid },
  { key: "data", label: "Data", icon: Database },
  { key: "workflows", label: "Workflows", icon: WorkflowIcon },
  { key: "permissions", label: "Permissions", icon: Users },
  { key: "changes", label: "Changes", icon: GitPullRequest },
  { key: "deployments", label: "Deployments", icon: Rocket },
  { key: "logs", label: "Logs", icon: ScrollText },
];

export function ToolDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [params, setParams] = useSearchParams();
  const initialTab = (params.get("tab") as TabKey) || "overview";
  const [tab, setTab] = useState<TabKey>(TABS.some((t) => t.key === initialTab) ? initialTab : "overview");
  const { data: tool, isLoading, isError } = useTool(id);

  const changeTab = (t: TabKey) => {
    setTab(t);
    const next = new URLSearchParams(params);
    next.set("tab", t);
    setParams(next, { replace: true });
  };

  if (isLoading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-40 w-full rounded-3xl" />
      </div>
    );
  }

  if (isError || !tool || !id) {
    return (
      <EmptyState
        title="Tool not found"
        description="This tool may have been removed, or the backend is unreachable."
        action={<LinkButton to="/tools">Back to tools</LinkButton>}
      />
    );
  }

  const liveUrl = tool.productionUrl ?? tool.previewUrl;

  return (
    <div>
      <Breadcrumb items={[{ label: "Tools", to: "/tools" }, { label: tool.name }]} />

      {/* Header */}
      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-display text-3xl font-medium tracking-tight text-ink sm:text-4xl">
              {tool.name}
            </h1>
            <StatusBadge status={tool.status} />
          </div>
          <p className="mt-2 max-w-2xl text-[15px] text-ink-muted">{tool.description}</p>
          {tool.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {tool.tags.map((t) => (
                <Tag key={t}>#{t}</Tag>
              ))}
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {liveUrl && (
            <Button onClick={() => window.open(liveUrl, "_blank")} leftIcon={<ExternalLink size={15} />}>
              Open live tool
            </Button>
          )}
          <LinkButton to={`/build/${tool.id}`} variant="secondary" leftIcon={<Pencil size={15} />}>
            Edit with ForgeIt
          </LinkButton>
          <Button
            variant="outline"
            onClick={() => {
              navigator.clipboard?.writeText(liveUrl ?? window.location.href);
              toast.success("Link copied");
            }}
            leftIcon={<Share2 size={15} />}
          >
            Share
          </Button>
        </div>
      </div>

      {/* Stat strip */}
      <div className="mt-6 grid grid-cols-2 gap-x-6 gap-y-5 rounded-3xl border border-line bg-cream-50 p-6 shadow-card sm:grid-cols-4">
        <MetricStat
          label="Owner"
          value={tool.ownerName ?? "Unassigned"}
          icon={<Users size={12} />}
        />
        <MetricStat
          label="Department"
          value={tool.department ?? "—"}
          icon={<Building2 size={12} />}
        />
        <MetricStat label="Backend" value="InsForge" hint="Railway hosting" icon={<Server size={12} />} />
        <MetricStat
          label="Last deployed"
          value={tool.deployments[0] ? relativeTime(tool.deployments[0].deployedAt ?? tool.deployments[0].createdAt) : "Not deployed"}
          icon={<Clock size={12} />}
        />
      </div>

      {/* Tabs */}
      <div className="mt-7 flex gap-1 overflow-x-auto border-b border-line no-scrollbar">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => changeTab(t.key)}
            className={cx(
              "relative flex shrink-0 items-center gap-2 px-4 py-3 text-sm font-medium transition",
              tab === t.key ? "text-ink" : "text-ink-faint hover:text-ink-muted",
            )}
          >
            <t.icon size={15} />
            {t.label}
            {tab === t.key && (
              <motion.span
                layoutId="tab-underline"
                className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-ink"
              />
            )}
          </button>
        ))}
      </div>

      <div className="mt-7">
        {tab === "overview" && <OverviewTab toolId={id} tool={tool} />}
        {tab === "data" && <DataTab toolId={id} />}
        {tab === "workflows" && <WorkflowsTab toolId={id} />}
        {tab === "permissions" && <PermissionsTab tool={tool} />}
        {tab === "changes" && <ChangesTab toolId={id} />}
        {tab === "deployments" && <DeploymentsTab toolId={id} initialDeployments={tool.deployments} />}
        {tab === "logs" && <LogsTab toolId={id} />}
      </div>
    </div>
  );
}

// ----- Overview -------------------------------------------------------------

function OverviewTab({ toolId, tool }: { toolId: string; tool: ReturnType<typeof useTool>["data"] & {} }) {
  void toolId;
  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-line bg-cream-50 p-6 shadow-card">
        <h3 className="font-display text-lg text-ink">Original prompt</h3>
        <p className="mt-2 text-[15px] leading-relaxed text-ink-soft">{tool.prompt || tool.description}</p>
      </div>

      {tool.connectedApps.length > 0 && (
        <div className="rounded-3xl border border-line bg-cream-50 p-6 shadow-card">
          <h3 className="font-display text-lg text-ink">Connected apps</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {tool.connectedApps.map((p) => (
              <AppChip key={p} provider={p} />
            ))}
          </div>
        </div>
      )}

      {tool.plan ? (
        <div>
          <h3 className="mb-4 font-display text-lg text-ink">Build plan</h3>
          <PlanView plan={tool.plan} />
        </div>
      ) : (
        <EmptyState
          icon={LayoutGrid}
          title="No plan yet"
          description="Open this tool in ForgeIt to generate a build plan."
          action={<LinkButton to={`/build/${tool.id}`} leftIcon={<Pencil size={15} />}>Edit with ForgeIt</LinkButton>}
        />
      )}
    </div>
  );
}

// ----- Data -----------------------------------------------------------------

function DataTab({ toolId }: { toolId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: qk.data(toolId),
    queryFn: () => api.data(toolId),
  });
  const [open, setOpen] = useState<DataTable | null>(null);

  if (isLoading) return <Skeleton className="h-40 w-full rounded-3xl" />;

  const tables = data?.tables ?? [];
  if (tables.length === 0) {
    return (
      <EmptyState
        icon={Database}
        title="No data tables yet"
        description="Data tables appear once this tool has a build plan and has been built."
      />
    );
  }

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {tables.map((t) => (
          <button
            key={t.table}
            onClick={() => setOpen(t)}
            className="rounded-2xl border border-line bg-cream-50 p-5 text-left shadow-soft transition hover:-translate-y-0.5 hover:shadow-soft-lg"
          >
            <div className="flex items-center justify-between">
              <span className="inline-flex size-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Database size={17} />
              </span>
              <span className="rounded-full bg-cream-200/80 px-2 py-0.5 text-xs font-medium text-ink-muted">
                {t.count} rows
              </span>
            </div>
            <p className="mt-3 font-medium text-ink">{t.entity}</p>
            <p className="font-mono text-[11px] text-ink-faint">{t.table}</p>
            {t.description && <p className="mt-1.5 line-clamp-2 text-[13px] text-ink-muted">{t.description}</p>}
            <p className="mt-3 text-xs text-ink-faint">{t.fields.length} fields →</p>
          </button>
        ))}
      </div>

      <DataPanel toolId={toolId} table={open} onClose={() => setOpen(null)} />
    </>
  );
}

function DataPanel({ toolId, table, onClose }: { toolId: string; table: DataTable | null; onClose: () => void }) {
  const { data, isLoading } = useQuery({
    queryKey: qk.dataTable(toolId, table?.table ?? ""),
    queryFn: () => api.dataTable(toolId, table!.table),
    enabled: !!table,
  });

  return (
    <AnimatePresence>
      {table && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <motion.div
            className="absolute inset-0 bg-ink/25 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 32 }}
            className="relative flex h-full w-full max-w-2xl flex-col border-l border-line bg-cream-50 shadow-soft-lg"
          >
            <div className="flex items-center justify-between border-b border-line px-6 py-4">
              <div>
                <h3 className="font-display text-xl text-ink">{table.entity}</h3>
                <p className="font-mono text-[11px] text-ink-faint">{table.table}</p>
              </div>
              <button onClick={onClose} className="rounded-full p-2 text-ink-muted hover:bg-ink/[0.06]">
                <X size={18} />
              </button>
            </div>
            <div className="border-b border-line px-6 py-3">
              <div className="flex flex-wrap gap-1.5">
                {table.fields.map((f) => (
                  <span key={f.name} className="rounded-md bg-cream-200/70 px-2 py-1 font-mono text-[11px] text-ink-muted">
                    {f.name}:{f.type}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex-1 overflow-auto p-6">
              {isLoading ? (
                <div className="flex items-center gap-2 text-ink-muted"><Spinner size={16} /> Loading records…</div>
              ) : (data?.records.length ?? 0) === 0 ? (
                <p className="py-10 text-center text-sm text-ink-muted">No records in this table.</p>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-line">
                  <table className="w-full text-left text-[13px]">
                    <thead className="bg-cream-100/60">
                      <tr>
                        {table.fields.map((f) => (
                          <th key={f.name} className="whitespace-nowrap px-3 py-2 font-medium text-ink-muted">
                            {f.name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {data?.records.map((rec, i) => (
                        <tr key={i} className="hover:bg-cream-100/50">
                          {table.fields.map((f) => (
                            <td key={f.name} className="whitespace-nowrap px-3 py-2 text-ink-soft">
                              {formatCell(rec[f.name])}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function formatCell(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

// ----- Workflows ------------------------------------------------------------

function WorkflowsTab({ toolId }: { toolId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: qk.workflows(toolId),
    queryFn: () => api.workflows(toolId),
  });
  if (isLoading) return <Skeleton className="h-40 w-full rounded-3xl" />;
  const workflows = data?.workflows ?? [];
  if (workflows.length === 0) {
    return <EmptyState icon={WorkflowIcon} title="No workflows yet" description="Workflows appear after the tool is built." />;
  }
  return (
    <div className="space-y-3">
      {workflows.map((wf, i) => (
        <div key={`${wf.name}-${i}`} className="rounded-2xl border border-line bg-cream-50 p-5 shadow-soft">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-medium text-ink">{wf.name}</p>
              <p className="mt-0.5 text-[13px] text-ink-muted">
                <span className="font-medium text-ink-soft">Trigger:</span> {wf.trigger}
              </p>
            </div>
            <RiskBadge risk={wf.risk} />
          </div>
          <ol className="mt-3 space-y-1.5">
            {wf.steps.map((s, si) => (
              <li key={si} className="flex gap-2.5 text-[13px] text-ink-soft">
                <span className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-ink/[0.05] font-mono text-[10px] text-ink-muted">
                  {si + 1}
                </span>
                {s}
              </li>
            ))}
          </ol>
        </div>
      ))}
    </div>
  );
}

// ----- Permissions ----------------------------------------------------------

function PermissionsTab({ tool }: { tool: NonNullable<ReturnType<typeof useTool>["data"]> }) {
  const perms = tool.plan?.permissions ?? [];
  if (perms.length === 0) {
    return <EmptyState icon={Users} title="No permissions defined" description="Permissions come from the build plan. Generate a plan in ForgeIt." />;
  }
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {perms.map((p) => (
        <div key={p.role} className="rounded-2xl border border-line bg-cream-50 p-5 shadow-soft">
          <div className="flex items-center gap-2">
            <span className="inline-flex size-8 items-center justify-center rounded-lg bg-sage-100 text-sage-600">
              <Users size={16} />
            </span>
            <p className="font-medium text-ink">{p.role}</p>
          </div>
          <ul className="mt-3 space-y-1.5">
            {p.capabilities.map((c) => (
              <li key={c} className="flex items-center gap-2 text-[13px] text-ink-soft">
                <Check size={13} className="text-sage-500" strokeWidth={2.5} /> {c}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

// ----- Changes --------------------------------------------------------------

function ChangesTab({ toolId }: { toolId: string }) {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: qk.changes(toolId), queryFn: () => api.changes(toolId) });

  const approve = useMutation({
    mutationFn: (id: string) => api.approveChange(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.changes(toolId) });
      toast.success("Change approved");
    },
    onError: (e: Error) => toast.error("Couldn’t approve", e.message),
  });
  const reject = useMutation({
    mutationFn: (id: string) => api.rejectChange(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.changes(toolId) });
      toast.info("Change rejected");
    },
    onError: (e: Error) => toast.error("Couldn’t reject", e.message),
  });

  if (isLoading) return <Skeleton className="h-40 w-full rounded-3xl" />;
  const changes = data ?? [];
  if (changes.length === 0) {
    return <EmptyState icon={GitPullRequest} title="No changes yet" description="Follow-up edits and change requests show up here." />;
  }
  return (
    <div className="space-y-3">
      {changes.map((c) => {
        const pending = c.status === "pending" || c.status === "review_needed";
        return (
          <div key={c.id} className="rounded-2xl border border-line bg-cream-50 p-5 shadow-soft">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium text-ink">{c.title}</p>
                <p className="mt-0.5 text-[13px] text-ink-muted">{c.summary}</p>
              </div>
              <Tag tone={pending ? "ember" : "neutral"}>{titleCase(c.status)}</Tag>
            </div>
            {c.whatChanged.length > 0 && (
              <ul className="mt-3 space-y-1">
                {c.whatChanged.map((w, i) => (
                  <li key={i} className="flex items-center gap-2 text-[13px] text-ink-soft">
                    <span className="size-1 rounded-full bg-forge-400" /> {w}
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-4 flex items-center justify-between">
              <span className="text-xs text-ink-faint">
                by {c.requestedBy} · {relativeTime(c.createdAt)}
              </span>
              {pending && (
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" onClick={() => reject.mutate(c.id)} leftIcon={<Ban size={13} />} loading={reject.isPending}>
                    Reject
                  </Button>
                  <Button size="sm" onClick={() => approve.mutate(c.id)} leftIcon={<Check size={13} />} loading={approve.isPending}>
                    Approve
                  </Button>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ----- Deployments ----------------------------------------------------------

function DeploymentsTab({ toolId, initialDeployments }: { toolId: string; initialDeployments: NonNullable<ReturnType<typeof useTool>["data"]>["deployments"] }) {
  const { data, isLoading } = useQuery({
    queryKey: qk.deployments(toolId),
    queryFn: () => api.deployments(toolId),
    initialData: initialDeployments,
  });
  if (isLoading) return <Skeleton className="h-40 w-full rounded-3xl" />;
  const deploys = data ?? [];
  if (deploys.length === 0) {
    return (
      <EmptyState
        icon={Rocket}
        title="Not deployed yet"
        description="Deploy this tool to make it available to your team."
        action={<LinkButton to={`/deploy/${toolId}`} leftIcon={<Rocket size={15} />}>Deploy now</LinkButton>}
      />
    );
  }
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-cream-50 shadow-soft">
      <table className="w-full text-left text-sm">
        <thead className="bg-cream-100/60 text-[11px] uppercase tracking-wide text-ink-faint">
          <tr>
            <th className="px-5 py-3 font-semibold">Version</th>
            <th className="px-5 py-3 font-semibold">Environment</th>
            <th className="px-5 py-3 font-semibold">Status</th>
            <th className="px-5 py-3 font-semibold">Deployed</th>
            <th className="px-5 py-3 font-semibold">URL</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {deploys.map((d) => (
            <tr key={d.id} className="hover:bg-cream-100/40">
              <td className="px-5 py-3 font-mono text-[13px] text-ink">{d.version ?? "—"}</td>
              <td className="px-5 py-3">
                <Tag tone={d.environment === "production" ? "ink" : "neutral"}>{d.environment}</Tag>
              </td>
              <td className="px-5 py-3"><StatusBadge status={d.status} size="sm" /></td>
              <td className="px-5 py-3 text-ink-muted">{formatDate(d.deployedAt ?? d.createdAt)}</td>
              <td className="px-5 py-3">
                {d.url ? (
                  <a href={d.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-forge-600 hover:underline">
                    open <ExternalLink size={12} />
                  </a>
                ) : (
                  <span className="text-ink-faint">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ----- Logs -----------------------------------------------------------------

function LogsTab({ toolId }: { toolId: string }) {
  const { data, isLoading } = useQuery({ queryKey: qk.logs(toolId), queryFn: () => api.logs(toolId) });
  if (isLoading) return <Skeleton className="h-40 w-full rounded-3xl" />;
  const runs = data?.runs ?? [];
  const changes = data?.changes ?? [];
  const deployments = data?.deployments ?? [];
  const empty = runs.length === 0 && changes.length === 0 && deployments.length === 0;
  if (empty) {
    return <EmptyState icon={ScrollText} title="No activity yet" description="Workflow runs, changes, and deploys are logged here once the tool is live." />;
  }
  return (
    <div className="space-y-6">
      {runs.length > 0 && (
        <section>
          <h3 className="mb-3 font-display text-lg text-ink">Workflow runs</h3>
          <div className="space-y-2">
            {runs.map((r, i) => (
              <div key={i} className="flex items-center justify-between rounded-2xl border border-line bg-cream-50 px-4 py-3 shadow-soft">
                <div className="flex items-center gap-3">
                  <WorkflowIcon size={15} className="text-ink-faint" />
                  <span className="text-sm font-medium text-ink">{r.workflowName}</span>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={r.status} size="sm" />
                  <span className="text-xs text-ink-faint">{relativeTime(r.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
      {deployments.length > 0 && (
        <section>
          <h3 className="mb-3 font-display text-lg text-ink">Deploys</h3>
          <div className="space-y-2">
            {deployments.map((d) => (
              <div key={d.id} className="flex items-center justify-between rounded-2xl border border-line bg-cream-50 px-4 py-3 shadow-soft">
                <div className="flex items-center gap-3">
                  <Rocket size={15} className="text-ink-faint" />
                  <span className="text-sm text-ink">{d.environment} · {d.version ?? "—"}</span>
                </div>
                <span className="text-xs text-ink-faint">{relativeTime(d.deployedAt ?? d.createdAt)}</span>
              </div>
            ))}
          </div>
        </section>
      )}
      {changes.length > 0 && (
        <section>
          <h3 className="mb-3 font-display text-lg text-ink">Changes</h3>
          <div className="space-y-2">
            {changes.map((c) => (
              <div key={c.id} className="flex items-center justify-between rounded-2xl border border-line bg-cream-50 px-4 py-3 shadow-soft">
                <div className="flex items-center gap-3">
                  <GitPullRequest size={15} className="text-ink-faint" />
                  <span className="text-sm text-ink">{c.title}</span>
                </div>
                <span className="text-xs text-ink-faint">{relativeTime(c.createdAt)}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
