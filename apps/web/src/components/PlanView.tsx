import { useState } from "react";
import {
  LayoutDashboard,
  List,
  FileText,
  FormInput,
  ListChecks,
  KanbanSquare,
  ScrollText,
  Trash2,
  Users,
  Database,
  Workflow,
  ShieldCheck,
  AlertTriangle,
  Pencil,
  Check,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { BuildPlan, PageType } from "@/types";
import { AppIcon } from "@/components/AppIcon";
import { RiskBadge } from "@/components/RiskBadge";
import { Tag } from "@/components/Pill";
import { Button } from "@/components/Button";
import { cx, titleCase } from "@/lib/utils";

const pageIcon: Record<PageType, LucideIcon> = {
  dashboard: LayoutDashboard,
  list: List,
  detail: FileText,
  form: FormInput,
  approval_queue: ListChecks,
  kanban: KanbanSquare,
  audit_log: ScrollText,
};

function SectionHead({ icon: Icon, title, count }: { icon: LucideIcon; title: string; count?: number }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="inline-flex size-8 items-center justify-center rounded-lg bg-ink/[0.05] text-ink-soft">
        <Icon size={16} />
      </span>
      <h3 className="font-display text-lg text-ink">{title}</h3>
      {count !== undefined && (
        <span className="rounded-full bg-cream-200/80 px-2 py-0.5 text-xs font-medium text-ink-muted">
          {count}
        </span>
      )}
    </div>
  );
}

interface PlanViewProps {
  plan: BuildPlan;
  editable?: boolean;
  onChange?: (plan: BuildPlan) => void;
}

export function PlanView({ plan, editable = false, onChange }: PlanViewProps) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(plan.appName);
  const [desc, setDesc] = useState(plan.description);

  const update = (next: BuildPlan) => onChange?.(next);

  const saveHeader = () => {
    update({ ...plan, appName: name.trim() || plan.appName, description: desc.trim() || plan.description });
    setEditing(false);
  };

  const removePage = (route: string) =>
    update({ ...plan, pages: plan.pages.filter((p) => p.route !== route) });

  const removeWorkflow = (idx: number) =>
    update({ ...plan, workflows: plan.workflows.filter((_, i) => i !== idx) });

  return (
    <div className="space-y-7">
      {/* Summary */}
      <div className="rounded-3xl border border-line bg-cream-50 p-6 shadow-card">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            {editing ? (
              <div className="space-y-3">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-line bg-cream-100 px-3 py-2 font-display text-xl text-ink outline-none focus:border-ink/25"
                />
                <textarea
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  rows={3}
                  className="w-full resize-none rounded-xl border border-line bg-cream-100 px-3 py-2 text-sm text-ink-soft outline-none focus:border-ink/25"
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={saveHeader} leftIcon={<Check size={14} />}>
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setName(plan.appName);
                      setDesc(plan.description);
                      setEditing(false);
                    }}
                    leftIcon={<X size={14} />}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <h2 className="font-display text-2xl text-ink">{plan.appName}</h2>
                <p className="mt-2 text-[15px] leading-relaxed text-ink-soft">{plan.description}</p>
              </>
            )}
          </div>
          {editable && !editing && (
            <button
              onClick={() => setEditing(true)}
              className="inline-flex items-center gap-1.5 rounded-full border border-line bg-cream-50 px-3 py-1.5 text-[13px] font-medium text-ink-soft transition hover:border-ink/20"
            >
              <Pencil size={13} /> Edit
            </button>
          )}
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          {plan.department && <Tag tone="ink">{plan.department}</Tag>}
          {plan.targetUsers?.map((u) => <Tag key={u}>{u}</Tag>)}
        </div>

        {plan.connectedApps?.length > 0 && (
          <div className="mt-5 border-t border-line pt-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
              Connected apps
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {plan.connectedApps.map((a) => (
                <div key={a.provider} className="flex items-center gap-3 rounded-2xl bg-cream-100/60 p-3">
                  <AppIcon provider={a.provider} size="sm" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium capitalize text-ink">{a.provider}</p>
                    <p className="truncate text-xs text-ink-muted">{a.purpose}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Pages */}
      {plan.pages?.length > 0 && (
        <section>
          <SectionHead icon={LayoutDashboard} title="Pages" count={plan.pages.length} />
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {plan.pages.map((page) => {
              const Icon = pageIcon[page.type] ?? FileText;
              return (
                <div
                  key={page.route}
                  className="group flex items-start gap-3 rounded-2xl border border-line bg-cream-50 p-4 shadow-soft"
                >
                  <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-forge-50 text-forge-600">
                    <Icon size={17} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-medium text-ink">{page.name}</p>
                      <Tag tone="neutral">{titleCase(page.type)}</Tag>
                    </div>
                    <p className="mt-0.5 font-mono text-[11px] text-ink-faint">{page.route}</p>
                    <p className="mt-1.5 text-[13px] leading-relaxed text-ink-muted">{page.description}</p>
                  </div>
                  {editable && (
                    <button
                      onClick={() => removePage(page.route)}
                      className="text-ink-faint opacity-0 transition hover:text-red-500 group-hover:opacity-100"
                      aria-label="Remove page"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Data models */}
      {plan.dataModels?.length > 0 && (
        <section>
          <SectionHead icon={Database} title="Data model" count={plan.dataModels.length} />
          <div className="mt-4 space-y-3">
            {plan.dataModels.map((model) => (
              <div key={model.name} className="overflow-hidden rounded-2xl border border-line bg-cream-50 shadow-soft">
                <div className="flex items-center justify-between border-b border-line bg-cream-100/50 px-4 py-3">
                  <div>
                    <p className="font-medium text-ink">{model.name}</p>
                    {model.description && (
                      <p className="text-xs text-ink-muted">{model.description}</p>
                    )}
                  </div>
                  <span className="rounded-full bg-ink/[0.05] px-2 py-0.5 text-xs text-ink-muted">
                    {model.fields.length} fields
                  </span>
                </div>
                <div className="divide-y divide-line/70">
                  {model.fields.map((f) => (
                    <div key={f.name} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                      <span className="font-mono text-[13px] text-ink">{f.name}</span>
                      <span className="rounded-md bg-cream-200/70 px-1.5 py-0.5 font-mono text-[11px] text-ink-muted">
                        {f.type}
                      </span>
                      {f.required && <span className="text-[11px] font-medium text-forge-600">required</span>}
                      {f.unique && <span className="text-[11px] font-medium text-blue-600">unique</span>}
                      {f.relation && (
                        <span className="text-[11px] text-ink-faint">→ {f.relation}</span>
                      )}
                      {f.description && (
                        <span className="ml-auto truncate text-[12px] text-ink-faint">{f.description}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Workflows */}
      {plan.workflows?.length > 0 && (
        <section>
          <SectionHead icon={Workflow} title="Workflows" count={plan.workflows.length} />
          <div className="mt-4 space-y-3">
            {plan.workflows.map((wf, i) => (
              <div key={`${wf.name}-${i}`} className="group rounded-2xl border border-line bg-cream-50 p-4 shadow-soft">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-ink">{wf.name}</p>
                    <p className="mt-0.5 text-[13px] text-ink-muted">
                      <span className="font-medium text-ink-soft">Trigger:</span> {wf.trigger}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <RiskBadge risk={wf.risk} />
                    {editable && (
                      <button
                        onClick={() => removeWorkflow(i)}
                        className="text-ink-faint opacity-0 transition hover:text-red-500 group-hover:opacity-100"
                        aria-label="Remove workflow"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </div>
                <ol className="mt-3 space-y-1.5">
                  {wf.steps.map((step, si) => (
                    <li key={si} className="flex gap-2.5 text-[13px] text-ink-soft">
                      <span className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-ink/[0.05] font-mono text-[10px] text-ink-muted">
                        {si + 1}
                      </span>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Permissions */}
      {plan.permissions?.length > 0 && (
        <section>
          <SectionHead icon={Users} title="Permissions" count={plan.permissions.length} />
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {plan.permissions.map((perm) => (
              <div key={perm.role} className="rounded-2xl border border-line bg-cream-50 p-4 shadow-soft">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={15} className="text-sage-600" />
                  <p className="font-medium text-ink">{perm.role}</p>
                </div>
                <ul className="mt-3 space-y-1.5">
                  {perm.capabilities.map((cap) => (
                    <li key={cap} className="flex items-center gap-2 text-[13px] text-ink-soft">
                      <Check size={13} className="text-sage-500" strokeWidth={2.5} />
                      {cap}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Risks */}
      {plan.risks?.length > 0 && (
        <section>
          <SectionHead icon={AlertTriangle} title="Risks & guardrails" count={plan.risks.length} />
          <div className="mt-4 space-y-2.5">
            {plan.risks.map((risk, i) => (
              <div
                key={i}
                className={cx(
                  "flex items-start gap-3 rounded-2xl border p-4",
                  "border-amber-200 bg-amber-50/60",
                )}
              >
                <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-600" />
                <div>
                  <p className="text-sm font-medium capitalize text-amber-900">{titleCase(risk.type)}</p>
                  <p className="mt-0.5 text-[13px] leading-relaxed text-amber-800/80">{risk.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
