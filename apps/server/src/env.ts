import { config as loadEnv } from "dotenv";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Load the repo-root .env (apps/server/src -> ../../../.env)
loadEnv({ path: path.resolve(__dirname, "../../../.env") });

const repoRoot = path.resolve(__dirname, "../../..");

function req(name: string, fallback = ""): string {
  return process.env[name] ?? fallback;
}

function oneOf<T extends string>(name: string, allowed: readonly T[]): T | undefined {
  const value = process.env[name];
  return allowed.includes(value as T) ? (value as T) : undefined;
}

export const env = {
  port: Number(process.env.PORT ?? 8787),
  webOrigin: req("WEB_ORIGIN", "http://localhost:5173"),
  publicApiUrl: req("PUBLIC_API_URL", `http://localhost:${process.env.PORT ?? 8787}`),

  minimax: {
    apiKey: req("MINIMAX_API_KEY"),
    baseUrl: req("MINIMAX_BASE_URL", "https://api.minimax.io/v1"),
    planModel: req("MINIMAX_PLAN_MODEL", "MiniMax-M2.1"),
    codeModel: req("MINIMAX_CODE_MODEL", "MiniMax-M2.1"),
  },
  insforge: {
    baseUrl: req("INSFORGE_API_BASE_URL"),
    apiKey: req("INSFORGE_API_KEY"),
    anonKey: req("INSFORGE_ANON_KEY"),
  },
  composio: {
    apiKey: req("COMPOSIO_API_KEY"),
    authConfigs: {
      gmail: req("COMPOSIO_AUTH_CONFIG_GMAIL") || undefined,
      slack: req("COMPOSIO_AUTH_CONFIG_SLACK") || undefined,
      stripe: req("COMPOSIO_AUTH_CONFIG_STRIPE") || undefined,
    },
  },
  railway: {
    token: req("RAILWAY_API_TOKEN"),
    projectId: req("RAILWAY_PROJECT_ID") || undefined,
  },
  replicas: {
    apiKey: req("REPLICAS_API_KEY"),
    environmentId: req("REPLICAS_ENVIRONMENT_ID") || undefined,
    repository: req("REPLICAS_REPOSITORY") || undefined,
    model: req("REPLICAS_MODEL") || undefined,
    codingAgent: req("REPLICAS_CODING_AGENT") || undefined,
    baseUrl: req("REPLICAS_API_BASE_URL", "https://api.tryreplicas.com"),
  },
  devin: {
    apiKey: req("DEVIN_API_KEY"),
    orgId: req("DEVIN_ORG_ID") || undefined,
    devinMode: oneOf("DEVIN_MODE", ["normal", "fast", "lite"] as const),
    baseUrl: req("DEVIN_API_BASE_URL", "https://api.devin.ai/v3"),
  },
  memoir: {
    webhookUrl: req("MEMOIR_WEBHOOK_URL") || undefined,
  },
  limrun: {
    apiKey: req("LIM_API_KEY"),
    streamBaseUrl: req("LIMRUN_STREAM_BASE_URL") || undefined,
  },

  paths: {
    repoRoot,
    templateDir: path.join(repoRoot, "templates", "base-app"),
    // OUTSIDE the repo on purpose: the coding agent must not see the ForgeIt
    // monorepo siblings (apps/web, templates/…) or it wanders out of its sandbox.
    generatedRoot: process.env.FORGEIT_GENERATED_ROOT || path.join(os.homedir(), ".forgeit", "generated"),
  },
  previewPortBase: Number(process.env.PREVIEW_PORT_BASE ?? 4300),
};

export type Env = typeof env;
