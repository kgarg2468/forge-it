/**
 * Typed runtime configuration, read from Vite env (`import.meta.env`).
 *
 * Every value has a sensible fallback so the app still renders (in a
 * "being forged" / offline state) even before the orchestrator wires the
 * real environment variables in.
 */

/** Convert an arbitrary string to snake_case (used for table names, etc.). */
export function snake(input: string): string {
  return input
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2") // camelCase -> camel_Case
    .replace(/[\s\-./]+/g, "_") // spaces / dashes / dots / slashes -> _
    .replace(/[^a-zA-Z0-9_]/g, "") // drop anything else
    .replace(/_+/g, "_") // collapse repeats
    .replace(/^_|_$/g, "") // trim leading/trailing _
    .toLowerCase();
}

function str(value: string | undefined, fallback = ""): string {
  return (value ?? "").trim() || fallback;
}

function bool(value: string | undefined, fallback: boolean): boolean {
  const v = (value ?? "").trim().toLowerCase();
  if (v === "") return fallback;
  return v === "true" || v === "1" || v === "yes" || v === "on";
}

const env = import.meta.env;

export interface AppConfig {
  /** InsForge project base URL (no trailing slash). */
  insforgeUrl: string;
  /** InsForge project / anon key. */
  insforgeKey: string;
  /** ForgeIt backend base URL (no trailing slash). */
  forgeitApiUrl: string;
  /** ForgeIt tool id. */
  toolId: string;
  /** Tool slug, snake-cased — used as the table-name prefix. */
  toolSlug: string;
  /** Human-friendly tool name. */
  toolName: string;
  /** When true, high-risk actions are simulated. */
  demoSafe: boolean;
}

function trimTrailingSlash(u: string): string {
  return u.replace(/\/+$/, "");
}

export const config: AppConfig = {
  insforgeUrl: trimTrailingSlash(str(env.VITE_INSFORGE_URL)),
  insforgeKey: str(env.VITE_INSFORGE_KEY),
  forgeitApiUrl: trimTrailingSlash(str(env.VITE_FORGEIT_API_URL)),
  toolId: str(env.VITE_TOOL_ID),
  toolSlug: snake(str(env.VITE_TOOL_SLUG, "app")),
  toolName: str(env.VITE_TOOL_NAME, "ForgeIt Tool"),
  demoSafe: bool(env.VITE_DEMO_SAFE, true),
};

/** Convenience flag — true when high-risk actions should be simulated. */
export const isDemoSafe: boolean = config.demoSafe;

/** True when InsForge is configured enough to attempt requests. */
export const hasInsforge: boolean = Boolean(
  config.insforgeUrl && config.insforgeKey
);

/** True when the ForgeIt backend is configured. */
export const hasForgeitApi: boolean = Boolean(
  config.forgeitApiUrl && config.toolId
);
