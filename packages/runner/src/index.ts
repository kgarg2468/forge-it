import fs from "node:fs/promises";
import path from "node:path";
import type { BuildPlan, LogLevel } from "@forgeit/shared";
import type { RunnerConfig } from "./config.js";
import { seedSandbox, sandboxDir, changedFiles, commitSandbox } from "./sandbox.js";
import { writeOpencodeConfig, runOpencodeTask } from "./opencode.js";
import { ensureInstalled, validateBuild, startPreview, stopPreview, getPreview, previewCount } from "./preview.js";
import { buildGenPrompt, buildEditPrompt, buildRepairPrompt, type GenContext } from "./prompt.js";

export * from "./config.js";
export { sandboxDir } from "./sandbox.js";
export { stopPreview, getPreview } from "./preview.js";

export type RunnerLog = (level: LogLevel, message: string, step?: string) => void;

export interface GenerateArgs {
  toolId: string;
  toolName: string;
  toolSlug: string;
  plan: BuildPlan;
  tableMap: Record<string, string>;
  insforge: { url: string; key: string };
  forgeitApiUrl: string;
  reviewMode: boolean;
  availableActions: Array<{ slug: string; provider: string; risk: string }>;
}

export interface GenerateResult {
  ok: boolean;
  previewUrl?: string;
  changedFiles: string[];
  error?: string;
}

export class Runner {
  constructor(private cfg: RunnerConfig) {}

  private async writeEnv(dir: string, args: GenerateArgs): Promise<void> {
    const env = [
      `VITE_INSFORGE_URL=${args.insforge.url}`,
      `VITE_INSFORGE_KEY=${args.insforge.key}`,
      `VITE_FORGEIT_API_URL=${args.forgeitApiUrl}`,
      `VITE_TOOL_ID=${args.toolId}`,
      `VITE_TOOL_SLUG=${args.toolSlug}`,
      `VITE_TOOL_NAME=${args.toolName}`,
      `VITE_REVIEW_MODE=${args.reviewMode ? "true" : "false"}`,
      "",
    ].join("\n");
    await fs.writeFile(path.join(dir, ".env"), env, "utf8");
  }

  /** Full first-time generation: seed → config → opencode → validate(+repair) → preview. */
  async generate(args: GenerateArgs, onLog: RunnerLog): Promise<GenerateResult> {
    const dir = await seedSandbox(this.cfg, args.toolId);
    onLog("success", "Created app shell from base template", "scaffold");
    await writeOpencodeConfig(dir, this.cfg);
    await this.writeEnv(dir, args);

    const install = await ensureInstalled(dir, this.cfg, (m) => onLog("info", m, "install"));
    if (!install.ok) onLog("warning", "Dependency install had issues; continuing", "install");

    const ctx: GenContext = {
      toolName: args.toolName,
      toolSlug: args.toolSlug,
      plan: args.plan,
      tableMap: args.tableMap,
      availableActions: args.availableActions,
    };
    onLog("info", "Generating app with the coding agent…", "generate");
    const run = await runOpencodeTask(dir, buildGenPrompt(ctx), this.cfg, (lvl, msg) => onLog(lvl, msg, "generate"));

    const changed = await changedFiles(dir);
    for (const f of changed.slice(0, 25)) onLog("info", `Edited ${f}`, "files");

    // Validate build, repair once on failure.
    let build = await validateBuild(dir, this.cfg);
    if (!build.ok) {
      onLog("warning", "Build failed — asking the agent to repair…", "repair");
      await runOpencodeTask(dir, buildRepairPrompt(build.log), this.cfg, (lvl, msg) => onLog(lvl, msg, "repair"));
      build = await validateBuild(dir, this.cfg);
    }
    if (build.ok) onLog("success", "Build succeeded", "build");
    else onLog("error", "Build still failing after repair", "build");

    await commitSandbox(dir, "forgeit: generate");

    onLog("info", "Starting live preview…", "preview");
    const preview = await startPreview(this.cfg, args.toolId, dir, previewCount());
    onLog("success", `Preview ready at ${preview.url}`, "preview");

    return {
      ok: build.ok && run.ok,
      previewUrl: preview.url,
      changedFiles: changed,
    };
  }

  /** Apply a follow-up edit from the builder chat. */
  async edit(toolId: string, message: string, onLog: RunnerLog): Promise<GenerateResult> {
    const dir = sandboxDir(this.cfg, toolId);
    onLog("info", "Applying your change…", "edit");
    const run = await runOpencodeTask(dir, buildEditPrompt(message), this.cfg, (lvl, msg) => onLog(lvl, msg, "edit"));
    const changed = await changedFiles(dir);
    let build = await validateBuild(dir, this.cfg);
    if (!build.ok) {
      onLog("warning", "Build failed — repairing…", "repair");
      await runOpencodeTask(dir, buildRepairPrompt(build.log), this.cfg, (lvl, msg) => onLog(lvl, msg, "repair"));
      build = await validateBuild(dir, this.cfg);
    }
    await commitSandbox(dir, `forgeit: edit — ${message.slice(0, 50)}`);
    // Vite dev server hot-reloads; ensure it's running.
    let preview = getPreview(toolId);
    if (!preview) preview = await startPreview(this.cfg, toolId, dir, previewCount());
    onLog("success", "Change applied", "edit");
    return { ok: build.ok && run.ok, previewUrl: preview?.url, changedFiles: changed };
  }
}
