import { Fragment } from "react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";

export interface Crumb {
  label: string;
  to?: string;
}

export function Breadcrumb({ items }: { items: Crumb[] }) {
  return (
    <nav className="flex items-center gap-1.5 text-[13px] text-ink-muted" aria-label="Breadcrumb">
      {items.map((item, i) => {
        const last = i === items.length - 1;
        return (
          <Fragment key={`${item.label}-${i}`}>
            {item.to && !last ? (
              <Link to={item.to} className="transition hover:text-ink">
                {item.label}
              </Link>
            ) : (
              <span className={last ? "font-medium text-ink" : ""}>{item.label}</span>
            )}
            {!last && <ChevronRight size={14} className="text-ink-faint" />}
          </Fragment>
        );
      })}
    </nav>
  );
}
