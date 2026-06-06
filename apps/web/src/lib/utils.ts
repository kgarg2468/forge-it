export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

export function relativeTime(input: string | null | undefined): string {
  if (!input) return "—";
  const date = new Date(input);
  const diff = date.getTime() - Date.now();
  const abs = Math.abs(diff);
  const min = 60_000;
  const hour = 60 * min;
  const day = 24 * hour;
  const week = 7 * day;

  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  if (abs < hour) return rtf.format(Math.round(diff / min), "minute");
  if (abs < day) return rtf.format(Math.round(diff / hour), "hour");
  if (abs < week) return rtf.format(Math.round(diff / day), "day");
  return date.toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" });
}

export function formatDate(input: string | null | undefined): string {
  if (!input) return "—";
  return new Date(input).toLocaleDateString("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function titleCase(value: string): string {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function humanizeStatus(status: string): string {
  return titleCase(status);
}

export function initials(name: string | null | undefined): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}
