import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { useToastStore } from "@/lib/store";
import type { ToastTone } from "@/lib/store";

const toneMeta: Record<ToastTone, { icon: typeof Info; className: string }> = {
  success: { icon: CheckCircle2, className: "text-sage-600" },
  error: { icon: AlertCircle, className: "text-red-600" },
  info: { icon: Info, className: "text-blue-600" },
};

export function Toaster() {
  const { toasts, dismiss } = useToastStore();
  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-[60] flex w-full max-w-sm flex-col gap-2">
      <AnimatePresence>
        {toasts.map((t) => {
          const meta = toneMeta[t.tone];
          const Icon = meta.icon;
          return (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, x: 40, scale: 0.96 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 360, damping: 30 }}
              className="pointer-events-auto flex items-start gap-3 rounded-2xl border border-line bg-cream-50 p-4 shadow-soft-lg"
            >
              <Icon size={18} className={meta.className} />
              <div className="flex-1">
                <p className="text-sm font-medium text-ink">{t.message}</p>
                {t.description && (
                  <p className="mt-0.5 text-xs leading-relaxed text-ink-muted">{t.description}</p>
                )}
              </div>
              <button
                onClick={() => dismiss(t.id)}
                className="text-ink-faint transition hover:text-ink"
                aria-label="Dismiss"
              >
                <X size={15} />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
