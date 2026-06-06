import { useEffect, useMemo, useRef } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Info,
  FileCode2,
  Loader2,
  CircleCheckBig,
} from "lucide-react";
import type { BuildEvent, LogLevel } from "@/types";
import { cx } from "@/lib/utils";
import { Spinner } from "@/components/Spinner";

const levelMeta: Record<LogLevel, { icon: typeof Info; color: string }> = {
  info: { icon: Info, color: "text-ink-faint" },
  success: { icon: CheckCircle2, color: "text-sage-500" },
  warning: { icon: AlertTriangle, color: "text-amber-500" },
  error: { icon: XCircle, color: "text-red-500" },
};

interface BuildActivityProps {
  events: BuildEvent[];
  connected: boolean;
  done: boolean;
  ok: boolean | null;
}

interface Row {
  key: string;
  step?: string;
  level?: LogLevel;
  message: string;
  isFile?: boolean;
}

export function BuildActivity({ events, connected, done, ok }: BuildActivityProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const rows: Row[] = useMemo(() => {
    const out: Row[] = [];
    events.forEach((e, i) => {
      if (e.kind === "log") {
        out.push({ key: `l${i}`, step: e.step, level: e.level, message: e.message });
      } else if (e.kind === "file") {
        out.push({ key: `f${i}`, message: `${e.action} ${e.path}`, isFile: true });
      } else if (e.kind === "status" && e.currentStep) {
        out.push({ key: `s${i}`, level: "info", message: `→ ${e.currentStep}` });
      }
    });
    return out;
  }, [events]);

  const currentStep = useMemo(() => {
    for (let i = events.length - 1; i >= 0; i--) {
      const e = events[i]!;
      if (e.kind === "status" && e.currentStep) return e.currentStep;
      if (e.kind === "log" && e.step) return e.step;
    }
    return null;
  }, [events]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [rows.length]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-ink">Build activity</span>
          {!done && connected && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">
              <Loader2 size={11} className="animate-spin" /> running
            </span>
          )}
          {done && (
            <span
              className={cx(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium",
                ok ? "bg-sage-100 text-sage-600" : "bg-red-50 text-red-700",
              )}
            >
              {ok ? <CircleCheckBig size={11} /> : <XCircle size={11} />}
              {ok ? "complete" : "failed"}
            </span>
          )}
        </div>
        {currentStep && !done && (
          <span className="truncate text-[11px] text-ink-faint">{currentStep}</span>
        )}
      </div>

      <div ref={scrollRef} className="flex-1 space-y-1 overflow-y-auto p-3 font-mono text-[12.5px] leading-relaxed">
        {rows.length === 0 && !connected && (
          <div className="flex h-full items-center justify-center px-4 py-10 text-center font-sans text-sm text-ink-faint">
            Waiting for the build to start…
          </div>
        )}
        {rows.length === 0 && connected && (
          <div className="flex items-center gap-2 px-2 py-3 font-sans text-sm text-ink-muted">
            <Spinner size={14} /> Connecting to build stream…
          </div>
        )}
        {rows.map((row, i) => {
          if (row.isFile) {
            return (
              <motion.div
                key={row.key}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2 rounded-lg px-2 py-1 text-ink-muted"
              >
                <FileCode2 size={13} className="shrink-0 text-blue-500" />
                <span className="truncate">{row.message}</span>
              </motion.div>
            );
          }
          const meta = levelMeta[row.level ?? "info"];
          const Icon = meta.icon;
          return (
            <motion.div
              key={row.key}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
              className={cx(
                "flex items-start gap-2 rounded-lg px-2 py-1",
                row.level === "error" && "bg-red-50/60",
                row.level === "success" && i === rows.length - 1 && "bg-sage-100/40",
              )}
            >
              <Icon size={13} className={cx("mt-0.5 shrink-0", meta.color)} />
              <span className={cx("flex-1", row.level === "error" ? "text-red-700" : "text-ink-soft")}>
                {row.message}
              </span>
            </motion.div>
          );
        })}
        {!done && connected && rows.length > 0 && (
          <div className="flex items-center gap-2 px-2 py-1.5 text-ink-faint">
            <Spinner size={12} />
            <span className="font-sans">working…</span>
          </div>
        )}
      </div>
    </div>
  );
}
