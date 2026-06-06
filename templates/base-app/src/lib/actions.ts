/**
 * Runs Composio actions through the ForgeIt backend.
 *
 * The browser NEVER holds the Composio key — it only calls the ForgeIt backend,
 * which proxies to Composio. High-risk actions are gated by the demo-safe flag:
 * when `isDemoSafe` is true we never request a live execution.
 *
 * Usage:
 *   import { runAction } from "./lib/actions";
 *   const res = await runAction("GMAIL_SEND_EMAIL", { to: "a@b.com", subject: "Hi" });
 *   if (res.ok) { ... }  // res.simulated tells you if it was a dry run
 */
import { config, hasForgeitApi, isDemoSafe } from "./config";

export interface ActionResult<T = unknown> {
  /** Whether the call (or simulation) succeeded. */
  ok: boolean;
  /** True when the result is a simulation / dry-run rather than a live execution. */
  simulated: boolean;
  /** The data returned by the action (when ok). */
  data?: T;
  /** A human-readable error message (when not ok). */
  error?: string;
}

export interface RunActionOptions {
  /**
   * Request a live (real) execution. Ignored — forced to false — when the app
   * is in demo-safe mode. Defaults to false.
   */
  live?: boolean;
}

/** Build the simulated success object used as a graceful fallback. */
function simulatedSuccess<T = unknown>(
  slug: string,
  args: Record<string, unknown>,
  note: string
): ActionResult<T> {
  return {
    ok: true,
    simulated: true,
    data: {
      simulated: true,
      slug,
      args,
      note,
      at: new Date().toISOString(),
    } as unknown as T,
  };
}

/**
 * Execute a Composio action by slug via the ForgeIt backend.
 *
 * Behavior:
 *  - In demo-safe mode, `live` is forced to false (high-risk actions simulated).
 *  - If the backend is not configured or is unreachable, returns a simulated
 *    success object so the UI keeps working in deployed/offline contexts.
 */
export async function runAction<T = unknown>(
  slug: string,
  args: Record<string, unknown>,
  opts?: RunActionOptions
): Promise<ActionResult<T>> {
  const live = isDemoSafe ? false : Boolean(opts?.live);

  if (!hasForgeitApi) {
    return simulatedSuccess<T>(
      slug,
      args,
      "ForgeIt backend not configured — returning a simulated result."
    );
  }

  const url = `${config.forgeitApiUrl}/api/tools/${config.toolId}/actions/execute`;

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, args, live }),
    });
  } catch {
    // Backend unreachable — degrade gracefully so the UI still demonstrates the flow.
    return simulatedSuccess<T>(
      slug,
      args,
      "ForgeIt backend unreachable — returning a simulated result."
    );
  }

  let payload: unknown = null;
  try {
    const text = await res.text();
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = null;
  }

  if (!res.ok) {
    const err =
      (payload as Record<string, unknown> | null)?.error ??
      `Action failed (${res.status} ${res.statusText})`;
    return {
      ok: false,
      simulated: !live,
      error: typeof err === "string" ? err : JSON.stringify(err),
    };
  }

  // Honor a structured response from the backend when present, else wrap raw data.
  const body = (payload ?? {}) as Record<string, unknown>;
  const ok = typeof body.ok === "boolean" ? (body.ok as boolean) : true;
  const simulated =
    typeof body.simulated === "boolean" ? (body.simulated as boolean) : !live;

  return {
    ok,
    simulated,
    data: (body.data ?? payload) as T,
    error: typeof body.error === "string" ? body.error : undefined,
  };
}
