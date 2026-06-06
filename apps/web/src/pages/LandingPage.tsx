import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Play,
  Sparkles,
  Plug,
  MessageSquareText,
  ClipboardCheck,
  Rocket,
} from "lucide-react";
import { LinkButton } from "@/components/Button";
import { AppIcon } from "@/components/AppIcon";
import { StatusBadge } from "@/components/StatusBadge";

const SHOWCASE = [
  {
    name: "Refund Request Dashboard",
    dept: "Finance",
    status: "live",
    blurb: "Match Stripe payments, approve with manager rules.",
    apps: ["gmail", "stripe", "slack"],
    rotate: "-2deg",
  },
  {
    name: "Lead Review Queue",
    dept: "Sales",
    status: "draft",
    blurb: "Enrich inbound leads, assign owners, track follow-ups.",
    apps: ["hubspot", "gmail", "slack"],
    rotate: "1.5deg",
  },
  {
    name: "Support Escalation Board",
    dept: "Support",
    status: "review_needed",
    blurb: "Turn angry tickets into Linear tasks and alerts.",
    apps: ["linear", "slack"],
    rotate: "-1deg",
  },
  {
    name: "Invoice Approval Tool",
    dept: "Finance",
    status: "live",
    blurb: "Extract invoices, route approval, track payment.",
    apps: ["gmail", "sheets", "slack"],
    rotate: "2deg",
  },
];

const STEPS = [
  {
    icon: Plug,
    title: "Connect your stack",
    body: "Gmail, Stripe, Slack, HubSpot, Linear and more — one click each.",
  },
  {
    icon: MessageSquareText,
    title: "Describe what you need",
    body: "Plain language. “A refund queue that pulls from Stripe and Gmail.”",
  },
  {
    icon: ClipboardCheck,
    title: "Review the plan",
    body: "Pages, data models, workflows, permissions — all laid out before a line is built.",
  },
  {
    icon: Rocket,
    title: "Deploy the tool",
    body: "Live in minutes on managed hosting, with audit logs and approvals built in.",
  },
];

const MiniNav = () => (
  <header className="sticky top-0 z-40 border-b border-line/60 glass">
    <div className="mx-auto flex h-16 max-w-7xl items-center px-5 sm:px-8">
      <Link to="/" className="flex items-center gap-2.5">
        <span className="inline-flex size-8 items-center justify-center rounded-[10px] bg-ink text-cream-50 shadow-soft">
          <Sparkles size={16} className="text-forge-400" strokeWidth={2.4} />
        </span>
        <span className="font-display text-[19px] font-medium tracking-tight text-ink">forgeit</span>
      </Link>
      <nav className="ml-auto flex items-center gap-1">
        <Link to="/tools" className="rounded-full px-3.5 py-2 text-sm font-medium text-ink-muted transition hover:text-ink">
          tools
        </Link>
        <Link to="/stack" className="rounded-full px-3.5 py-2 text-sm font-medium text-ink-muted transition hover:text-ink">
          stack
        </Link>
        <LinkButton to="/forge" size="sm" className="ml-2">
          Start forging
        </LinkButton>
      </nav>
    </div>
  </header>
);

export function LandingPage() {
  return (
    <div className="min-h-screen">
      <MiniNav />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-5 pb-10 pt-16 sm:px-8 sm:pt-24">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full border border-line bg-cream-50 py-1.5 pl-2 pr-3.5 text-[13px] text-ink-muted shadow-soft"
          >
            <span className="inline-flex items-center gap-1 rounded-full bg-forge-50 px-2 py-0.5 text-[11px] font-semibold text-forge-600">
              <span className="size-1.5 rounded-full bg-forge-500 animate-pulse-soft" />
              new
            </span>
            internal tools, forged from a sentence
          </motion.div>

          <h1 className="mt-7 max-w-3xl font-display text-5xl font-medium leading-[1.05] tracking-tight text-ink text-balance sm:text-[68px]">
            Build internal tools by
            <span className="relative whitespace-nowrap">
              {" "}
              describing
              <svg
                className="absolute -bottom-2 left-0 w-full text-forge-400"
                viewBox="0 0 300 12"
                fill="none"
                preserveAspectRatio="none"
              >
                <path
                  d="M2 9C60 3 140 3 298 8"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </svg>
            </span>{" "}
            them.
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-muted">
            ForgeIt connects your stack, plans the build, and ships a real, deployable
            internal tool — dashboards, approval queues, admin panels — without the eng backlog.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-3">
            <LinkButton to="/forge" size="lg" rightIcon={<ArrowRight size={18} />}>
              Start forging
            </LinkButton>
            <LinkButton to="/tools" size="lg" variant="secondary" leftIcon={<Play size={16} />}>
              View example
            </LinkButton>
          </div>

          <div className="mt-8 flex items-center gap-3 text-sm text-ink-faint">
            <span>Plays nicely with</span>
            <div className="flex gap-1.5">
              {["gmail", "stripe", "slack", "hubspot", "linear", "notion"].map((p) => (
                <AppIcon key={p} provider={p} size="xs" />
              ))}
            </div>
          </div>
        </div>

        {/* Showcase grid — playful, slightly tilted cards */}
        <div className="mx-auto max-w-7xl px-5 pb-20 sm:px-8">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {SHOWCASE.map((tool, i) => (
              <motion.div
                key={tool.name}
                initial={{ opacity: 0, y: 24, rotate: 0 }}
                animate={{ opacity: 1, y: 0, rotate: tool.rotate }}
                transition={{ duration: 0.5, delay: 0.15 + i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{ rotate: 0, y: -6 }}
                className="rounded-3xl border border-line bg-cream-50 p-5 shadow-card"
              >
                <div className="flex items-start justify-between">
                  <div className="flex -space-x-1.5">
                    {tool.apps.map((p) => (
                      <AppIcon key={p} provider={p} size="sm" className="ring-2 ring-cream-50" />
                    ))}
                  </div>
                  <StatusBadge status={tool.status} size="sm" />
                </div>
                <h3 className="mt-4 font-display text-base leading-snug text-ink">{tool.name}</h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-ink-muted">{tool.blurb}</p>
                <p className="mt-4 text-[11px] font-medium uppercase tracking-[0.12em] text-ink-faint">
                  {tool.dept}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className="mx-auto max-w-7xl px-5 pb-24 sm:px-8">
        <div className="grain overflow-hidden rounded-[2.5rem] border border-line bg-ink p-8 text-cream-50 sm:p-14">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-forge-400">
            how it works
          </p>
          <h2 className="mt-3 max-w-2xl font-display text-3xl font-medium leading-tight sm:text-4xl">
            From a sentence to a shipped tool, in four calm steps.
          </h2>
          <div className="mt-12 grid grid-cols-1 gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, i) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
              >
                <div className="flex items-center gap-3">
                  <span className="inline-flex size-11 items-center justify-center rounded-2xl bg-cream-50/10 text-forge-400 ring-1 ring-cream-50/10">
                    <step.icon size={20} />
                  </span>
                  <span className="font-mono text-sm text-cream-50/40">0{i + 1}</span>
                </div>
                <h3 className="mt-4 font-display text-lg">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-cream-50/65">{step.body}</p>
              </motion.div>
            ))}
          </div>

          <div className="mt-12 flex flex-wrap items-center gap-4 border-t border-cream-50/10 pt-8">
            <LinkButton to="/forge" variant="ember" size="lg" rightIcon={<ArrowRight size={18} />}>
              Forge your first tool
            </LinkButton>
            <span className="text-sm text-cream-50/55">No setup. Connect what you have, skip the rest.</span>
          </div>
        </div>
      </section>

      <footer className="border-t border-line/70">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-5 py-8 text-sm text-ink-faint sm:flex-row sm:px-8">
          <div className="flex items-center gap-2">
            <Sparkles size={14} className="text-forge-500" />
            <span className="font-display text-ink">forgeit</span>
          </div>
          <p>Lovable, but for the internal tools nobody wants to build.</p>
        </div>
      </footer>
    </div>
  );
}
