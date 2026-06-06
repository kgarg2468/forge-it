import {
  buildPlanSchema,
  discoveryResultSchema,
  type BuildPlan,
  type DiscoveryResult,
} from "@forgeit/shared";
import { MiniMaxClient } from "./minimax.js";

export interface PlanInput {
  prompt: string;
  selectedProviders: string[]; // e.g. ["gmail","stripe","slack"]
  department?: string;
  appType?: string; // dashboard / approval queue / etc.
  availableTools?: Array<{ slug: string; provider: string; description?: string }>;
  workspaceRoles?: string[];
}

const PLAN_SYSTEM = `You are ForgeIt's planning engine. You turn a plain-English description of an internal business tool into a precise, buildable plan.

Rules:
- Design a focused internal tool (dashboard / approval queue / CRM-style table / admin panel).
- Data models: PascalCase names, snake_case fields, types from: string,text,integer,float,boolean,datetime,uuid,json,file. Always include sensible fields like status, owner/assigned_to, created_at where relevant.
- Pages: pick from dashboard,list,detail,form,approval_queue,kanban,audit_log. Bind each page to an entity where it makes sense. Always include a primary dashboard/list page.
- Workflows: describe trigger + ordered plain-English steps. Mark risk high for steps that send money/email or delete data.
- Permissions: realistic roles (Admin, plus department-specific managers, operators, viewers) with capability lists.
- connectedApps: only include providers the user selected or clearly needs, with a short purpose.
- risks: call out external/destructive actions that should require confirmation.
Keep it realistic and minimal — no speculative features.`;

export async function generateBuildPlan(
  client: MiniMaxClient,
  input: PlanInput,
): Promise<BuildPlan> {
  const toolList =
    input.availableTools && input.availableTools.length
      ? `\n\nAvailable connected actions (Composio tool slugs you can reference in workflows):\n` +
        input.availableTools
          .slice(0, 40)
          .map((t) => `- ${t.slug} (${t.provider})${t.description ? `: ${t.description}` : ""}`)
          .join("\n")
      : "";

  const prompt = `User request:\n"${input.prompt}"\n\nSelected apps: ${
    input.selectedProviders.join(", ") || "(none selected)"
  }\nDepartment: ${input.department ?? "(infer)"}\nApp type: ${
    input.appType ?? "(infer)"
  }\nWorkspace roles: ${(input.workspaceRoles ?? []).join(", ") || "(infer)"}${toolList}\n\nProduce the BuildPlan.`;

  return client.generateObject({
    schema: buildPlanSchema,
    system: PLAN_SYSTEM,
    prompt,
    schemaName: "emit_build_plan",
    schemaDescription: "The structured build plan for the internal tool.",
    maxTokens: 8000,
  });
}

const DISCOVERY_SYSTEM = `You are ForgeIt's context discovery engine. Given a user's tool request and the apps they've connected, produce realistic-sounding discovery findings that a system scanning those apps would surface (counts, channels, record types, common categories). Be plausible and specific to the request. Also suggest 2-4 user roles and a one-line normalized intent.`;

export async function discoverContext(
  client: MiniMaxClient,
  input: { prompt: string; selectedProviders: string[]; availableTools?: string[] },
): Promise<DiscoveryResult> {
  const prompt = `User request:\n"${input.prompt}"\n\nConnected apps: ${input.selectedProviders.join(
    ", ",
  )}\n${
    input.availableTools?.length
      ? `Detected actions: ${input.availableTools.slice(0, 30).join(", ")}\n`
      : ""
  }\nProduce discovery findings (one per connected app where relevant), suggested roles, and the normalized intent.`;

  return client.generateObject({
    schema: discoveryResultSchema,
    system: DISCOVERY_SYSTEM,
    prompt,
    schemaName: "emit_discovery",
    schemaDescription: "Discovery findings from scanning the connected stack.",
    maxTokens: 2500,
  });
}

export async function summarizeChange(
  client: MiniMaxClient,
  input: { request: string; changedFiles: string[]; planDiffNote?: string },
): Promise<{ title: string; summary: string; whatChanged: string[] }> {
  const text = await client.chatText(
    [
      {
        role: "system",
        content:
          "You summarize an AI-built change to an internal tool for a non-technical reviewer (GitHub-PR-style, plain English). Return a short title line, then a one-sentence summary, then 3-6 bullet points starting with '- '. No code, no file paths unless meaningful.",
      },
      {
        role: "user",
        content: `Requested change: "${input.request}"\nChanged files: ${input.changedFiles
          .slice(0, 30)
          .join(", ")}\n${input.planDiffNote ?? ""}`,
      },
    ],
    { maxTokens: 700, temperature: 0.4 },
  );
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const title = (lines[0] ?? input.request).replace(/^#+\s*/, "").slice(0, 100);
  const bullets = lines.filter((l) => l.startsWith("-")).map((l) => l.replace(/^-\s*/, ""));
  const summary =
    lines.find((l) => !l.startsWith("-") && l !== lines[0]) ?? input.request;
  return { title, summary, whatChanged: bullets.length ? bullets : [summary] };
}
