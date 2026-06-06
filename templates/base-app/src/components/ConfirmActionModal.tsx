import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  PlayCircle,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { runAction } from "../lib/actions";
import type { ActionResult } from "../lib/actions";
import { isDemoSafe } from "../lib/config";

export interface ConfirmActionModalProps {
  open: boolean;
  onClose: () => void;
  /** Composio action slug to run, e.g. "GMAIL_SEND_EMAIL". */
  slug: string;
  /** Arguments passed to the action. */
  args: Record<string, unknown>;
  /** Human title, e.g. "Send refund confirmation email". */
  title: string;
  /** Plain-language description of what running this action WILL do. */
  description?: ReactNode;
  /** Whether this is a high-risk action (informational badge). Defaults to true. */
  highRisk?: boolean;
  /** Label for the confirm button. Defaults to "Run test". */
  confirmLabel?: string;
  /** Called after a successful run with the result. */
  onSuccess?: (result: ActionResult) => void;
}

type Phase = "idle" | "running" | "done" | "error";

export function ConfirmActionModal({
  open,
  onClose,
  slug,
  args,
  title,
  description,
  highRisk = true,
  confirmLabel = "Run test",
  onSuccess,
}: ConfirmActionModalProps) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [result, setResult] = useState<ActionResult | null>(null);

  // Reset internal state whenever the modal is (re)opened.
  useEffect(() => {
    if (open) {
      setPhase("idle");
      setResult(null);
    }
  }, [open, slug]);

  async function handleRun() {
    setPhase("running");
    try {
      // In demo-safe mode runAction forces a simulation regardless of `live`.
      const res = await runAction(slug, args, { live: false });
      setResult(res);
      setPhase(res.ok ? "done" : "error");
      if (res.ok) onSuccess?.(res);
    } catch (err) {
      setResult({
        ok: false,
        simulated: true,
        error: err instanceof Error ? err.message : String(err),
      });
      setPhase("error");
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      widthClassName="max-w-lg"
      footer={
        phase === "done" || phase === "error" ? (
          <Button variant="primary" onClick={onClose}>
            Close
          </Button>
        ) : (
          <>
            <Button
              variant="ghost"
              onClick={onClose}
              disabled={phase === "running"}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              loading={phase === "running"}
              onClick={handleRun}
              leftIcon={<PlayCircle className="h-4 w-4" />}
            >
              {confirmLabel}
            </Button>
          </>
        )
      }
    >
      <div className="space-y-4 py-1">
        {/* What it will do */}
        <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
          <div className="flex items-center gap-2 mb-2">
            {highRisk ? (
              <AlertTriangle className="h-4 w-4 text-amber-500" aria-hidden />
            ) : (
              <ShieldCheck className="h-4 w-4 text-gray-400" aria-hidden />
            )}
            <p className="text-sm font-medium text-ink-900">
              This action will run:
            </p>
          </div>
          <code className="block text-xs font-mono text-ink-800 break-all">
            {slug}
          </code>
          {Object.keys(args).length > 0 && (
            <pre className="mt-2 max-h-40 overflow-auto rounded-lg bg-white border border-gray-100 p-3 text-xs text-gray-600">
              {safeJson(args)}
            </pre>
          )}
        </div>

        {/* Demo-safe note */}
        {isDemoSafe && (
          <p className="flex items-start gap-2 text-xs text-amber-700">
            <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5" aria-hidden />
            <span>
              Demo-safe mode is on — this will be{" "}
              <span className="font-medium">simulated</span>, not executed for
              real.
            </span>
          </p>
        )}

        {/* Result */}
        {phase === "done" && result && (
          <div className="rounded-xl border border-green-100 bg-green-50 p-4">
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle2 className="h-5 w-5" aria-hidden />
              <p className="text-sm font-semibold">
                Test passed
                {result.simulated ? " (simulated)" : " (live)"}
              </p>
            </div>
            {result.data != null && (
              <pre className="mt-2 max-h-48 overflow-auto rounded-lg bg-white border border-green-100 p-3 text-xs text-gray-600">
                {safeJson(result.data)}
              </pre>
            )}
          </div>
        )}

        {phase === "error" && result && (
          <div className="rounded-xl border border-red-100 bg-red-50 p-4">
            <div className="flex items-center gap-2 text-red-700">
              <XCircle className="h-5 w-5" aria-hidden />
              <p className="text-sm font-semibold">Action failed</p>
            </div>
            <p className="mt-1 text-xs text-red-600 break-words">
              {result.error ?? "Unknown error."}
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
}

function safeJson(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}
