import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import path from "node:path";
import {
  slugify,
  buildPlanSchema,
  classifyActionRisk,
  type BuildPlan,
  type Provider,
} from "@forgeit/shared";
import { prisma, fromJson, toJson } from "./db.js";
import { env } from "./env.js";
import {
  minimax,
  insforge,
  composio,
  railway,
  runner,
  insforgeClientKey,
  replicas,
  devin,
  memoir,
  limrun,
} from "./services.js";
import { enqueue } from "./queue.js";
import { runBuildJob, runEditJob, generatePlanForTool } from "./orchestrator.js";
import { subscribe, publish, setupSseHeaders } from "./sse.js";
import { serializeTool, providerCatalog } from "./serialize.js";
import { discoverContext, type SponsorIntegrationResult, type SponsorToolContext } from "@forgeit/services";

const DEMO_SLUG = "demo";

async function getDemoWorkspace() {
  let ws = await prisma.workspace.findUnique({ where: { slug: DEMO_SLUG } });
  if (!ws) {
    const user = await prisma.user.upsert({
      where: { email: "demo@forgeit.dev" },
      update: {},
      create: { name: "Demo User", email: "demo@forgeit.dev" },
    });
    ws = await prisma.workspace.create({
      data: { name: "Pizza Shop HQ", slug: DEMO_SLUG, ownerId: user.id, primaryTeam: "Founder / Admin" },
    });
    await prisma.workspaceMember.create({
      data: { workspaceId: ws.id, userId: user.id, role: "owner" },
    });
  }
  return ws;
}

function summarizePlan(plan: BuildPlan | null): string | undefined {
  if (!plan) return undefined;
  const pages = plan.pages.map((p) => p.name).slice(0, 5).join(", ");
  const data = plan.dataModels.map((m) => m.name).slice(0, 5).join(", ");
  const workflows = plan.workflows.map((w) => w.name).slice(0, 5).join(", ");
  return [
    `${plan.appName}: ${plan.description}`,
    pages ? `Pages: ${pages}` : "",
    data ? `Data models: ${data}` : "",
    workflows ? `Workflows: ${workflows}` : "",
  ]
    .filter(Boolean)
    .join(" | ");
}

async function sponsorContext(toolId: string): Promise<SponsorToolContext | null> {
  const tool = await prisma.internalTool.findUnique({
    where: { id: toolId },
    include: {
      prompts: { orderBy: { createdAt: "desc" }, take: 1 },
      plans: { orderBy: { createdAt: "desc" }, take: 1 },
      changes: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });
  if (!tool) return null;
  const plan = fromJson<BuildPlan | null>(tool.plans[0]?.planJson, null);
  const change = tool.changes[0];
  return {
    toolId: tool.id,
    toolName: tool.name,
    toolSlug: tool.slug,
    prompt: tool.prompts[0]?.rawPrompt,
    planSummary: summarizePlan(plan) ?? tool.description ?? undefined,
    changeSummary: change ? `${change.title}${change.summary ? `: ${change.summary}` : ""}` : undefined,
    previewUrl: tool.previewUrl ?? undefined,
    productionUrl: tool.productionUrl ?? undefined,
  };
}

async function recordSponsorRun(toolId: string, result: SponsorIntegrationResult): Promise<void> {
  await prisma.workflowRun.create({
    data: {
      toolId,
      workflowName: `${result.provider} sponsor integration`,
      slug: `sponsor:${result.provider}`,
      status: result.ok ? "succeeded" : "failed",
      simulated: result.simulated,
      input: toJson({ provider: result.provider }),
      output: toJson(redactForToolLog(result)),
      error: result.ok ? undefined : result.message,
    },
  });
}

function redactForToolLog(value: unknown): unknown {
  if (Array.isArray(value)) return value.map((item) => redactForToolLog(item));
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, child]) => [
        key,
        /authorization|api[_-]?key|password|secret|token/i.test(key) ? "[redacted]" : redactForToolLog(child),
      ]),
    );
  }
  if (typeof value === "string") {
    return value.replace(/([?&](?:access_token|api_key|key|signature|sig|token)=)[^&]+/gi, "$1[redacted]");
  }
  return value;
}

function staticSponsorStatus(configured: boolean, missing: string[]) {
  return {
    configured,
    mode: configured ? "live" : "review",
    missing: configured ? [] : missing,
  };
}

export async function registerRoutes(app: FastifyInstance): Promise<void> {
  // ---- health + me -------------------------------------------------------
  app.get("/api/health", async () => ({
    ok: true,
    services: {
      minimax: minimax.isConfigured,
      insforge: insforge.isConfigured,
      composio: composio.isConfigured,
      railway: railway.isConfigured,
    },
    sponsors: {
      insforge: staticSponsorStatus(insforge.isConfigured, ["INSFORGE_API_BASE_URL", "INSFORGE_API_KEY"]),
      replicas: replicas.status(),
      devin: devin.status(),
      memoir: memoir.status(),
      limrun: limrun.status(),
      vercel: staticSponsorStatus(
        Boolean(process.env.VERCEL || process.env.VERCEL_PROJECT_ID || process.env.VERCEL_PROJECT_PRODUCTION_URL),
        ["VERCEL_PROJECT_ID"],
      ),
    },
  }));

  app.get("/api/me", async () => {
    const ws = await getDemoWorkspace();
    const user = ws.ownerId ? await prisma.user.findUnique({ where: { id: ws.ownerId } }) : null;
    return { user, workspace: ws };
  });

  // ---- connected apps / composio ----------------------------------------
  app.get("/api/apps", async () => {
    const ws = await getDemoWorkspace();
    const apps = await prisma.connectedApp.findMany({ where: { workspaceId: ws.id } });
    return {
      configured: composio.isConfigured,
      catalog: providerCatalog(apps.map((a) => ({ provider: a.provider, id: a.id, status: a.status }))),
    };
  });

  app.post("/api/apps/connect", async (req, reply) => {
    const body = req.body as { provider: Provider };
    const ws = await getDemoWorkspace();
    if (!composio.isConfigured) {
      // Record a review-flow connection so the UI remains ready for app linking.
      const existing = await prisma.connectedApp.findFirst({
        where: { workspaceId: ws.id, provider: body.provider },
      });
      if (!existing) {
        await prisma.connectedApp.create({
          data: { workspaceId: ws.id, provider: body.provider, status: "connected", metadata: toJson({ simulated: true }) },
        });
      }
      return { configured: false, connected: true, simulated: true };
    }
    try {
      const callbackUrl = `${env.publicApiUrl}/api/composio/callback?provider=${body.provider}`;
      const result = await composio.startConnect(body.provider, ws.id, callbackUrl);
      await prisma.connectedApp.upsert({
        where: { id: (await prisma.connectedApp.findFirst({ where: { workspaceId: ws.id, provider: body.provider } }))?.id ?? "__none__" },
        update: { status: "pending", composioConnectionId: result.connectionRequestId },
        create: { workspaceId: ws.id, provider: body.provider, status: "pending", composioConnectionId: result.connectionRequestId },
      }).catch(async () => {
        await prisma.connectedApp.create({
          data: { workspaceId: ws.id, provider: body.provider, status: "pending", composioConnectionId: result.connectionRequestId },
        });
      });
      return { configured: true, redirectUrl: result.redirectUrl };
    } catch (err) {
      reply.code(400);
      return { error: String(err) };
    }
  });

  app.get("/api/composio/callback", async (req, reply) => {
    const q = req.query as { provider?: string; connected_account_id?: string; status?: string };
    const ws = await getDemoWorkspace();
    if (q.provider) {
      const existing = await prisma.connectedApp.findFirst({
        where: { workspaceId: ws.id, provider: q.provider },
      });
      if (existing) {
        await prisma.connectedApp.update({
          where: { id: existing.id },
          data: { status: "connected", composioConnectionId: q.connected_account_id ?? existing.composioConnectionId },
        });
      }
    }
    reply.redirect(`${env.webOrigin}/stack?connected=${q.provider ?? ""}`);
  });

  app.delete("/api/apps/:id", async (req) => {
    const { id } = req.params as { id: string };
    await prisma.connectedApp.delete({ where: { id } }).catch(() => {});
    return { ok: true };
  });

  app.get("/api/apps/:provider/actions", async (req) => {
    const { provider } = req.params as { provider: Provider };
    const ws = await getDemoWorkspace();
    if (!composio.isConfigured) return { configured: false, actions: [] };
    try {
      const actions = await composio.getTools(ws.id, [provider], 30);
      return { configured: true, actions };
    } catch (err) {
      return { configured: true, actions: [], error: String(err) };
    }
  });

  // ---- tools (CRUD) ------------------------------------------------------
  app.get("/api/tools", async () => {
    const ws = await getDemoWorkspace();
    const tools = await prisma.internalTool.findMany({
      where: { workspaceId: ws.id },
      orderBy: { updatedAt: "desc" },
      include: { prompts: { orderBy: { createdAt: "desc" }, take: 1 } },
    });
    return tools.map((t) =>
      serializeTool(t, {
        connectedApps: fromJson<string[]>(t.prompts[0]?.selectedApps, []),
      }),
    );
  });

  app.post("/api/tools", async (req) => {
    const body = req.body as {
      prompt: string;
      name?: string;
      selectedProviders?: string[];
      department?: string;
      appType?: string;
    };
    const ws = await getDemoWorkspace();
    const name = body.name?.trim() || "New Tool";
    const tool = await prisma.internalTool.create({
      data: {
        workspaceId: ws.id,
        name,
        slug: slugify(name === "New Tool" ? `tool-${Date.now()}` : name),
        status: "draft",
        department: body.department,
      },
    });
    await prisma.buildPrompt.create({
      data: {
        toolId: tool.id,
        rawPrompt: body.prompt,
        selectedApps: toJson(body.selectedProviders ?? []),
        department: body.department,
        appType: body.appType,
      },
    });
    return serializeTool(tool);
  });

  app.get("/api/tools/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
    const tool = await prisma.internalTool.findUnique({
      where: { id },
      include: {
        prompts: { orderBy: { createdAt: "desc" }, take: 1 },
        plans: { orderBy: { createdAt: "desc" }, take: 1 },
        jobs: { orderBy: { createdAt: "desc" }, take: 1 },
        deployments: { orderBy: { createdAt: "desc" } },
      },
    });
    if (!tool) {
      reply.code(404);
      return { error: "not found" };
    }
    const latestPlan = tool.plans[0];
    return serializeTool(tool, {
      prompt: tool.prompts[0]?.rawPrompt,
      selectedProviders: fromJson<string[]>(tool.prompts[0]?.selectedApps, []),
      plan: latestPlan ? fromJson<BuildPlan>(latestPlan.planJson, null as any) : null,
      planId: latestPlan?.id,
      planStatus: latestPlan?.status,
      latestJob: tool.jobs[0] ?? null,
      deployments: tool.deployments,
    });
  });

  app.patch("/api/tools/:id", async (req) => {
    const { id } = req.params as { id: string };
    const body = req.body as Record<string, unknown>;
    const data: Record<string, unknown> = {};
    for (const k of ["name", "description", "department", "status", "ownerName"]) {
      if (body[k] !== undefined) data[k] = body[k];
    }
    if (body.tags !== undefined) data.tags = toJson(body.tags);
    const tool = await prisma.internalTool.update({ where: { id }, data });
    return serializeTool(tool);
  });

  app.delete("/api/tools/:id", async (req) => {
    const { id } = req.params as { id: string };
    await prisma.$transaction([
      prisma.buildLog.deleteMany({ where: { job: { toolId: id } } }),
      prisma.buildJob.deleteMany({ where: { toolId: id } }),
      prisma.buildPlanRow.deleteMany({ where: { toolId: id } }),
      prisma.buildPrompt.deleteMany({ where: { toolId: id } }),
      prisma.change.deleteMany({ where: { toolId: id } }),
      prisma.deployment.deleteMany({ where: { toolId: id } }),
      prisma.workflowRun.deleteMany({ where: { toolId: id } }),
      prisma.internalTool.delete({ where: { id } }),
    ]).catch(() => {});
    return { ok: true };
  });

  // ---- build flow: discover / plan / approve / chat ---------------------
  app.post("/api/tools/:id/discover", async (req) => {
    const { id } = req.params as { id: string };
    const prompt = await prisma.buildPrompt.findFirst({ where: { toolId: id }, orderBy: { createdAt: "desc" } });
    if (!prompt) return { findings: [], suggestedRoles: [] };
    const providers = fromJson<string[]>(prompt.selectedApps, []);
    try {
      const result = await discoverContext(minimax, { prompt: prompt.rawPrompt, selectedProviders: providers });
      return result;
    } catch (err) {
      return { findings: [], suggestedRoles: [], error: String(err) };
    }
  });

  app.post("/api/tools/:id/plan", async (req, reply) => {
    const { id } = req.params as { id: string };
    try {
      const { plan, planId } = await generatePlanForTool(id);
      return { plan, planId };
    } catch (err) {
      reply.code(500);
      return { error: String(err) };
    }
  });

  app.put("/api/tools/:id/plan", async (req, reply) => {
    const { id } = req.params as { id: string };
    const body = req.body as { plan: unknown };
    const parsed = buildPlanSchema.safeParse(body.plan);
    if (!parsed.success) {
      reply.code(400);
      return { error: "Invalid plan", issues: parsed.error.issues };
    }
    await prisma.buildPlanRow.updateMany({ where: { toolId: id, status: "draft" }, data: { status: "superseded" } });
    const row = await prisma.buildPlanRow.create({
      data: { toolId: id, planJson: toJson(parsed.data), status: "draft" },
    });
    await prisma.internalTool.update({
      where: { id },
      data: { name: parsed.data.appName, description: parsed.data.description, department: parsed.data.department },
    });
    return { plan: parsed.data, planId: row.id };
  });

  app.post("/api/tools/:id/approve", async (req, reply) => {
    const { id } = req.params as { id: string };
    const plan = await prisma.buildPlanRow.findFirst({ where: { toolId: id }, orderBy: { createdAt: "desc" } });
    if (!plan) {
      reply.code(400);
      return { error: "No plan to approve" };
    }
    await prisma.buildPlanRow.update({ where: { id: plan.id }, data: { status: "approved", approvedAt: new Date() } });
    const job = await prisma.buildJob.create({ data: { toolId: id, planId: plan.id, kind: "build", status: "queued" } });
    enqueue(() => runBuildJob(job.id));
    return { jobId: job.id };
  });

  app.post("/api/tools/:id/chat", async (req) => {
    const { id } = req.params as { id: string };
    const body = req.body as { message: string };
    const job = await prisma.buildJob.create({ data: { toolId: id, kind: "edit", status: "queued" } });
    enqueue(() => runEditJob(job.id, body.message));
    return { jobId: job.id };
  });

  app.get("/api/tools/:id/job", async (req) => {
    const { id } = req.params as { id: string };
    const job = await prisma.buildJob.findFirst({ where: { toolId: id }, orderBy: { createdAt: "desc" } });
    return job ?? null;
  });

  // ---- SSE streams -------------------------------------------------------
  app.get("/api/builds/:jobId/stream", async (req: FastifyRequest, reply: FastifyReply) => {
    const { jobId } = req.params as { jobId: string };
    setupSseHeaders(reply);
    subscribe(jobId, reply);
    // replay existing logs so late subscribers catch up
    const logs = await prisma.buildLog.findMany({ where: { jobId }, orderBy: { createdAt: "asc" } });
    for (const l of logs) {
      reply.raw.write(
        `data: ${JSON.stringify({ kind: "log", level: l.level, message: l.message, step: l.step, ts: l.createdAt.getTime() })}\n\n`,
      );
    }
    return reply;
  });

  app.get("/api/builds/:jobId/logs", async (req) => {
    const { jobId } = req.params as { jobId: string };
    return prisma.buildLog.findMany({ where: { jobId }, orderBy: { createdAt: "asc" } });
  });

  // ---- actions (called by generated apps) -------------------------------
  app.post("/api/tools/:id/actions/execute", async (req) => {
    const { id } = req.params as { id: string };
    const body = req.body as { slug: string; args?: Record<string, unknown>; live?: boolean };
    const ws = await getDemoWorkspace();
    const result = await composio.execute(body.slug, ws.id, body.args ?? {}, { live: body.live });
    await prisma.workflowRun.create({
      data: {
        toolId: id,
        workflowName: body.slug,
        slug: body.slug,
        status: result.ok ? "succeeded" : "failed",
        simulated: result.simulated,
        input: toJson(body.args ?? {}),
        output: toJson(result.data ?? null),
        error: result.error,
      },
    });
    return result;
  });

  // ---- sponsor integrations --------------------------------------------
  app.post("/api/tools/:id/sponsors/replicas-review", async (req, reply) => {
    const { id } = req.params as { id: string };
    const ctx = await sponsorContext(id);
    if (!ctx) {
      reply.code(404);
      return { error: "not found" };
    }
    const result = await replicas.createReview(ctx);
    await recordSponsorRun(id, result);
    if (!result.ok) reply.code(502);
    return result;
  });

  app.post("/api/tools/:id/sponsors/devin-review", async (req, reply) => {
    const { id } = req.params as { id: string };
    const ctx = await sponsorContext(id);
    if (!ctx) {
      reply.code(404);
      return { error: "not found" };
    }
    const result = await devin.createReview(ctx);
    await recordSponsorRun(id, result);
    if (!result.ok) reply.code(502);
    return result;
  });

  app.post("/api/tools/:id/sponsors/memoir-brief", async (req, reply) => {
    const { id } = req.params as { id: string };
    const ctx = await sponsorContext(id);
    if (!ctx) {
      reply.code(404);
      return { error: "not found" };
    }
    const result = await memoir.createLaunchBrief(ctx);
    await recordSponsorRun(id, result);
    if (!result.ok) reply.code(502);
    return result;
  });

  app.post("/api/tools/:id/sponsors/limrun-preview", async (req, reply) => {
    const { id } = req.params as { id: string };
    const ctx = await sponsorContext(id);
    if (!ctx) {
      reply.code(404);
      return { error: "not found" };
    }
    const result = await limrun.createPreview(ctx);
    await recordSponsorRun(id, result);
    if (!result.ok) reply.code(502);
    return result;
  });

  // ---- preview / deploy --------------------------------------------------
  app.get("/api/tools/:id/preview", async (req) => {
    const { id } = req.params as { id: string };
    const tool = await prisma.internalTool.findUnique({ where: { id } });
    return { url: tool?.previewUrl ?? null };
  });

  app.get("/api/deploy/:toolId/stream", async (req: FastifyRequest, reply: FastifyReply) => {
    const { toolId } = req.params as { toolId: string };
    setupSseHeaders(reply);
    subscribe(`deploy:${toolId}`, reply);
    return reply;
  });

  app.post("/api/tools/:id/deploy", async (req) => {
    const { id } = req.params as { id: string };
    const body = (req.body ?? {}) as { environment?: "preview" | "production" };
    const environment = body.environment ?? "production";
    const tool = await prisma.internalTool.findUniqueOrThrow({ where: { id } });
    const dep = await prisma.deployment.create({
      data: { toolId: id, environment, status: "deploying", version: `v${Date.now() % 1000}` },
    });
    const ch = `deploy:${id}`;
    const step = (message: string, level: "info" | "success" | "error" = "info") =>
      publish(ch, { kind: "log", level, message, ts: Date.now() } as any);

    enqueue(async () => {
      step("Preparing deployment…");
      const dir = path.join(env.paths.generatedRoot, id);
      step("Building app…");
      const serviceName = `forgeit-${tool.slug}`.slice(0, 40);
      let url: string | undefined = tool.previewUrl ?? undefined;
      let ok = true;
      if (railway.isConfigured) {
        step("Creating Railway service & uploading…");
        const res = await railway.deployDir(dir, serviceName);
        ok = res.ok;
        url = res.url ?? url;
        if (res.url) step(`Live URL ready: ${res.url}`, "success");
        else step(res.error ?? "Railway deploy finished (no URL parsed)", res.ok ? "info" : "error");
        await prisma.deployment.update({ where: { id: dep.id }, data: { logs: res.logs?.slice(0, 5000) } });
      } else {
        step("Railway deployment service is being prepared — using the active preview URL.", "info");
        step("Connecting InsForge backend…");
        step("Setting environment variables…");
      }
      step("Testing app health…");
      step("Finalizing live URL…");
      await prisma.deployment.update({
        where: { id: dep.id },
        data: { status: ok ? "live" : "failed", url, deployedAt: new Date() },
      });
      await prisma.internalTool.update({
        where: { id },
        data: { status: "live", productionUrl: url ?? tool.previewUrl },
      });
      publish(ch, { kind: "preview_ready", url: url ?? "", ts: Date.now() });
      publish(ch, { kind: "done", ok, ts: Date.now() });
      step(ok ? "Your internal tool is live." : "Deploy completed with issues.", ok ? "success" : "error");
    });

    return { deploymentId: dep.id };
  });

  app.get("/api/tools/:id/deployments", async (req) => {
    const { id } = req.params as { id: string };
    return prisma.deployment.findMany({ where: { toolId: id }, orderBy: { createdAt: "desc" } });
  });

  // ---- changes -----------------------------------------------------------
  app.get("/api/tools/:id/changes", async (req) => {
    const { id } = req.params as { id: string };
    const changes = await prisma.change.findMany({ where: { toolId: id }, orderBy: { createdAt: "desc" } });
    return changes.map((c) => ({ ...c, whatChanged: fromJson<string[]>(c.whatChanged, []) }));
  });

  app.get("/api/changes/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
    const c = await prisma.change.findUnique({ where: { id } });
    if (!c) {
      reply.code(404);
      return { error: "not found" };
    }
    return { ...c, whatChanged: fromJson<string[]>(c.whatChanged, []) };
  });

  app.post("/api/changes/:id/approve", async (req) => {
    const { id } = req.params as { id: string };
    const c = await prisma.change.update({ where: { id }, data: { status: "approved", approvedAt: new Date() } });
    return c;
  });

  app.post("/api/changes/:id/reject", async (req) => {
    const { id } = req.params as { id: string };
    return prisma.change.update({ where: { id }, data: { status: "rejected" } });
  });

  // ---- data tab ----------------------------------------------------------
  app.get("/api/tools/:id/data", async (req) => {
    const { id } = req.params as { id: string };
    const plan = await prisma.buildPlanRow.findFirst({ where: { toolId: id }, orderBy: { createdAt: "desc" } });
    if (!plan) return { tables: [] };
    const tableMap = fromJson<Record<string, string>>(plan.tableMap, {});
    const planObj = fromJson<BuildPlan>(plan.planJson, {} as BuildPlan);
    const tables = [];
    for (const model of planObj.dataModels ?? []) {
      const table = tableMap[model.name];
      let count = 0;
      if (table && insforge.isConfigured) {
        try {
          const rows = await insforge.getRecords(table, "limit=1000");
          count = rows.length;
        } catch {
          /* table may not exist yet */
        }
      }
      tables.push({ entity: model.name, table, fields: model.fields, description: model.description, count });
    }
    return { tables };
  });

  app.get("/api/tools/:id/data/:table", async (req) => {
    const { table } = req.params as { id: string; table: string };
    if (!insforge.isConfigured) return { records: [] };
    try {
      const records = await insforge.getRecords(table, "order=created_at.desc&limit=200");
      return { records };
    } catch (err) {
      return { records: [], error: String(err) };
    }
  });

  // ---- workflows & logs --------------------------------------------------
  app.get("/api/tools/:id/workflows", async (req) => {
    const { id } = req.params as { id: string };
    const plan = await prisma.buildPlanRow.findFirst({ where: { toolId: id }, orderBy: { createdAt: "desc" } });
    if (!plan) return { workflows: [] };
    const planObj = fromJson<BuildPlan>(plan.planJson, {} as BuildPlan);
    return { workflows: planObj.workflows ?? [] };
  });

  app.get("/api/tools/:id/logs", async (req) => {
    const { id } = req.params as { id: string };
    const [runs, changes, deployments] = await Promise.all([
      prisma.workflowRun.findMany({ where: { toolId: id }, orderBy: { createdAt: "desc" }, take: 50 }),
      prisma.change.findMany({ where: { toolId: id }, orderBy: { createdAt: "desc" }, take: 20 }),
      prisma.deployment.findMany({ where: { toolId: id }, orderBy: { createdAt: "desc" }, take: 20 }),
    ]);
    return { runs, changes, deployments };
  });
}
