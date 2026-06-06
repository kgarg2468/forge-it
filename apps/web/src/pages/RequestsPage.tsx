import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, MessageSquare } from "lucide-react";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Button } from "@/components/Button";
import { Modal } from "@/components/Modal";
import { AppStack } from "@/components/AppIcon";
import { cx } from "@/lib/utils";
import { toast } from "@/lib/store";

interface Request {
  id: string;
  title: string;
  detail: string;
  dept: string;
  apps: string[];
  votes: number;
}

const INITIAL: Record<string, Request[]> = {
  requested: [
    { id: "r1", title: "Vendor onboarding checklist", detail: "Track new supplier paperwork and approvals.", dept: "Operations", apps: ["notion", "slack"], votes: 7 },
    { id: "r2", title: "Churn risk watchlist", detail: "Flag accounts with declining usage from Stripe + HubSpot.", dept: "Sales", apps: ["stripe", "hubspot"], votes: 12 },
  ],
  planned: [
    { id: "r3", title: "On-call handoff log", detail: "Capture incidents and route follow-ups to Linear.", dept: "Engineering", apps: ["linear", "slack"], votes: 5 },
  ],
  building: [
    { id: "r4", title: "Refund Request Dashboard", detail: "Match Stripe payments, approve with manager rules.", dept: "Finance", apps: ["gmail", "stripe", "slack"], votes: 9 },
  ],
  live: [
    { id: "r5", title: "Invoice Approval Tool", detail: "Extract invoices, route approval, track payment.", dept: "Finance", apps: ["gmail", "sheets", "slack"], votes: 14 },
  ],
};

const COLUMNS: { key: keyof typeof INITIAL; label: string; dot: string }[] = [
  { key: "requested", label: "Requested", dot: "#9A9489" },
  { key: "planned", label: "Planned", dot: "#3b82f6" },
  { key: "building", label: "Building", dot: "#f59e0b" },
  { key: "live", label: "Live", dot: "#5C8A5A" },
];

export function RequestsPage() {
  const [board, setBoard] = useState(INITIAL);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [detail, setDetail] = useState("");

  const submit = () => {
    if (!title.trim()) return;
    const req: Request = {
      id: `r${Date.now()}`,
      title: title.trim(),
      detail: detail.trim() || "No detail provided.",
      dept: "—",
      apps: [],
      votes: 1,
    };
    setBoard((b) => ({ ...b, requested: [req, ...b.requested] }));
    setOpen(false);
    setTitle("");
    setDetail("");
    toast.success("Request submitted", "Added to the Requested column.");
  };

  return (
    <div>
      <Breadcrumb items={[{ label: "Home", to: "/" }, { label: "Requests" }]} />
      <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-4xl font-medium tracking-tight text-ink">Requests</h1>
          <p className="mt-2 max-w-lg text-[15px] text-ink-muted">
            What the team wants built next — from idea to live tool.
          </p>
        </div>
        <Button onClick={() => setOpen(true)} leftIcon={<Plus size={16} />}>
          New request
        </Button>
      </div>

      <div className="mt-7 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {COLUMNS.map((col) => (
          <div key={col.key} className="rounded-3xl border border-line bg-cream-100/40 p-3">
            <div className="flex items-center justify-between px-2 py-1.5">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full" style={{ backgroundColor: col.dot }} />
                <span className="text-sm font-semibold text-ink">{col.label}</span>
              </div>
              <span className="rounded-full bg-cream-200/80 px-2 py-0.5 text-xs text-ink-muted">
                {board[col.key].length}
              </span>
            </div>
            <div className="mt-2 space-y-2.5">
              {board[col.key].map((req, i) => (
                <motion.div
                  key={req.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="rounded-2xl border border-line bg-cream-50 p-4 shadow-soft transition hover:shadow-soft-lg"
                >
                  <p className="text-sm font-medium text-ink">{req.title}</p>
                  <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-ink-muted">{req.detail}</p>
                  <div className="mt-3 flex items-center justify-between">
                    {req.apps.length > 0 ? <AppStack providers={req.apps} max={3} /> : <span className="text-[11px] text-ink-faint">{req.dept}</span>}
                    <span className="inline-flex items-center gap-1 rounded-full bg-ink/[0.05] px-2 py-0.5 text-[11px] font-medium text-ink-muted">
                      ▲ {req.votes}
                    </span>
                  </div>
                </motion.div>
              ))}
              {board[col.key].length === 0 && (
                <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-line py-8 text-center">
                  <MessageSquare size={18} className="text-ink-faint" />
                  <span className="text-xs text-ink-faint">Nothing here yet</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="New request"
        description="Suggest an internal tool for the team to build."
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={submit} disabled={!title.trim()}>Submit request</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-ink-soft">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Contract renewal tracker"
              className="mt-1.5 w-full rounded-xl border border-line bg-cream-100 px-3.5 py-2.5 text-sm text-ink outline-none focus:border-ink/25"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-ink-soft">What should it do?</label>
            <textarea
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              rows={4}
              placeholder="Describe the workflow and which apps it should use."
              className={cx(
                "mt-1.5 w-full resize-none rounded-xl border border-line bg-cream-100 px-3.5 py-2.5 text-sm text-ink outline-none focus:border-ink/25",
              )}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
