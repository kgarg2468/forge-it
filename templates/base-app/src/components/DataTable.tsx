import type { ReactNode } from "react";
import { cn } from "../lib/cn";
import { EmptyState } from "./EmptyState";
import { LoadingBlock } from "./Spinner";

export interface Column<T> {
  /** Unique key for the column. */
  key: string;
  /** Header label. */
  header: ReactNode;
  /**
   * Cell renderer. Receives the whole row. If omitted, the value at
   * `row[key]` is rendered as text.
   */
  render?: (row: T, rowIndex: number) => ReactNode;
  /** Optional Tailwind classes applied to the cell + header (e.g. "text-right w-32"). */
  className?: string;
  /** Align cell content. Defaults to "left". */
  align?: "left" | "center" | "right";
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  /** Stable key for each row. Defaults to the row index. */
  rowKey?: (row: T, index: number) => string | number;
  /** Render trailing per-row actions in a final column. */
  rowActions?: (row: T, index: number) => ReactNode;
  /** Called when a row is clicked (makes rows interactive). */
  onRowClick?: (row: T, index: number) => void;
  loading?: boolean;
  /** Shown when there are no rows (and not loading). */
  empty?: ReactNode;
  className?: string;
}

const alignClass = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
} as const;

export function DataTable<T extends Record<string, unknown>>({
  columns,
  rows,
  rowKey,
  rowActions,
  onRowClick,
  loading = false,
  empty,
  className,
}: DataTableProps<T>) {
  if (loading) return <LoadingBlock />;

  if (!rows.length) {
    return (
      <>
        {empty ?? (
          <EmptyState
            title="No data yet"
            description="Records will appear here once they exist."
          />
        )}
      </>
    );
  }

  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100">
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  "px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500",
                  alignClass[col.align ?? "left"],
                  col.className
                )}
              >
                {col.header}
              </th>
            ))}
            {rowActions && (
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                <span className="sr-only">Actions</span>
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const key = rowKey ? rowKey(row, i) : i;
            return (
              <tr
                key={key}
                onClick={onRowClick ? () => onRowClick(row, i) : undefined}
                className={cn(
                  "border-b border-gray-50 last:border-0 transition-colors",
                  onRowClick && "cursor-pointer hover:bg-gray-50"
                )}
              >
                {columns.map((col) => {
                  const content = col.render
                    ? col.render(row, i)
                    : formatCell(row[col.key]);
                  return (
                    <td
                      key={col.key}
                      className={cn(
                        "px-4 py-3 text-ink-800 align-middle",
                        alignClass[col.align ?? "left"],
                        col.className
                      )}
                    >
                      {content}
                    </td>
                  );
                })}
                {rowActions && (
                  <td
                    className="px-4 py-3 text-right align-middle"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="inline-flex items-center justify-end gap-2">
                      {rowActions(row, i)}
                    </div>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function formatCell(value: unknown): ReactNode {
  if (value == null) return <span className="text-gray-300">—</span>;
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}
