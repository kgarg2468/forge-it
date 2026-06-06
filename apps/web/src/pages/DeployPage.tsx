import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Rocket,
  Database,
  Server,
  ShieldCheck,
  ExternalLink,
  Share2,
  GitPullRequest,
  Lock,
  FlaskConical,
  ScrollText,
  CheckCircle2,
  Loader2,
  PartyPopper,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { api, streamUrls } from "@/lib/api";
import { useTool, qk } from "@/lib/queries";
import { useBuildStream } from "@/lib/sse";
import { Button } from "@/components/Button";
import { Spinner } from "@/components/Spinner";
import { AppIcon } from "@/components/AppIcon";
import { Breadcrumb } from "@/components/Breadcrumb";
import { BuildActivity } from "@/components/BuildActivity";
import { SectionLabel } from "@/components/Card";
import { cx } from "@/lib/utils";
import { toast } from "@/lib/store";

const OPTIONS: { key: string; label: string; icon: LucideIcon; default: boolean; hint: string }[] = [
  { key: "login", label: "Require login", icon: Lock, default: true, hint: "Only workspace members can access" },
  { key: "demo", label: "Use demo data", icon: FlaskConical, default: false, hint: "Seed with sample records" },
  { key: "audit", label: "Enable audit logs", icon: ScrollText, default: true, hint: "Record every action" },
  { key: "approval", label: "Approval before external actions", icon: ShieldCheck, default: true, hint: "Require sign-off for outbound calls" },
];

export function DeployPage() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const { data: tool, isLoading } = useTool(id);
  const [options, setOptions] = useState<Record<string, boolean>>(
    Object.fromEntries(OPTIONS.map((o) => [o.key, o.default])),
  );
  const [deploying, setDeploying] = useState(false);
  const [streamOn, setStreamOn] = useState(false);
  const [liveUrl, setLiveUrl] = useState<string | null>(null);

  const stream = useBuildStream(streamOn && id ? streamUrls.deploy(id) : null);

  useEffect(() => {
    const ev = stream.events.find((e) => e.kind === "preview_ready");
    if (ev && ev.kind === "preview_ready") setLiveUrl(ev.url);
  }, [stream.events]);

  useEffect(() => {
    if (stream.done && stream.ok) {
      qc.invalidateQueries({ queryKey: qk.tool(id ?? "") });
      qc.invalidateQueries({ queryKey: qk.tools });
      if (!liveUrl && tool) {
        setLiveUrl(tool.productionUrl ?? `https://${tool.slug}.up.railway.app`);
      }
      toast.success("Deployed", "Your internal tool is live.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stream.done]);

  const deployMut = useMutation({
    mutationFn: () => api.deploy(id as string, "production"),
    onSuccess: () => {
      setStreamOn(true);
    },
    onError: (e: Error) => {
      toast.error("Deploy failed", e.message);
      setDeploying(false);
    },
  });

  const startDeploy = () => {
    setDeploying(true);
    deployMut.mutate();
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-ink-muted">
        <Spinner size={20} className="mr-2" /> Loading…
      </div>
    );
  }

  if (!tool || !id) {
    return (
      <div className="py-20 text-center">
        <h1 className="font-display text-2xl text-ink">Tool not found</h1>
      </div>
    );
  }

  const finished = stream.done && stream.ok;
  const fakeUrl = liveUrl ?? tool.productionUrl ?? `https://${tool.slug}.up.railway.app`;

  return (
    <div className="mx-auto max-w-3xl">
      <Breadcrumb
        items={[
          { label: "Tools", to: "/tools" },
          { label: tool.name, to: `/tools/${tool.id}` },
          { label: "Deploy" },
        ]}
      />

      {!deploying && (
        <>
          <div className="mt-5">
            <h1 className="font-display text-3xl font-medium tracking-tight text-ink sm:text-4xl">
              Deploy {tool.name}
            </h1>
            <p className="mt-2 text-[15px] text-ink-muted">
              Review the setup, choose your guardrails, and ship it live.
            </p>
          </div>

          {/* Summary card */}
          <div className="mt-7 rounded-3xl border border-line bg-cream-50 p-6 shadow-card">
            <div className="grid gap-5 sm:grid-cols-3">
              <div className="flex items-center gap-3">
                <span className="inline-flex size-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <Database size={19} />
                </span>
                <div>
                  <SectionLabel>Backend</SectionLabel>
                  <p className="mt-0.5 font-medium text-ink">InsForge</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="inline-flex size-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                  <Server size={19} />
                </span>
                <div>
                  <SectionLabel>Hosting</SectionLabel>
                  <p className="mt-0.5 font-medium text-ink">Railway</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="inline-flex size-10 items-center justify-center rounded-xl bg-sage-100 text-sage-600">
                  <ShieldCheck size={19} />
                </span>
                <div>
                  <SectionLabel>Access</SectionLabel>
                  <p className="mt-0.5 font-medium text-ink">{tool.ownerName ?? tool.department ?? "Workspace"}</p>
                </div>
              </div>
            </div>

            {tool.connectedApps.length > 0 && (
              <div className="mt-6 border-t border-line pt-5">
                <SectionLabel>Connected apps</SectionLabel>
                <div className="mt-3 flex flex-wrap gap-2">
                  {tool.connectedApps.map((p) => (
                    <div key={p} className="flex items-center gap-2 rounded-full border border-line bg-cream-100/60 py-1 pl-1.5 pr-3">
                      <AppIcon provider={p} size="xs" />
                      <span className="text-[13px] capitalize text-ink-soft">{p}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6 flex items-center gap-2 rounded-2xl border border-line bg-cream-100/50 px-4 py-3">
              <ExternalLink size={15} className="text-ink-faint" />
              <span className="font-mono text-[13px] text-ink-muted">{fakeUrl}</span>
            </div>
          </div>

          {/* Options */}
          <div className="mt-7">
            <SectionLabel>Deploy options</SectionLabel>
            <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
              {OPTIONS.map((o) => {
                const on = options[o.key];
                return (
                  <button
                    key={o.key}
                    onClick={() => setOptions((s) => ({ ...s, [o.key]: !s[o.key] }))}
                    className={cx(
                      "flex items-start gap-3 rounded-2xl border p-4 text-left transition",
                      on ? "border-ink/25 bg-ink/[0.03] shadow-soft" : "border-line bg-cream-50 hover:border-ink/15",
                    )}
                  >
                    <span
                      className={cx(
                        "inline-flex size-9 shrink-0 items-center justify-center rounded-xl transition",
                        on ? "bg-ink text-cream-50" : "bg-ink/[0.05] text-ink-soft",
                      )}
                    >
                      <o.icon size={17} />
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-ink">{o.label}</p>
                      <p className="text-xs text-ink-muted">{o.hint}</p>
                    </div>
                    <span
                      className={cx(
                        "mt-0.5 flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 transition",
                        on ? "bg-sage-500" : "bg-cream-300",
                      )}
                    >
                      <span className={cx("size-4 rounded-full bg-white shadow transition", on && "translate-x-4")} />
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <Button variant="ember" size="lg" onClick={startDeploy} leftIcon={<Rocket size={18} />}>
              Deploy live
            </Button>
          </div>
        </>
      )}

      {/* Deploying / live state */}
      {deploying && (
        <div className="mt-7">
          {finished ? (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-3xl border border-line bg-cream-50 p-8 text-center shadow-card"
            >
              <span className="inline-flex size-16 items-center justify-center rounded-full bg-sage-100 text-sage-600">
                <PartyPopper size={28} />
              </span>
              <h2 className="mt-6 font-display text-3xl text-ink">Your internal tool is live.</h2>
              <p className="mx-auto mt-2 max-w-sm text-sm text-ink-muted">
                {tool.name} is deployed and ready for your team to use.
              </p>
              <div className="mx-auto mt-6 flex max-w-md items-center gap-2 rounded-2xl border border-line bg-cream-100/60 px-4 py-3">
                <CheckCircle2 size={16} className="text-sage-500" />
                <span className="truncate font-mono text-[13px] text-ink-soft">{fakeUrl}</span>
              </div>
              <div className="mt-7 flex flex-wrap justify-center gap-3">
                <Button onClick={() => window.open(fakeUrl, "_blank")} leftIcon={<ExternalLink size={16} />}>
                  Open tool
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    navigator.clipboard?.writeText(fakeUrl);
                    toast.success("Link copied");
                  }}
                  leftIcon={<Share2 size={16} />}
                >
                  Share
                </Button>
                <Link to={`/tools/${tool.id}?tab=changes`}>
                  <Button variant="outline" leftIcon={<GitPullRequest size={16} />}>
                    View changes
                  </Button>
                </Link>
              </div>
            </motion.div>
          ) : (
            <div>
              <div className="mb-4 flex items-center gap-3">
                <Loader2 size={20} className="animate-spin text-forge-500" />
                <div>
                  <h2 className="font-display text-2xl text-ink">Deploying {tool.name}…</h2>
                  <p className="text-sm text-ink-muted">Provisioning backend and hosting, wiring up apps.</p>
                </div>
              </div>
              <div className="h-[420px] overflow-hidden rounded-3xl border border-line bg-cream-50 shadow-card">
                <BuildActivity events={stream.events} connected={stream.connected} done={stream.done} ok={stream.ok} />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
