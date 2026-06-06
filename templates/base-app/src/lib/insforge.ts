/**
 * Minimal typed data client for InsForge's REST (PostgREST-style) API.
 *
 * The app talks DIRECTLY to InsForge from the browser, so this works from
 * anywhere the app is deployed.
 *
 * Table naming convention: every entity is stored in a table prefixed with the
 * tool slug, i.e. `t_<slug>_<entity>`. Use the exported `t(entity)` helper to
 * resolve the full table name.
 *
 * Usage:
 *   import { insforge } from "./lib/insforge";
 *   const rows = await insforge.list("refund", { status: "eq.pending", order: "created_at.desc", limit: "20" });
 *   const one  = await insforge.get("refund", "123");
 *   const made = await insforge.insert("refund", [{ amount: 10 }]);
 *   await insforge.update("refund", "123", { status: "approved" });
 *   await insforge.remove("refund", "123");
 */
import { config, hasInsforge, snake } from "./config";

/** A generic record row coming back from InsForge. */
export type Row = Record<string, unknown>;

/**
 * Resolve an entity name to its prefixed table name: `t_<slug>_<entity>`.
 * The entity is snake-cased; if it already starts with the prefix it is
 * returned unchanged so callers may pass either form.
 */
export function t(entity: string): string {
  const e = snake(entity);
  const prefix = `t_${config.toolSlug}_`;
  // Allow callers to pass either the bare entity or an already-prefixed name.
  if (e.startsWith(prefix)) return e;
  return `${prefix}${e}`;
}

export class InsforgeError extends Error {
  status: number;
  body: unknown;
  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.name = "InsforgeError";
    this.status = status;
    this.body = body;
  }
}

function headers(extra?: Record<string, string>): Record<string, string> {
  return {
    "Content-Type": "application/json",
    apikey: config.insforgeKey,
    Authorization: `Bearer ${config.insforgeKey}`,
    ...extra,
  };
}

function recordsUrl(table: string, query?: Record<string, string>): string {
  const base = `${config.insforgeUrl}/api/database/records/${table}`;
  if (!query || Object.keys(query).length === 0) return base;
  const qs = new URLSearchParams(query).toString();
  return `${base}?${qs}`;
}

async function parseError(res: Response): Promise<never> {
  let body: unknown = null;
  let detail = "";
  try {
    const text = await res.text();
    if (text) {
      try {
        body = JSON.parse(text);
        const b = body as Record<string, unknown>;
        detail =
          (typeof b.message === "string" && b.message) ||
          (typeof b.error === "string" && b.error) ||
          (typeof b.hint === "string" && b.hint) ||
          text;
      } catch {
        body = text;
        detail = text;
      }
    }
  } catch {
    /* ignore */
  }
  const message = `InsForge ${res.status} ${res.statusText}${
    detail ? `: ${detail}` : ""
  }`;
  throw new InsforgeError(message, res.status, body);
}

async function request<T>(
  url: string,
  init: RequestInit
): Promise<T> {
  if (!hasInsforge) {
    throw new InsforgeError(
      "InsForge connection requires VITE_INSFORGE_URL and VITE_INSFORGE_KEY.",
      0,
      null
    );
  }

  let res: Response;
  try {
    res = await fetch(url, init);
  } catch (err) {
    throw new InsforgeError(
      `InsForge request failed (network): ${
        err instanceof Error ? err.message : String(err)
      }`,
      0,
      null
    );
  }

  if (!res.ok) return parseError(res);

  // DELETE / no-content responses.
  if (res.status === 204) return undefined as unknown as T;
  const text = await res.text();
  if (!text) return undefined as unknown as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    return text as unknown as T;
  }
}

export interface Insforge {
  /** Resolve an entity to its full prefixed table name. */
  t(entity: string): string;
  /**
   * List rows for an entity.
   * `query` accepts PostgREST filters/options, e.g.
   *   { status: "eq.pending", order: "created_at.desc", limit: "20", select: "*" }
   * Note: values use PostgREST operator syntax (`eq.`, `gt.`, `ilike.` …).
   */
  list<T extends Row = Row>(
    entity: string,
    query?: Record<string, string>
  ): Promise<T[]>;
  /** Fetch a single row by id, or null when not found. */
  get<T extends Row = Row>(entity: string, id: string | number): Promise<T | null>;
  /** Insert one or more rows. Body is always sent as an array. Returns created rows. */
  insert<T extends Row = Row>(
    entity: string,
    rows: Row | Row[]
  ): Promise<T[]>;
  /** Patch a single row by id. Returns the updated row, or null. */
  update<T extends Row = Row>(
    entity: string,
    id: string | number,
    patch: Row
  ): Promise<T | null>;
  /** Delete a single row by id. */
  remove(entity: string, id: string | number): Promise<void>;
}

export const insforge: Insforge = {
  t,

  async list<T extends Row = Row>(
    entity: string,
    query?: Record<string, string>
  ): Promise<T[]> {
    const url = recordsUrl(t(entity), query);
    const data = await request<T[] | T>(url, {
      method: "GET",
      headers: headers(),
    });
    if (data == null) return [];
    return Array.isArray(data) ? data : [data];
  },

  async get<T extends Row = Row>(
    entity: string,
    id: string | number
  ): Promise<T | null> {
    const rows = await this.list<T>(entity, {
      id: `eq.${id}`,
      limit: "1",
    });
    return rows[0] ?? null;
  },

  async insert<T extends Row = Row>(
    entity: string,
    rows: Row | Row[]
  ): Promise<T[]> {
    const body = Array.isArray(rows) ? rows : [rows];
    const url = recordsUrl(t(entity));
    const data = await request<T[] | T>(url, {
      method: "POST",
      headers: headers({ Prefer: "return=representation" }),
      body: JSON.stringify(body),
    });
    if (data == null) return [];
    return Array.isArray(data) ? data : [data];
  },

  async update<T extends Row = Row>(
    entity: string,
    id: string | number,
    patch: Row
  ): Promise<T | null> {
    const url = recordsUrl(t(entity), { id: `eq.${id}` });
    const data = await request<T[] | T>(url, {
      method: "PATCH",
      headers: headers({ Prefer: "return=representation" }),
      body: JSON.stringify(patch),
    });
    if (data == null) return null;
    return Array.isArray(data) ? data[0] ?? null : data;
  },

  async remove(entity: string, id: string | number): Promise<void> {
    const url = recordsUrl(t(entity), { id: `eq.${id}` });
    await request<void>(url, {
      method: "DELETE",
      headers: headers(),
    });
  },
};
