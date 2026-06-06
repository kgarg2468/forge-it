import { execFile } from "node:child_process";
import { promisify } from "node:util";
import fs from "node:fs/promises";
import path from "node:path";
import type { RunnerConfig } from "./config.js";

const pexec = promisify(execFile);

export function sandboxDir(cfg: RunnerConfig, toolId: string): string {
  return path.join(cfg.generatedRoot, toolId);
}

export async function exists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

/**
 * Seed a fresh sandbox by copying the base template (including node_modules if
 * the template was pre-installed, for fast builds). Initializes a git repo and
 * commits the baseline so we can diff what OpenCode changes.
 */
export async function seedSandbox(cfg: RunnerConfig, toolId: string): Promise<string> {
  const dir = sandboxDir(cfg, toolId);
  if (await exists(dir)) return dir;
  await fs.mkdir(cfg.generatedRoot, { recursive: true });
  const SKIP = ["node_modules", "dist", ".git", ".env", "opencode.json"];
  await fs.cp(cfg.templateDir, dir, {
    recursive: true,
    filter: (src) => {
      const rel = path.relative(cfg.templateDir, src);
      if (!rel) return true;
      const first = rel.split(path.sep)[0];
      return !SKIP.includes(first);
    },
  });
  // git baseline (best-effort)
  try {
    await pexec("git", ["init", "-q"], { cwd: dir });
    await pexec("git", ["add", "-A"], { cwd: dir });
    await pexec(
      "git",
      ["-c", "user.email=forge@forgeit.dev", "-c", "user.name=ForgeIt", "commit", "-q", "-m", "baseline"],
      { cwd: dir },
    );
  } catch {
    // git not critical; file.status falls back to mtime scan
  }
  return dir;
}

/** Files changed since the last git commit in the sandbox. */
export async function changedFiles(dir: string): Promise<string[]> {
  try {
    const { stdout } = await pexec("git", ["status", "--porcelain"], { cwd: dir });
    return stdout
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .map((l) => l.replace(/^\S+\s+/, ""))
      .filter((f) => !f.startsWith("node_modules") && !f.startsWith("dist"));
  } catch {
    return [];
  }
}

/** Commit current state (so the next change diff is clean). Best-effort. */
export async function commitSandbox(dir: string, message: string): Promise<void> {
  try {
    await pexec("git", ["add", "-A"], { cwd: dir });
    await pexec(
      "git",
      ["-c", "user.email=forge@forgeit.dev", "-c", "user.name=ForgeIt", "commit", "-q", "-m", message],
      { cwd: dir },
    );
  } catch {
    /* ignore */
  }
}
