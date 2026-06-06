#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const defaultRoot = path.resolve(__dirname, "..");

const definitions = [
  {
    name: "MiniMax",
    purpose: "Planning and code-generation model provider",
    required: ["MINIMAX_API_KEY"],
    optional: ["MINIMAX_BASE_URL", "MINIMAX_PLAN_MODEL", "MINIMAX_CODE_MODEL"],
    evidence: [
      { path: "packages/services/src/minimax.ts", contains: "class MiniMaxClient" },
      { path: "apps/server/src/services.ts", contains: "new MiniMaxClient" },
    ],
  },
  {
    name: "InsForge",
    purpose: "Hosted backend tables for generated tools",
    required: ["INSFORGE_API_BASE_URL", "INSFORGE_API_KEY"],
    optional: ["INSFORGE_ANON_KEY"],
    evidence: [
      { path: "packages/services/src/insforge.ts", contains: "class InsForgeClient" },
      { path: "apps/server/src/services.ts", contains: "new InsForgeClient" },
      { path: "apps/server/src/routes.ts", contains: "insforge" },
    ],
  },
  {
    name: "Composio",
    purpose: "Connected app actions for generated workflows",
    required: ["COMPOSIO_API_KEY"],
    optional: ["COMPOSIO_AUTH_CONFIG_GMAIL", "COMPOSIO_AUTH_CONFIG_SLACK", "COMPOSIO_AUTH_CONFIG_STRIPE"],
    evidence: [
      { path: "packages/services/src/composio.ts", contains: "class ComposioService" },
      { path: "apps/server/src/routes.ts", contains: "/api/apps" },
    ],
  },
  {
    name: "Railway",
    purpose: "Live generated-tool deployment target",
    required: ["RAILWAY_API_TOKEN", "RAILWAY_PROJECT_ID"],
    optional: [],
    evidence: [
      { path: "packages/services/src/railway.ts", contains: "class RailwayService" },
      { path: "apps/server/src/routes.ts", contains: "/api/tools/:id/deploy" },
    ],
  },
  {
    name: "Replicas",
    purpose: "Background coding-agent review",
    required: ["REPLICAS_API_KEY", "REPLICAS_ENVIRONMENT_ID"],
    optional: ["REPLICAS_REPOSITORY", "REPLICAS_CODING_AGENT", "REPLICAS_MODEL", "REPLICAS_API_BASE_URL"],
    evidence: [
      { path: "packages/services/src/sponsors.ts", contains: "class ReplicasService" },
      { path: "apps/server/src/routes.ts", contains: "/api/tools/:id/sponsors/replicas-review" },
    ],
  },
  {
    name: "Cognition / Devin",
    purpose: "Engineering review session",
    required: ["DEVIN_API_KEY", "DEVIN_ORG_ID"],
    optional: ["DEVIN_MODE", "DEVIN_API_BASE_URL"],
    evidence: [
      { path: "packages/services/src/sponsors.ts", contains: "class DevinService" },
      { path: "apps/server/src/routes.ts", contains: "/api/tools/:id/sponsors/devin-review" },
    ],
  },
  {
    name: "Memoir",
    purpose: "Launch packet handoff",
    required: ["MEMOIR_WEBHOOK_URL"],
    optional: [],
    evidence: [
      { path: "packages/services/src/sponsors.ts", contains: "class MemoirService" },
      { path: "apps/server/src/routes.ts", contains: "/api/tools/:id/sponsors/memoir-brief" },
    ],
  },
  {
    name: "Limrun",
    purpose: "Mobile QA handoff",
    required: ["LIM_API_KEY"],
    optional: ["LIMRUN_BASE_URL", "LIMRUN_PLATFORM", "LIMRUN_STREAM_BASE_URL"],
    evidence: [
      { path: "packages/services/src/sponsors.ts", contains: "class LimrunService" },
      { path: "apps/server/src/routes.ts", contains: "/api/tools/:id/sponsors/limrun-preview" },
    ],
  },
  {
    name: "Vercel",
    purpose: "Frontend deployment metadata",
    required: ["VERCEL_PROJECT_ID"],
    optional: ["VERCEL_PROJECT_PRODUCTION_URL", "VERCEL"],
    evidence: [{ path: "apps/server/src/routes.ts", contains: "VERCEL_PROJECT_ID" }],
  },
];

export function loadEnvFile(rootDir = defaultRoot, envFile = ".env") {
  const file = path.resolve(rootDir, envFile);
  if (!fs.existsSync(file)) return {};
  const values = {};
  const text = fs.readFileSync(file, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) continue;
    let value = match[2] ?? "";
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    values[match[1]] = value;
  }
  return values;
}

export function buildIntegrationReport({ env = process.env, rootDir = defaultRoot, envFile = ".env" } = {}) {
  const fileEnv = loadEnvFile(rootDir, envFile);
  const mergedEnv = { ...fileEnv, ...env };
  const envPresence = {};
  const integrations = definitions.map((definition) => {
    const evidence = definition.evidence.map((item) => {
      const fullPath = path.resolve(rootDir, item.path);
      const exists = fs.existsSync(fullPath);
      const matched = exists && fs.readFileSync(fullPath, "utf8").includes(item.contains);
      return { ...item, exists, matched };
    });
    const missingRequired = definition.required.filter((name) => !mergedEnv[name]);
    const presentRequired = definition.required.filter((name) => Boolean(mergedEnv[name]));
    const presentOptional = definition.optional.filter((name) => Boolean(mergedEnv[name]));
    for (const name of [...definition.required, ...definition.optional]) {
      envPresence[name] = Boolean(mergedEnv[name]);
    }
    const codeStatus = evidence.every((item) => item.matched) ? "wired" : "incomplete";
    const configStatus = missingRequired.length === 0 ? "ready" : "needs env";
    return {
      ...definition,
      required: {
        present: presentRequired,
        missing: missingRequired,
      },
      optional: {
        present: presentOptional,
        missing: definition.optional.filter((name) => !mergedEnv[name]),
      },
      code: {
        status: codeStatus,
        evidence,
      },
      status: codeStatus === "wired" && configStatus === "ready" ? "ready" : "needs attention",
    };
  });
  return {
    integrations,
    envPresence,
    ok: integrations.every((item) => item.status === "ready"),
  };
}

function redactEnvList(names, presence) {
  return names.map((name) => `${name}=${presence[name] ? "<present:redacted>" : "<missing>"}`).join(", ");
}

function pad(value, width) {
  return value.length >= width ? value : `${value}${" ".repeat(width - value.length)}`;
}

export function formatReport(report, { env = process.env, rootDir = defaultRoot, envFile = ".env" } = {}) {
  const fileEnv = loadEnvFile(rootDir, envFile);
  const mergedEnv = { ...fileEnv, ...env };
  const envPresence =
    report.envPresence ??
    Object.fromEntries(
      definitions.flatMap((definition) =>
        [...definition.required, ...definition.optional].map((name) => [name, Boolean(mergedEnv[name])]),
      ),
    );
  const lines = [
    "ForgeIt integration readiness",
    "Secret values are never printed; only presence is reported.",
    "",
    `${pad("Integration", 20)} ${pad("Code", 10)} ${pad("Config", 10)} Purpose`,
    `${pad("-".repeat(11), 20)} ${pad("-".repeat(4), 10)} ${pad("-".repeat(6), 10)} ${"-".repeat(7)}`,
  ];

  for (const item of report.integrations) {
    const configStatus = item.required.missing.length === 0 ? "ready" : "needs env";
    lines.push(`${pad(item.name, 20)} ${pad(item.code.status, 10)} ${pad(configStatus, 10)} ${item.purpose}`);
  }

  lines.push("", "Required env presence:");
  for (const item of report.integrations) {
    lines.push(`- ${item.name}: ${redactEnvList([...item.required.present, ...item.required.missing], envPresence)}`);
  }

  lines.push("", "Code evidence:");
  for (const item of report.integrations) {
    const evidence = item.code.evidence
      .map((entry) => `${entry.path}${entry.matched ? "" : " (missing match)"}`)
      .join(", ");
    lines.push(`- ${item.name}: ${evidence}`);
  }

  return `${lines.join("\n")}\n`;
}

function parseArgs(argv) {
  const args = { strict: false, envFile: ".env" };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--strict") args.strict = true;
    if (arg === "--env-file") {
      args.envFile = argv[index + 1] ?? ".env";
      index += 1;
    }
  }
  return args;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = parseArgs(process.argv.slice(2));
  const report = buildIntegrationReport({ rootDir: defaultRoot, envFile: args.envFile });
  process.stdout.write(formatReport(report, { rootDir: defaultRoot, envFile: args.envFile }));
  if (args.strict && !report.ok) {
    process.exitCode = 1;
  }
}
