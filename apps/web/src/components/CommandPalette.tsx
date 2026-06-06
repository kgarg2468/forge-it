import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Search, CornerDownLeft, Hammer, Layers, Boxes } from "lucide-react";
import { usePaletteStore } from "@/lib/store";
import { useTools } from "@/lib/queries";
import { StatusBadge } from "@/components/StatusBadge";
import { AppStack } from "@/components/AppIcon";

const QUICK = [
  { label: "Forge a new tool", to: "/forge", icon: Hammer },
  { label: "Connected stack", to: "/stack", icon: Layers },
  { label: "All tools", to: "/tools", icon: Boxes },
];

export function CommandPalette() {
  const { open, setOpen } = usePaletteStore();
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const { data: tools } = useTools();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(!open);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const filtered = useMemo(() => {
    if (!tools) return [];
    const q = query.trim().toLowerCase();
    if (!q) return tools.slice(0, 6);
    return tools
      .filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          (t.department ?? "").toLowerCase().includes(q) ||
          t.connectedApps.some((a) => a.toLowerCase().includes(q)),
      )
      .slice(0, 8);
  }, [tools, query]);

  const go = (to: string) => {
    setOpen(false);
    navigate(to);
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[70] flex items-start justify-center px-4 pt-[12vh]">
          <motion.div
            className="absolute inset-0 bg-ink/30 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          />
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 340, damping: 30 }}
            className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-line bg-cream-50 shadow-soft-lg"
          >
            <div className="flex items-center gap-3 border-b border-line px-5 py-4">
              <Search size={18} className="text-ink-faint" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search tools, apps, departments…"
                className="flex-1 bg-transparent text-[15px] text-ink outline-none placeholder:text-ink-faint"
              />
              <kbd className="rounded-md border border-line bg-cream-100 px-1.5 py-0.5 font-mono text-[10px] text-ink-faint">
                esc
              </kbd>
            </div>

            <div className="max-h-[52vh] overflow-y-auto p-2">
              {!query && (
                <>
                  <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
                    Quick actions
                  </p>
                  {QUICK.map((q) => (
                    <button
                      key={q.to}
                      onClick={() => go(q.to)}
                      className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition hover:bg-cream-200/60"
                    >
                      <span className="inline-flex size-8 items-center justify-center rounded-lg bg-ink/[0.05] text-ink-soft">
                        <q.icon size={16} />
                      </span>
                      <span className="flex-1 text-sm font-medium text-ink">{q.label}</span>
                      <CornerDownLeft size={14} className="text-ink-faint" />
                    </button>
                  ))}
                </>
              )}

              <p className="px-3 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
                {query ? "Results" : "Recent tools"}
              </p>
              {filtered.length === 0 && (
                <p className="px-3 py-6 text-center text-sm text-ink-muted">
                  No tools match “{query}”.
                </p>
              )}
              {filtered.map((t) => (
                <button
                  key={t.id}
                  onClick={() => go(`/tools/${t.id}`)}
                  className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition hover:bg-cream-200/60"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium text-ink">{t.name}</span>
                      <StatusBadge status={t.status} size="sm" />
                    </div>
                    <p className="truncate text-xs text-ink-muted">{t.description}</p>
                  </div>
                  {t.connectedApps.length > 0 && <AppStack providers={t.connectedApps} max={3} />}
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
