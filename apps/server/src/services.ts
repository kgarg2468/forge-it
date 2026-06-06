import {
  MiniMaxClient,
  InsForgeClient,
  ComposioService,
  RailwayService,
  ReplicasService,
  DevinService,
  MemoirService,
  LimrunService,
} from "@forgeit/services";
import { Runner } from "@forgeit/runner";
import { env } from "./env.js";

export const minimax = new MiniMaxClient({
  apiKey: env.minimax.apiKey,
  baseUrl: env.minimax.baseUrl,
  planModel: env.minimax.planModel,
  codeModel: env.minimax.codeModel,
});

export const insforge = new InsForgeClient({
  baseUrl: env.insforge.baseUrl,
  apiKey: env.insforge.apiKey,
});

export const composio = new ComposioService({
  apiKey: env.composio.apiKey,
  authConfigs: env.composio.authConfigs,
});

export const railway = new RailwayService({
  token: env.railway.token,
  projectId: env.railway.projectId,
});

export const replicas = new ReplicasService({
  apiKey: env.replicas.apiKey,
  environmentId: env.replicas.environmentId,
  repository: env.replicas.repository,
  model: env.replicas.model,
  codingAgent: env.replicas.codingAgent,
  baseUrl: env.replicas.baseUrl,
});

export const devin = new DevinService({
  apiKey: env.devin.apiKey,
  orgId: env.devin.orgId,
  devinMode: env.devin.devinMode,
  baseUrl: env.devin.baseUrl,
});

export const memoir = new MemoirService({
  webhookUrl: env.memoir.webhookUrl,
});

export const limrun = new LimrunService({
  apiKey: env.limrun.apiKey,
  streamBaseUrl: env.limrun.streamBaseUrl,
});

export const runner = new Runner({
  templateDir: env.paths.templateDir,
  generatedRoot: env.paths.generatedRoot,
  opencodeBin: process.env.OPENCODE_BIN ?? "opencode",
  codeModel: env.minimax.codeModel,
  minimaxBaseUrl: env.minimax.baseUrl,
  minimaxApiKey: env.minimax.apiKey,
  packageManager: process.env.GEN_PKG_MANAGER ?? "npm",
  previewPortBase: env.previewPortBase,
});

// The generated apps read InsForge directly; hand them the project key (anon if
// provided, else the project key — RLS is off so it works).
export const insforgeClientKey = env.insforge.anonKey || env.insforge.apiKey;
