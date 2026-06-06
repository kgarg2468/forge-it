import { spawn, execFile, type ChildProcess } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";
import { exists } from "./sandbox.js";
import { childEnv } from "./childenv.js";
import type { RunnerConfig } from "./config.js";

const pexec = promisify(execFile);

export interface PreviewHandle {
  toolId: string;
  port: number;
  url: string;
  proc: ChildProcess;
}

const previews = new Map<string, PreviewHandle>();

export async function ensureInstalled(
  dir: string,
  cfg: RunnerConfig,
  onLog?: (m: string) => void,
): Promise<{ ok: boolean; log: string }> {
  if (await exists(path.join(dir, "node_modules"))) return { ok: true, log: "deps present" };
  onLog?.("Installing dependencies…");
  try {
    const { stdout, stderr } = await pexec(cfg.packageManager, ["install"], {
      cwd: dir,
      env: childEnv(dir),
      maxBuffer: 20 * 1024 * 1024,
    });
    return { ok: true, log: stdout + stderr };
  } catch (err: any) {
    return { ok: false, log: String(err?.stdout ?? "") + String(err?.stderr ?? err) };
  }
}

/** Run the production build to validate generated code; returns error log on failure. */
export async function validateBuild(
  dir: string,
  cfg: RunnerConfig,
): Promise<{ ok: boolean; log: string }> {
  try {
    const { stdout, stderr } = await pexec(cfg.packageManager, ["run", "build"], {
      cwd: dir,
      env: childEnv(dir),
      maxBuffer: 20 * 1024 * 1024,
    });
    return { ok: true, log: stdout + stderr };
  } catch (err: any) {
    return { ok: false, log: String(err?.stdout ?? "") + String(err?.stderr ?? err) };
  }
}

/** Stable port per tool so restarts reuse it; spread across a small range. */
function portForTool(base: number, toolId: string): number {
  let h = 0;
  for (let i = 0; i < toolId.length; i++) h = (h * 31 + toolId.charCodeAt(i)) >>> 0;
  return base + (h % 60);
}

/** Free a TCP port by killing whatever holds it (macOS/Linux: lsof). */
async function killPort(port: number): Promise<void> {
  try {
    const { stdout } = await pexec("lsof", ["-ti", `:${port}`]);
    const pids = stdout.split("\n").map((s) => s.trim()).filter(Boolean);
    for (const pid of pids) {
      try {
        process.kill(Number(pid), "SIGKILL");
      } catch {
        /* already gone */
      }
    }
  } catch {
    /* nothing on the port */
  }
}

function waitForPort(url: string, timeoutMs = 30000): Promise<boolean> {
  const start = Date.now();
  return new Promise((resolve) => {
    const tick = async () => {
      try {
        const res = await fetch(url, { method: "GET" });
        if (res.ok || res.status < 500) return resolve(true);
      } catch {
        /* not up yet */
      }
      if (Date.now() - start > timeoutMs) return resolve(false);
      setTimeout(tick, 600);
    };
    tick();
  });
}

/** Start (or restart) a Vite dev server for the tool's sandbox; returns its URL. */
export async function startPreview(
  cfg: RunnerConfig,
  toolId: string,
  dir: string,
  _indexInWorkspace = 0,
): Promise<PreviewHandle> {
  await stopPreview(toolId);
  const port = portForTool(cfg.previewPortBase, toolId);
  // Clear any orphaned preview (e.g. left by a prior server restart) on this port.
  await killPort(port);
  const proc = spawn(cfg.packageManager, ["run", "dev", "--", "--port", String(port), "--strictPort", "--host"], {
    cwd: dir,
    env: childEnv(dir),
    detached: false,
  });
  proc.stdout?.on("data", () => {});
  proc.stderr?.on("data", () => {});
  const url = `http://localhost:${port}`;
  await waitForPort(url, 40000);
  const handle: PreviewHandle = { toolId, port, url, proc };
  previews.set(toolId, handle);
  return handle;
}

export async function stopPreview(toolId: string): Promise<void> {
  const h = previews.get(toolId);
  if (h) {
    try {
      h.proc.kill("SIGTERM");
    } catch {
      /* ignore */
    }
    previews.delete(toolId);
  }
}

export function getPreview(toolId: string): PreviewHandle | undefined {
  return previews.get(toolId);
}

export function previewCount(): number {
  return previews.size;
}
