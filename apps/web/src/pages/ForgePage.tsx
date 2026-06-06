import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Sparkles,
  Check,
  LayoutDashboard,
  ListChecks,
  Table2,
  ShieldCheck,
  Workflow,
  UserSquare2,
  Plug,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { api } from "@/lib/api";
import { useApps } from "@/lib/queries";
import { Button, LinkButton } from "@/components/Button";
import { AppIcon } from "@/components/AppIcon";
import { SectionLabel } from "@/components/Card";
import { Breadcrumb } from "@/components/Breadcrumb";
import { cx } from "@/lib/utils";
import { toast } from "@/lib/store";

const DEPARTMENTS = ["Finance", "Support", "Sales", "Operations", "People", "Engineering"];

const APP_TYPES: { key: string; label: string; icon: LucideIcon }[] = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "approval_queue", label: "Approval queue", icon: ListChecks },
  { key: "crm", label: "CRM-style table", icon: Table2 },
  { key: "admin", label: "Admin panel", icon: ShieldCheck },
  { key: "workflow", label: "Workflow automation", icon: Workflow },
  { key: "portal", label: "Customer portal", icon: UserSquare2 },
];

const EXAMPLE =
  "A refund approval queue for our pizza shop that pulls refund requests from Gmail, matches them with Stripe payments, lets managers approve or reject, and pings Slack when something needs review.";

export function ForgePage() {
  const navigate = useNavigate();
  const { data: apps } = useApps();
  const [prompt, setPrompt] = useState("");
  const [providers, setProviders] = useState<string[]>([]);
  const [department, setDepartment] = useState<string>("");
  const [appType, setAppType] = useState<string>("");

  const connected = (apps?.catalog ?? []).filter((a) => a.connected);
  const selectable = apps?.catalog ?? [];

  const create = useMutation({
    mutationFn: () =>
      api.createTool({
        prompt: prompt.trim(),
        selectedProviders: providers,
        department: department || undefined,
        appType: appType || undefined,
      }),
    onSuccess: (tool) => {
      toast.success("Tool created", "Heading into the build flow…");
      navigate(`/build/${tool.id}`);
    },
    onError: (e: Error) => toast.error("Couldn’t create tool", e.message),
  });

  const toggleProvider = (p: string) =>
    setProviders((cur) => (cur.includes(p) ? cur.filter((x) => x !== p) : [...cur, p]));

  const canSubmit = prompt.trim().length >= 12 && !create.isPending;

  return (
    <div className="mx-auto max-w-3xl">
      <Breadcrumb items={[{ label: "Home", to: "/" }, { label: "Forge" }]} />

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mt-5 text-center"
      >
        <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-cream-50 px-3 py-1 text-[13px] text-ink-muted shadow-soft">
          <Sparkles size={14} className="text-forge-500" />
          forge
        </span>
        <h1 className="mt-5 font-display text-4xl font-medium tracking-tight text-ink sm:text-5xl">
          What should ForgeIt build?
        </h1>
        <p className="mx-auto mt-3 max-w-lg text-[15px] text-ink-muted">
          Describe the internal tool in plain language. We’ll discover context, draft a plan,
          and build it for you.
        </p>
      </motion.div>

      {/* Prompt */}
      <div className="mt-9 rounded-3xl border border-line bg-cream-50 p-2 shadow-card focus-within:border-ink/15 focus-within:shadow-soft-lg">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={5}
          placeholder={EXAMPLE}
          className="w-full resize-none rounded-2xl bg-transparent p-4 text-[15px] leading-relaxed text-ink outline-none placeholder:text-ink-faint"
        />
        <div className="flex items-center justify-between px-3 pb-2">
          <button
            onClick={() => setPrompt(EXAMPLE)}
            className="text-xs font-medium text-ink-faint transition hover:text-forge-600"
          >
            ✨ Use an example
          </button>
          <span className="text-xs text-ink-faint">{prompt.trim().length} chars</span>
        </div>
      </div>

      {/* Connected apps */}
      <section className="mt-9">
        <div className="flex items-center justify-between">
          <SectionLabel className="flex items-center gap-1.5">
            <Plug size={13} /> Use these connected apps
          </SectionLabel>
          <LinkButton to="/stack" size="sm" variant="ghost">
            Manage stack
          </LinkButton>
        </div>
        {connected.length === 0 && (
          <p className="mt-3 rounded-2xl border border-dashed border-line bg-cream-100/50 px-4 py-3 text-sm text-ink-muted">
            No apps connected yet. You can still forge a tool — connect apps anytime from the{" "}
            <LinkButton to="/stack" variant="ghost" size="sm" className="!h-auto !px-1 !py-0 underline">
              stack
            </LinkButton>{" "}
            page. Below are all available providers.
          </p>
        )}
        <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          {selectable.map((app) => {
            const selected = providers.includes(app.provider);
            return (
              <button
                key={app.provider}
                onClick={() => toggleProvider(app.provider)}
                className={cx(
                  "group relative flex items-center gap-2.5 rounded-2xl border p-3 text-left transition-all",
                  selected
                    ? "border-ink/25 bg-ink/[0.03] shadow-soft"
                    : "border-line bg-cream-50 hover:border-ink/15 hover:bg-cream-200/40",
                )}
              >
                <AppIcon provider={app.provider} accent={app.accent} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink">{app.label}</p>
                  <p className="truncate text-[11px] text-ink-faint">
                    {app.connected ? "connected" : "available"}
                  </p>
                </div>
                <span
                  className={cx(
                    "inline-flex size-5 shrink-0 items-center justify-center rounded-full border transition",
                    selected
                      ? "border-ink bg-ink text-cream-50"
                      : "border-line text-transparent group-hover:border-ink/25",
                  )}
                >
                  <Check size={13} strokeWidth={3} />
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Department */}
      <section className="mt-9">
        <SectionLabel>Who is this for?</SectionLabel>
        <div className="mt-3 flex flex-wrap gap-2">
          {DEPARTMENTS.map((d) => (
            <button
              key={d}
              onClick={() => setDepartment(department === d ? "" : d)}
              className={cx(
                "rounded-full border px-4 h-9 text-[13px] font-medium transition active:scale-[0.97]",
                department === d
                  ? "border-ink bg-ink text-cream-50 shadow-soft"
                  : "border-line bg-cream-50 text-ink-soft hover:border-ink/20",
              )}
            >
              {d}
            </button>
          ))}
        </div>
      </section>

      {/* App type */}
      <section className="mt-9">
        <SectionLabel>How should it behave?</SectionLabel>
        <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          {APP_TYPES.map((t) => {
            const active = appType === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setAppType(active ? "" : t.key)}
                className={cx(
                  "flex items-center gap-2.5 rounded-2xl border p-3 text-left transition-all",
                  active
                    ? "border-forge-500/40 bg-forge-50 shadow-soft"
                    : "border-line bg-cream-50 hover:border-ink/15 hover:bg-cream-200/40",
                )}
              >
                <span
                  className={cx(
                    "inline-flex size-8 items-center justify-center rounded-lg transition",
                    active ? "bg-forge-500 text-white" : "bg-ink/[0.05] text-ink-soft",
                  )}
                >
                  <t.icon size={16} />
                </span>
                <span className={cx("text-sm font-medium", active ? "text-forge-600" : "text-ink")}>
                  {t.label}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Submit */}
      <div className="sticky bottom-6 mt-10 flex justify-center">
        <Button
          variant="ember"
          size="lg"
          onClick={() => create.mutate()}
          disabled={!canSubmit}
          loading={create.isPending}
          leftIcon={!create.isPending ? <Sparkles size={18} /> : undefined}
          className="w-full max-w-md shadow-glow"
        >
          {create.isPending ? "Forging…" : "ForgeIt"}
        </Button>
      </div>
      {prompt.trim().length > 0 && prompt.trim().length < 12 && (
        <p className="mt-3 text-center text-xs text-ink-faint">
          Add a little more detail so we can plan it well.
        </p>
      )}
    </div>
  );
}
