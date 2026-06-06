import type { BuildPlan } from "@forgeit/shared";

export interface GenContext {
  toolName: string;
  toolSlug: string;
  plan: BuildPlan;
  tableMap: Record<string, string>; // entity -> actual InsForge table
  availableActions: Array<{ slug: string; provider: string; risk: string }>;
}

/** Build the OpenCode task prompt that turns the base template into the specific tool. */
export function buildGenPrompt(ctx: GenContext): string {
  const { plan, tableMap, availableActions } = ctx;

  const tables = Object.entries(tableMap)
    .map(([entity, table]) => {
      const model = plan.dataModels.find((m) => m.name === entity);
      const fields = model
        ? model.fields.map((f) => `${f.name}:${f.type}`).join(", ")
        : "";
      return `- entity "${entity}" -> insforge.t('${entity}') = table ${table}  (fields: ${fields})`;
    })
    .join("\n");

  const pages = plan.pages
    .map((p) => `- ${p.name} [${p.type}] route ${p.route}${p.entity ? ` (entity ${p.entity})` : ""}: ${p.description}`)
    .join("\n");

  const workflows = plan.workflows
    .map((w) => `- ${w.name} (risk ${w.risk}): trigger = ${w.trigger}; steps = ${w.steps.join(" -> ")}`)
    .join("\n");

  const actions = availableActions.length
    ? availableActions.map((a) => `- ${a.slug} (${a.provider}, ${a.risk}-risk)`).join("\n")
    : "(no connected action catalog was provided; use runAction with plausible slugs e.g. SLACK_SENDS_A_MESSAGE_TO_A_CHANNEL so action buttons still follow the approval flow)";

  return `IMPORTANT: Work ONLY inside the current working directory (this is a standalone app). Do NOT read, list, or modify any files outside it (no parent directories, no absolute paths elsewhere). Everything you need is here.

You are extending an existing Vite + React + TypeScript + Tailwind starter app (this directory) into a specific internal tool. Reuse the existing data client (insforge), actions client (runAction), runtime config, and UI primitives. Do not add new dependencies.

BUILD THIS TOOL: "${ctx.toolName}"
${plan.description}

DATA (InsForge tables already provisioned — use insforge.t('<Entity>'), do NOT create tables):
${tables}

PAGES TO BUILD (create under src/pages and register routes in src/App.tsx, with a nav in the Layout):
${pages}

WORKFLOWS / ACTIONS (wire buttons that perform these; high-risk actions MUST go through the ConfirmActionModal and runAction approval flow):
${workflows || "(none)"}

AVAILABLE ACTION SLUGS (call via runAction(slug, args)):
${actions}

REQUIREMENTS:
- Make the primary dashboard/list page the home route "/". Show real data from InsForge via the insforge client (list/get), with MetricCards summarizing counts/totals, a FilterBar, and a DataTable. Include loading, empty, and error states (primitives exist).
- Detail pages should load a record by id and show its fields plus action buttons (Approve/Reject/etc.) that open ConfirmActionModal and call runAction.
- If a table is empty, seed a few realistic starter rows on first load (insforge.insert) so the UI is never empty — but guard so it only seeds once.
- Keep the soft, rounded, card-based aesthetic. Polished and presentation-ready.
- Do not edit lib/insforge.ts, lib/actions.ts, or lib/config.ts except to add small helpers if truly needed.
- Ensure 'npm run build' succeeds (valid TypeScript). Keep imports correct.

Work efficiently: edit src/pages/Home.tsx and add the other pages, update src/App.tsx routes and the Layout nav. Then you are done.`;
}

export function buildEditPrompt(message: string): string {
  return `Apply this change to the current internal tool app (this directory). Reuse existing primitives and the insforge/runAction clients. Keep TypeScript valid (npm run build must pass). Change requested:\n\n"${message}"`;
}

export function buildRepairPrompt(errorLog: string): string {
  return `The app failed to build. Fix the errors so that 'npm run build' succeeds. Do not change app behavior beyond what's needed to fix the build. Here is the build output:\n\n${errorLog.slice(-4000)}`;
}
