import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Sparkles,
  Check,
  Rocket,
  RefreshCw,
  Send,
  ExternalLink,
  MonitorPlay,
  Loader2,
  Compass,
} from "lucide-react";
import { api, streamUrls } from "@/lib/api";
import { useTool, qk } from "@/lib/queries";
import { useBuildStream } from "@/lib/sse";
import { Button } from "@/components/Button";
import { PlanView } from "@/components/PlanView";
import { BuildActivity } from "@/components/BuildActivity";
import { AppIcon } from "@/components/AppIcon";
import { Spinner } from "@/components/Spinner";
import { Breadcrumb } from "@/components/Breadcrumb";
import { toast } from "@/lib/store";
import { cx } from "@/lib/utils";
import type { BuildPlan, DiscoveryResponse } from "@/types";

type Step = "discover" | "plan" | "build";

const STEP_LABELS: { key: Step; label: string }[] = [
  { key: "discover", label: "Understand" },
  { key: "plan", label: "Review plan" },
  { key: "build", label: "Build" },
];

function StepRail({ step }: { step: Step }) {
  const idx = STEP_LABELS.findIndex((s) => s.key === step);
  return (
    <div className="flex items-center gap-2">
      {STEP_LABELS.map((s, i) => (
        <div key={s.key} className="flex items-center gap-2">
          <div
            className={cx(
              "flex items-center gap-2 rounded-full px-3 py-1.5 text-[13px] font-medium transition",
              i < idx && "text-sage-600",
              i === idx && "bg-ink text-cream-50 shadow-soft",
              i > idx && "text-ink-faint",
            )}
          >
            <span
              className={cx(
                "inline-flex size-5 items-center justify-center rounded-full text-[11px]",
                i < idx && "bg-sage-100 text-sage-600",
                i === idx && "bg-cream-50/20 text-cream-50",
                i > idx && "bg-cream-200 text-ink-faint",
              )}
            >
              {i < idx ? <Check size={12} strokeWidth={3} /> : i + 1}
            </span>
            {s.label}
          </div>
          {i < STEP_LABELS.length - 1 && <span className="h-px w-6 bg-line" />}
        </div>
      ))}
    </div>
  );
}

// =============================================================================
// Step A — Discovery
// =============================================================================

const SCAN_LINES = [
  "Reading your workspace context…",
  "Scanning Gmail for relevant threads…",
  "Matching Stripe customers and payments…",
  "Looking at Slack channels and approvals…",
  "Inferring roles and responsibilities…",
  "Normalizing your intent…",
];

function DiscoveryStep({
  toolId,
  providers,
  onContinue,
}: {
  toolId: string;
  providers: string[];
  onContinue: () => void;
}) {
  const [visibleLines, setVisibleLines] = useState(0);
  const discover = useMutation({
    mutationFn: () => api.discover(toolId),
    onError: (e: Error) => toast.error("Discovery failed", e.message),
  });
  const data: DiscoveryResponse | undefined = discover.data;
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    discover.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (data) {
      setVisibleLines(SCAN_LINES.length);
      return;
    }
    const timer = setInterval(() => {
      setVisibleLines((n) => Math.min(n + 1, SCAN_LINES.length));
    }, 650);
    return () => clearInterval(timer);
  }, [data]);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-cream-50 px-3 py-1 text-[13px] text-ink-muted shadow-soft">
          <Compass size={14} className="text-forge-500" /> step 1
        </span>
        <h1 className="mt-4 font-display text-3xl font-medium tracking-tight text-ink sm:text-4xl">
          Understanding your workflow
        </h1>
        <p className="mx-auto mt-3 max-w-md text-[15px] text-ink-muted">
          ForgeIt is reading context across your connected apps to ground the build.
        </p>
      </div>

      {/* Live activity lines */}
      <div className="mt-9 rounded-3xl border border-line bg-cream-50 p-6 shadow-card">
        <div className="space-y-2.5">
          {SCAN_LINES.map((line, i) => {
            const shown = i < visibleLines;
            const complete = !!data || i < visibleLines - 1;
            return (
              <motion.div
                key={line}
                initial={false}
                animate={{ opacity: shown ? 1 : 0.25, x: shown ? 0 : -4 }}
                className="flex items-center gap-3 text-sm"
              >
                {complete ? (
                  <Check size={15} className="text-sage-500" strokeWidth={2.5} />
                ) : shown ? (
                  <Loader2 size={15} className="animate-spin text-forge-500" />
                ) : (
                  <span className="size-[15px] rounded-full border border-line" />
                )}
                <span className={cx(complete ? "text-ink-soft" : "text-ink-muted")}>{line}</span>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Findings */}
      <AnimatePresence>
        {data && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mt-8"
          >
            {data.normalizedIntent && (
              <div className="mb-5 rounded-2xl border border-forge-100 bg-forge-50/60 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-forge-600">
                  what we understood
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{data.normalizedIntent}</p>
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              {data.findings.map((f, i) => (
                <motion.div
                  key={`${f.provider}-${i}`}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07 }}
                  className="rounded-2xl border border-line bg-cream-50 p-4 shadow-soft"
                >
                  <div className="flex items-center gap-2.5">
                    <AppIcon provider={f.provider} size="sm" />
                    <p className="text-sm font-medium text-ink">{f.title}</p>
                  </div>
                  {f.detail && <p className="mt-2 text-[13px] leading-relaxed text-ink-muted">{f.detail}</p>}
                  {f.items && f.items.length > 0 && (
                    <ul className="mt-2.5 space-y-1">
                      {f.items.slice(0, 5).map((item, ii) => (
                        <li key={ii} className="flex items-center gap-2 text-[13px] text-ink-soft">
                          <span className="size-1 rounded-full bg-forge-400" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  )}
                </motion.div>
              ))}
            </div>

            {data.suggestedRoles?.length > 0 && (
              <div className="mt-5 rounded-2xl border border-line bg-cream-50 p-4 shadow-soft">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
                  suggested roles
                </p>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {data.suggestedRoles.map((r) => (
                    <span key={r} className="rounded-full bg-ink/[0.05] px-3 py-1 text-[13px] text-ink-soft">
                      {r}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-8 flex justify-center">
              <Button onClick={onContinue} size="lg" rightIcon={<ArrowRight size={18} />}>
                Continue to plan
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {discover.isError && (
        <div className="mt-8 flex flex-col items-center gap-3">
          <p className="text-sm text-ink-muted">Discovery didn’t complete.</p>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => discover.mutate()} leftIcon={<RefreshCw size={15} />}>
              Retry
            </Button>
            <Button onClick={onContinue} rightIcon={<ArrowRight size={16} />}>
              Skip to plan
            </Button>
          </div>
        </div>
      )}

      {/* allow skip while waiting */}
      {!data && !discover.isError && providers.length === 0 && (
        <div className="mt-6 text-center">
          <button onClick={onContinue} className="text-sm font-medium text-ink-faint underline hover:text-ink">
            Skip discovery
          </button>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Step B — Plan review
// =============================================================================

function PlanStep({
  toolId,
  initialPlan,
  onApproved,
}: {
  toolId: string;
  initialPlan: BuildPlan | null;
  onApproved: (jobId: string) => void;
}) {
  const qc = useQueryClient();
  const [plan, setPlan] = useState<BuildPlan | null>(initialPlan);
  const generated = useRef(!!initialPlan);

  const planMut = useMutation({
    mutationFn: () => api.plan(toolId),
    onSuccess: (res) => setPlan(res.plan),
    onError: (e: Error) => toast.error("Planning failed", e.message),
  });

  const saveMut = useMutation({
    mutationFn: (next: BuildPlan) => api.savePlan(toolId, next),
    onSuccess: () => toast.success("Plan saved"),
    onError: (e: Error) => toast.error("Couldn’t save plan", e.message),
  });

  const approveMut = useMutation({
    mutationFn: () => api.approve(toolId),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: qk.tool(toolId) });
      qc.invalidateQueries({ queryKey: qk.tools });
      onApproved(res.jobId);
    },
    onError: (e: Error) => toast.error("Couldn’t start build", e.message),
  });

  useEffect(() => {
    if (!generated.current && !plan) {
      generated.current = true;
      planMut.mutate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (next: BuildPlan) => {
    setPlan(next);
    saveMut.mutate(next);
  };

  if (planMut.isPending || (!plan && !planMut.isError)) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="rounded-3xl border border-line bg-cream-50 p-10 text-center shadow-card">
          <div className="relative mx-auto flex size-16 items-center justify-center">
            <span className="absolute inset-0 animate-ping rounded-full bg-forge-200/40" />
            <span className="relative inline-flex size-16 items-center justify-center rounded-full bg-forge-50 text-forge-500">
              <Sparkles size={26} />
            </span>
          </div>
          <h2 className="mt-6 font-display text-2xl text-ink">Drafting your build plan</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-ink-muted">
            MiniMax is mapping pages, data models, workflows, and permissions for this tool.
            This usually takes a few seconds.
          </p>
          <div className="mt-7 flex items-center justify-center gap-2 text-sm text-ink-faint">
            <Spinner size={15} /> thinking…
          </div>
        </div>
      </div>
    );
  }

  if (planMut.isError && !plan) {
    return (
      <div className="mx-auto max-w-md text-center">
        <h2 className="font-display text-2xl text-ink">Planning didn’t complete</h2>
        <p className="mt-2 text-sm text-ink-muted">The planner returned an error. Try again.</p>
        <Button className="mt-5" onClick={() => planMut.mutate()} leftIcon={<RefreshCw size={15} />}>
          Retry planning
        </Button>
      </div>
    );
  }

  if (!plan) return null;

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-medium tracking-tight text-ink">Review build plan</h1>
          <p className="mt-1.5 text-[15px] text-ink-muted">
            Edit anything that’s off, then approve to build it for real.
          </p>
        </div>
        <Button variant="ghost" onClick={() => planMut.mutate()} leftIcon={<RefreshCw size={15} />} loading={planMut.isPending}>
          Regenerate
        </Button>
      </div>

      <PlanView plan={plan} editable onChange={handleChange} />

      <div className="sticky bottom-5 mt-8 flex flex-wrap items-center justify-end gap-3 rounded-2xl border border-line bg-cream-50/90 p-3 shadow-soft-lg backdrop-blur">
        {saveMut.isPending && <span className="mr-auto pl-2 text-xs text-ink-faint">saving…</span>}
        <Button
          variant="ember"
          size="lg"
          onClick={() => approveMut.mutate()}
          loading={approveMut.isPending}
          leftIcon={!approveMut.isPending ? <Rocket size={18} /> : undefined}
        >
          Approve and build
        </Button>
      </div>
    </div>
  );
}

// =============================================================================
// Step C — Live builder (three columns)
// =============================================================================

interface ChatMessage {
  role: "assistant" | "user";
  text: string;
}

function BuildStep({
  toolId,
  toolName,
  initialJobId,
}: {
  toolId: string;
  toolName: string;
  initialJobId: string;
}) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [jobId, setJobId] = useState(initialJobId);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      text: `I’m building ${toolName} now. You can watch the live activity on the right. Want to tweak anything? Just tell me and I’ll adjust the build.`,
    },
  ]);
  const [input, setInput] = useState("");

  const stream = useBuildStream(streamUrls.build(jobId));

  // Pull a preview URL from the stream, falling back to a poll.
  useEffect(() => {
    const ev = stream.events.find((e) => e.kind === "preview_ready");
    if (ev && ev.kind === "preview_ready") setPreviewUrl(ev.url);
  }, [stream.events]);

  const previewQuery = useQuery({
    queryKey: qk.preview(toolId),
    queryFn: () => api.preview(toolId),
    refetchInterval: previewUrl ? false : 6000,
  });
  useEffect(() => {
    if (!previewUrl && previewQuery.data?.url) setPreviewUrl(previewQuery.data.url);
  }, [previewQuery.data, previewUrl]);

  // When the build completes, refresh tool data.
  useEffect(() => {
    if (stream.done) {
      qc.invalidateQueries({ queryKey: qk.tool(toolId) });
      qc.invalidateQueries({ queryKey: qk.tools });
      if (stream.ok) toast.success("Build complete", "Your tool is ready to preview.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stream.done]);

  const chatMut = useMutation({
    mutationFn: (message: string) => api.chat(toolId, message),
    onSuccess: (res) => {
      setMessages((m) => [
        ...m,
        { role: "assistant", text: "On it — applying that change. Watch the activity panel for progress." },
      ]);
      setJobId(res.jobId); // swap the SSE stream to the new job
    },
    onError: (e: Error) => toast.error("Couldn’t send change", e.message),
  });

  const send = () => {
    const text = input.trim();
    if (!text) return;
    setMessages((m) => [...m, { role: "user", text }]);
    setInput("");
    chatMut.mutate(text);
  };

  const previewReady = !!previewUrl;

  return (
    <div className="flex flex-col">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-medium tracking-tight text-ink">{toolName}</h1>
          <p className="text-sm text-ink-muted">Live builder</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[300px_1fr_320px]">
        {/* LEFT — chat */}
        <div className="flex h-[640px] flex-col overflow-hidden rounded-3xl border border-line bg-cream-50 shadow-card">
          <div className="flex items-center gap-2 border-b border-line px-4 py-3">
            <span className="inline-flex size-6 items-center justify-center rounded-md bg-ink text-cream-50">
              <Sparkles size={13} className="text-forge-400" />
            </span>
            <span className="text-sm font-semibold text-ink">ForgeIt</span>
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.map((m, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className={cx("flex", m.role === "user" ? "justify-end" : "justify-start")}
              >
                <div
                  className={cx(
                    "max-w-[88%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed",
                    m.role === "user"
                      ? "bg-ink text-cream-50"
                      : "bg-cream-100 text-ink-soft border border-line",
                  )}
                >
                  {m.text}
                </div>
              </motion.div>
            ))}
            {chatMut.isPending && (
              <div className="flex items-center gap-2 text-xs text-ink-faint">
                <Spinner size={12} /> applying…
              </div>
            )}
          </div>
          <div className="border-t border-line p-3">
            <div className="flex items-end gap-2 rounded-2xl border border-line bg-cream-100 p-1.5 focus-within:border-ink/20">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                rows={1}
                placeholder="Request a change…"
                className="max-h-24 flex-1 resize-none bg-transparent px-2 py-1.5 text-[13px] text-ink outline-none placeholder:text-ink-faint"
              />
              <button
                onClick={send}
                disabled={!input.trim() || chatMut.isPending}
                className="inline-flex size-8 shrink-0 items-center justify-center rounded-xl bg-ink text-cream-50 transition hover:bg-ink-soft disabled:opacity-40"
                aria-label="Send"
              >
                <Send size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* CENTER — preview */}
        <div className="flex h-[640px] flex-col overflow-hidden rounded-3xl border border-line bg-cream-50 shadow-card">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <div className="flex items-center gap-2">
              <MonitorPlay size={16} className="text-ink-soft" />
              <span className="text-sm font-semibold text-ink">Live preview</span>
            </div>
            {previewReady && (
              <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700">
                Preview mode — not live yet
              </span>
            )}
          </div>
          <div className="relative flex-1 bg-cream-100">
            {previewReady ? (
              <iframe
                title="preview"
                src={previewUrl ?? undefined}
                className="size-full border-0 bg-white"
                sandbox="allow-scripts allow-same-origin allow-forms"
              />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
                <div className="w-full max-w-sm space-y-3">
                  <div className="skeleton h-10 w-2/3" />
                  <div className="skeleton h-24 w-full" />
                  <div className="grid grid-cols-3 gap-2">
                    <div className="skeleton h-16" />
                    <div className="skeleton h-16" />
                    <div className="skeleton h-16" />
                  </div>
                  <div className="skeleton h-32 w-full" />
                </div>
                <p className="flex items-center gap-2 text-sm text-ink-muted">
                  <Loader2 size={15} className="animate-spin text-forge-500" />
                  {stream.done ? "Finishing up…" : "Building your interface…"}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT — activity */}
        <div className="h-[640px] overflow-hidden rounded-3xl border border-line bg-cream-50 shadow-card">
          <BuildActivity events={stream.events} connected={stream.connected} done={stream.done} ok={stream.ok} />
        </div>
      </div>

      {/* Sticky bottom bar */}
      <div className="sticky bottom-5 mt-5 flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-cream-50/90 p-3 shadow-soft-lg backdrop-blur">
        <div className="flex items-center gap-2 pl-2">
          {previewReady ? (
            <>
              <span className="inline-flex size-7 items-center justify-center rounded-full bg-sage-100 text-sage-600">
                <Check size={15} strokeWidth={2.5} />
              </span>
              <span className="text-sm font-medium text-ink">Preview ready</span>
            </>
          ) : (
            <>
              <Loader2 size={16} className="animate-spin text-forge-500" />
              <span className="text-sm text-ink-muted">Building…</span>
            </>
          )}
        </div>
        <div className="ml-auto flex flex-wrap gap-2">
          {previewReady && (
            <Button
              variant="secondary"
              onClick={() => window.open(previewUrl!, "_blank")}
              leftIcon={<ExternalLink size={15} />}
            >
              Open preview
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => document.querySelector<HTMLTextAreaElement>("textarea")?.focus()}
          >
            Request changes
          </Button>
          <Button variant="ember" onClick={() => navigate(`/deploy/${toolId}`)} leftIcon={<Rocket size={16} />}>
            Deploy
          </Button>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Page shell — orchestrates the three steps
// =============================================================================

export function BuildPage() {
  const { id } = useParams<{ id: string }>();
  const { data: tool, isLoading, isError } = useTool(id);
  const [step, setStep] = useState<Step>("discover");
  const [jobId, setJobId] = useState<string | null>(null);

  // If the tool is already building / has a job, jump straight to the build step.
  const resolvedJobId = useMemo(() => jobId ?? tool?.latestJob?.id ?? null, [jobId, tool?.latestJob?.id]);

  useEffect(() => {
    if (!tool) return;
    if (resolvedJobId && (tool.status === "building" || tool.status === "preview_ready" || tool.latestJob)) {
      setStep("build");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tool?.id]);

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-3 text-ink-muted">
          <Spinner size={20} /> Loading build flow…
        </div>
      </div>
    );
  }

  if (isError || !tool || !id) {
    return (
      <div className="mx-auto max-w-md py-20 text-center">
        <h1 className="font-display text-2xl text-ink">Tool not found</h1>
        <p className="mt-2 text-sm text-ink-muted">This tool may have been removed.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Breadcrumb
          items={[
            { label: "Tools", to: "/tools" },
            { label: tool.name, to: `/tools/${tool.id}` },
            { label: "Build" },
          ]}
        />
        <StepRail step={step} />
      </div>

      <div className="mt-8">
        <AnimatePresence mode="wait">
          {step === "discover" && (
            <motion.div
              key="discover"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <DiscoveryStep
                toolId={id}
                providers={tool.selectedProviders ?? []}
                onContinue={() => setStep("plan")}
              />
            </motion.div>
          )}
          {step === "plan" && (
            <motion.div key="plan" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <PlanStep
                toolId={id}
                initialPlan={tool.plan}
                onApproved={(jid) => {
                  setJobId(jid);
                  setStep("build");
                }}
              />
            </motion.div>
          )}
          {step === "build" && (
            <motion.div key="build" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {resolvedJobId ? (
                <BuildStep toolId={id} toolName={tool.name} initialJobId={resolvedJobId} />
              ) : (
                <div className="py-20 text-center text-ink-muted">
                  <Spinner size={20} className="mx-auto" />
                  <p className="mt-3">Starting the build…</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
