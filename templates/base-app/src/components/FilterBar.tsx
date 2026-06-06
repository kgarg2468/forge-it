import type { ReactNode } from "react";
import { Search } from "lucide-react";
import { cn } from "../lib/cn";

export interface SelectFilter {
  /** Unique key (e.g. "status"). */
  key: string;
  /** Accessible label / placeholder. */
  label: string;
  value: string;
  options: { label: string; value: string }[];
  onChange: (value: string) => void;
}

export interface FilterBarProps {
  /** Search box props. Omit to hide the search input. */
  search?: {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
  };
  /** Select filters rendered to the right of the search box. */
  selects?: SelectFilter[];
  /** Extra controls (e.g. a "New" button) rendered at the far right. */
  children?: ReactNode;
  className?: string;
}

export function FilterBar({
  search,
  selects = [],
  children,
  className,
}: FilterBarProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap",
        className
      )}
    >
      {search && (
        <div className="relative flex-1 min-w-[12rem]">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
            aria-hidden
          />
          <input
            type="text"
            value={search.value}
            onChange={(e) => search.onChange(e.target.value)}
            placeholder={search.placeholder ?? "Search…"}
            className="w-full h-10 pl-9 pr-3 rounded-xl border border-gray-200 bg-white text-sm text-ink-900 placeholder:text-gray-400 focus:border-gray-300 focus-visible:focus-ring"
          />
        </div>
      )}

      {selects.map((s) => (
        <select
          key={s.key}
          aria-label={s.label}
          value={s.value}
          onChange={(e) => s.onChange(e.target.value)}
          className="h-10 rounded-xl border border-gray-200 bg-white px-3 pr-8 text-sm text-ink-900 focus:border-gray-300 focus-visible:focus-ring"
        >
          {s.options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      ))}

      {children && <div className="sm:ml-auto flex items-center gap-2">{children}</div>}
    </div>
  );
}
