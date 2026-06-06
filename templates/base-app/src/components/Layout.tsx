import { useState } from "react";
import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { Menu, ShieldCheck, X } from "lucide-react";
import { config, isReviewMode } from "../lib/config";
import { cn } from "../lib/cn";

export interface NavItem {
  label: string;
  to: string;
  icon?: ReactNode;
  /** Match the route exactly (use for the index "/" route). */
  end?: boolean;
}

export interface LayoutProps {
  /** Sidebar navigation items. */
  nav?: NavItem[];
  /** Right-aligned topbar content (e.g. user menu, actions). */
  topbarActions?: ReactNode;
  /** Optional page title shown in the topbar. */
  pageTitle?: ReactNode;
  children: ReactNode;
}

export function Layout({
  nav = [],
  topbarActions,
  pageTitle,
  children,
}: LayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2.5 px-5 h-16 border-b border-gray-100">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-ink-900 text-white text-sm font-semibold shrink-0">
          {initials(config.toolName)}
        </div>
        <span className="font-semibold text-ink-900 truncate">
          {config.toolName}
        </span>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {nav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-ink-900 text-white"
                  : "text-gray-600 hover:bg-gray-100 hover:text-ink-900"
              )
            }
          >
            {item.icon && <span className="shrink-0">{item.icon}</span>}
            <span className="truncate">{item.label}</span>
          </NavLink>
        ))}
        {nav.length === 0 && (
          <p className="px-3 py-2 text-xs text-gray-400">
            No navigation yet.
          </p>
        )}
      </nav>

      <div className="px-5 py-4 border-t border-gray-100">
        <p className="text-xs text-gray-400">Built with ForgeIt</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-cream-100">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-100 flex-col">
        {sidebar}
      </aside>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div
            className="absolute inset-0 bg-ink-900/40"
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />
          <aside className="absolute inset-y-0 left-0 w-64 bg-white border-r border-gray-100">
            <button
              onClick={() => setMobileOpen(false)}
              aria-label="Close menu"
              className="absolute right-3 top-4 rounded-lg p-1.5 text-gray-400 hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </button>
            {sidebar}
          </aside>
        </div>
      )}

      <div className="lg:pl-64">
        {/* Topbar */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-gray-100 bg-cream-100/80 backdrop-blur px-4 sm:px-6">
          <button
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
            className="lg:hidden rounded-lg p-2 text-gray-500 hover:bg-gray-100"
          >
            <Menu className="h-5 w-5" />
          </button>
          {pageTitle && (
            <h1 className="text-base font-semibold text-ink-900 truncate">
              {pageTitle}
            </h1>
          )}
          <div className="ml-auto flex items-center gap-2">{topbarActions}</div>
        </header>

        {/* Review-flow banner */}
        {isReviewMode && (
          <div className="flex items-center gap-2 border-b border-amber-100 bg-amber-50 px-4 sm:px-6 py-2 text-sm text-amber-800">
            <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden />
            <span>
              <span className="font-medium">Review mode.</span> High-risk
              actions move through the approval flow before direct execution.
            </span>
          </div>
        )}

        <main className="px-4 sm:px-6 py-6 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "FT";
}
