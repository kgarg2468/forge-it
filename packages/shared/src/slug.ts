// Deterministic slug helpers. Tool slug drives both the URL and the InsForge
// table prefix (t_<slug>_<table>), so it must be stable and SQL-safe.

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_{2,}/g, "_")
    .slice(0, 40) || "tool";
}

// InsForge table name for a given tool + entity. Lowercased, prefixed, snake_case.
export function tableName(toolSlug: string, entity: string): string {
  return `t_${slugify(toolSlug)}_${slugify(entity)}`;
}
