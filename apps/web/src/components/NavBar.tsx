import { useEffect, useRef, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, Search, Sparkles } from "lucide-react";
import { cx, initials } from "@/lib/utils";
import { useMe } from "@/lib/queries";
import { usePaletteStore } from "@/lib/store";

const NAV = [
  { to: "/tools", label: "tools" },
  { to: "/forge", label: "forge" },
  { to: "/stack", label: "stack" },
  { to: "/requests", label: "requests" },
  { to: "/deploys", label: "deploys" },
];

const NOTIFS = [
  { title: "Refund Request Dashboard is live", detail: "Deployed to production", time: "2m ago", tone: "live" },
  { title: "Support Escalation Board needs review", detail: "1 change awaiting approval", time: "1h ago", tone: "review" },
  { title: "Lead Review Queue plan ready", detail: "MiniMax finished planning", time: "3h ago", tone: "plan" },
];

function Brand() {
  return (
    <Link to="/" className="group flex items-center gap-2.5">
      <span className="inline-flex size-8 items-center justify-center rounded-[10px] bg-ink text-cream-50 shadow-soft transition-transform duration-300 group-hover:rotate-[-6deg]">
        <Sparkles size={16} className="text-forge-400" strokeWidth={2.4} />
      </span>
      <span className="font-display text-[19px] font-medium tracking-tight text-ink">
        forgeit
      </span>
    </Link>
  );
}

function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative inline-flex size-9 items-center justify-center rounded-full text-ink-soft transition hover:bg-ink/[0.06] hover:text-ink"
        aria-label="Notifications"
      >
        <Bell size={18} />
        <span className="absolute right-2 top-2 size-1.5 rounded-full bg-forge-500 ring-2 ring-cream-100" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.16 }}
            className="absolute right-0 top-12 z-50 w-80 overflow-hidden rounded-2xl border border-line bg-cream-50 shadow-soft-lg"
          >
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <p className="text-sm font-semibold text-ink">Notifications</p>
              <span className="text-xs text-ink-faint">3 new</span>
            </div>
            <div className="max-h-80 divide-y divide-line overflow-y-auto">
              {NOTIFS.map((n) => (
                <div key={n.title} className="flex gap-3 px-4 py-3 transition hover:bg-cream-100/70">
                  <span
                    className={cx(
                      "mt-1.5 size-2 shrink-0 rounded-full",
                      n.tone === "live" && "bg-sage-500",
                      n.tone === "review" && "bg-orange-500",
                      n.tone === "plan" && "bg-blue-500",
                    )}
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink">{n.title}</p>
                    <p className="truncate text-xs text-ink-muted">{n.detail}</p>
                    <p className="mt-0.5 text-[11px] text-ink-faint">{n.time}</p>
                  </div>
                </div>
              ))}
            </div>
            <Link
              to="/requests"
              onClick={() => setOpen(false)}
              className="block border-t border-line px-4 py-2.5 text-center text-xs font-medium text-ink-soft transition hover:bg-cream-100/70 hover:text-ink"
            >
              View all activity
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function NavBar() {
  const { data: me } = useMe();
  const openPalette = usePaletteStore((s) => s.setOpen);

  return (
    <header className="sticky top-0 z-40 border-b border-line/70 glass">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-5 sm:px-8">
        <Brand />
        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cx(
                  "rounded-full px-3.5 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-ink/[0.06] text-ink"
                    : "text-ink-muted hover:bg-ink/[0.04] hover:text-ink",
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1.5">
          <button
            onClick={() => openPalette(true)}
            className="hidden items-center gap-2 rounded-full border border-line bg-cream-50 py-1.5 pl-3 pr-2 text-sm text-ink-faint transition hover:border-ink/15 hover:text-ink-muted sm:flex"
          >
            <Search size={15} />
            <span className="pr-6">Search tools…</span>
            <kbd className="rounded-md border border-line bg-cream-100 px-1.5 py-0.5 font-mono text-[10px] text-ink-faint">
              ⌘K
            </kbd>
          </button>
          <button
            onClick={() => openPalette(true)}
            className="inline-flex size-9 items-center justify-center rounded-full text-ink-soft transition hover:bg-ink/[0.06] hover:text-ink sm:hidden"
            aria-label="Search"
          >
            <Search size={18} />
          </button>
          <NotificationBell />
          <button
            className="ml-1 inline-flex size-9 items-center justify-center rounded-full bg-ink text-[13px] font-semibold text-cream-50 shadow-soft transition hover:bg-ink-soft"
            title={me?.user?.name ?? "Account"}
          >
            {initials(me?.user?.name)}
          </button>
        </div>
      </div>
    </header>
  );
}
