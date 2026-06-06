import {
  slugify,
  type BuildPlan,
  type LogLevel,
  logEvent,
} from "@forgeit/shared";
import { prisma, fromJson, toJson } from "./db.js";
import { publish } from "./sse.js";
import { minimax, insforge, composio, runner, insforgeClientKey } from "./services.js";
import { env } from "./env.js";
import { summarizeChange } from "@forgeit/services";

async function logTo(jobId: string, level: LogLevel, message: string, step?: string): Promise<void> {
  await prisma.buildLog.create({ data: { jobId, level, message, step } });
  publish(jobId, logEvent(level, message, step));
}

async function setJobStatus(jobId: string, status: string, currentStep?: string): Promise<void> {
  await prisma.buildJob.update({
    where: { id: jobId },
    data: {
      status,
      currentStep,
      ...(status === "running" ? { startedAt: new Date() } : {}),
      ...(["succeeded", "failed", "cancelled"].includes(status) ? { completedAt: new Date() } : {}),
    },
  });
  publish(jobId, { kind: "status", status: status as any, currentStep, ts: Date.now() });
}

async function availableActions(
  workspaceId: string,
  providers: string[],
): Promise<Array<{ slug: string; provider: string; risk: string }>> {
  if (!composio.isConfigured || providers.length === 0) return [];
  try {
    const userId = workspaceId;
    const tools = await composio.getTools(userId, providers as any, 24);
    return tools.map((t) => ({ slug: t.slug, provider: t.provider, risk: t.risk }));
  } catch {
    return [];
  }
}

/** Run the full build for a tool's approved plan. */
export async function runBuildJob(jobId: string): Promise<void> {
  const job = await prisma.buildJob.findUnique({ where: { id: jobId }, include: { tool: true } });
  if (!job) return;
  const tool = job.tool;
  const planRow = job.planId
    ? await prisma.buildPlanRow.findUnique({ where: { id: job.planId } })
    : await prisma.buildPlanRow.findFirst({ where: { toolId: tool.id }, orderBy: { createdAt: "desc" } });
  if (!planRow) {
    await setJobStatus(jobId, "failed");
    await logTo(jobId, "error", "No build plan found");
    return;
  }
  const plan = fromJson<BuildPlan>(planRow.planJson, {} as BuildPlan);

  await setJobStatus(jobId, "running", "starting");
  await prisma.internalTool.update({ where: { id: tool.id }, data: { status: "building" } });
  await logTo(jobId, "info", `Forging "${tool.name}"`, "start");

  // 1) Provision InsForge tables.
  let tableMap: Record<string, string> = {};
  try {
    await logTo(jobId, "info", "Provisioning backend tables in InsForge…", "backend");
    const result = await insforge.provisionPlan(tool.slug, plan);
    tableMap = result.tables;
    for (const t of result.created) await logTo(jobId, "success", `Created table ${t}`, "backend");
    for (const t of result.skipped) await logTo(jobId, "info", `Table ${t} already exists`, "backend");
    await prisma.buildPlanRow.update({ where: { id: planRow.id }, data: { tableMap: toJson(tableMap) } });
  } catch (err) {
    await logTo(jobId, "error", `InsForge provisioning failed: ${String(err)}`, "backend");
  }

  // 2) Available actions (Composio) for the selected providers.
  const providers = plan.connectedApps.map((a) => a.provider);
  const actions = await availableActions(tool.workspaceId, providers);
  if (actions.length) await logTo(jobId, "info", `Found ${actions.length} connected actions`, "backend");

  // 3) Generate the app with OpenCode.
  let result;
  try {
    result = await runner.generate(
      {
        toolId: tool.id,
        toolName: tool.name,
        toolSlug: tool.slug,
        plan,
        tableMap,
        insforge: { url: env.insforge.baseUrl, key: insforgeClientKey },
        forgeitApiUrl: env.publicApiUrl,
        demoSafe: true,
        availableActions: actions,
      },
      (level, message, step) => {
        void logTo(jobId, level, message, step);
      },
    );
  } catch (err) {
    await logTo(jobId, "error", `Generation failed: ${String(err)}`);
    await setJobStatus(jobId, "failed");
    await prisma.internalTool.update({ where: { id: tool.id }, data: { status: "failed" } });
    publish(jobId, { kind: "done", ok: false, ts: Date.now() });
    return;
  }

  // 4) Persist results + a Change record + preview URL.
  if (result.previewUrl) {
    await prisma.internalTool.update({
      where: { id: tool.id },
      data: { previewUrl: result.previewUrl, status: result.ok ? "preview_ready" : "failed" },
    });
    publish(jobId, { kind: "preview_ready", url: result.previewUrl, ts: Date.now() });
  }

  try {
    const summary = await summarizeChange(minimax, {
      request: `Build ${tool.name}`,
      changedFiles: result.changedFiles,
    });
    await prisma.change.create({
      data: {
        toolId: tool.id,
        title: summary.title || `Built ${tool.name}`,
        summary: summary.summary,
        whatChanged: toJson(summary.whatChanged),
        status: "ready_for_review",
        requestedBy: "ForgeIt",
      },
    });
  } catch {
    /* change summary is best-effort */
  }

  await setJobStatus(jobId, result.ok ? "succeeded" : "failed");
  await logTo(jobId, result.ok ? "success" : "warning", result.ok ? "Preview ready" : "Completed with build issues", "done");
  publish(jobId, { kind: "done", ok: result.ok, ts: Date.now() });
}

/** Apply a follow-up edit from the builder chat. */
export async function runEditJob(jobId: string, message: string): Promise<void> {
  const job = await prisma.buildJob.findUnique({ where: { id: jobId }, include: { tool: true } });
  if (!job) return;
  const tool = job.tool;
  await setJobStatus(jobId, "running", "edit");
  await logTo(jobId, "info", `Applying: "${message}"`, "edit");

  let result;
  try {
    result = await runner.edit(tool.id, message, (level, m, step) => void logTo(jobId, level, m, step));
  } catch (err) {
    await logTo(jobId, "error", `Edit failed: ${String(err)}`);
    await setJobStatus(jobId, "failed");
    publish(jobId, { kind: "done", ok: false, ts: Date.now() });
    return;
  }

  try {
    const summary = await summarizeChange(minimax, { request: message, changedFiles: result.changedFiles });
    await prisma.change.create({
      data: {
        toolId: tool.id,
        title: summary.title || message.slice(0, 80),
        summary: summary.summary,
        whatChanged: toJson(summary.whatChanged),
        status: "ready_for_review",
        requestedBy: "You",
      },
    });
  } catch {
    /* ignore */
  }

  if (result.previewUrl) publish(jobId, { kind: "preview_ready", url: result.previewUrl, ts: Date.now() });
  await setJobStatus(jobId, result.ok ? "succeeded" : "failed");
  publish(jobId, { kind: "done", ok: result.ok, ts: Date.now() });
}

/** Generate (or regenerate) a build plan for a tool from its latest prompt. */
export async function generatePlanForTool(toolId: string): Promise<{ plan: BuildPlan; planId: string }> {
  const tool = await prisma.internalTool.findUniqueOrThrow({ where: { id: toolId } });
  const prompt = await prisma.buildPrompt.findFirst({ where: { toolId }, orderBy: { createdAt: "desc" } });
  if (!prompt) throw new Error("No prompt for tool");
  const providers = fromJson<string[]>(prompt.selectedApps, []);
  const actions = await availableActions(tool.workspaceId, providers);

  const { generateBuildPlan } = await import("@forgeit/services");
  const plan = await generateBuildPlan(minimax, {
    prompt: prompt.rawPrompt,
    selectedProviders: providers,
    department: prompt.department ?? tool.department ?? undefined,
    appType: prompt.appType ?? undefined,
    availableTools: actions.map((a) => ({ slug: a.slug, provider: a.provider })),
  });

  // Mark older plans superseded; store the new one.
  await prisma.buildPlanRow.updateMany({ where: { toolId, status: "draft" }, data: { status: "superseded" } });
  const row = await prisma.buildPlanRow.create({
    data: { toolId, promptId: prompt.id, planJson: toJson(plan), status: "draft" },
  });
  // Keep tool name/description in sync with the plan.
  await prisma.internalTool.update({
    where: { id: toolId },
    data: {
      name: plan.appName || tool.name,
      slug: tool.slug || slugify(plan.appName),
      description: plan.description,
      department: plan.department || tool.department,
      status: "planning",
    },
  });
  return { plan, planId: row.id };
}
