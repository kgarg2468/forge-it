import type {
  AppActionsResponse,
  AppsResponse,
  BuildLog,
  BuildPlan,
  Change,
  ConnectResponse,
  CreateToolBody,
  DataRecordsResponse,
  DataTablesResponse,
  Deployment,
  DiscoveryResponse,
  ExecuteActionResponse,
  Health,
  Job,
  Me,
  Tool,
  ToolDetail,
  ToolLogsResponse,
  UpdateToolBody,
  WorkflowsResponse,
} from "@/types";

export const API_URL: string =
  (import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:8787";

export class ApiError extends Error {
  status: number;
  body: unknown;
  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  const text = await res.text();
  let body: unknown = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }

  if (!res.ok) {
    const msg =
      (body && typeof body === "object" && "error" in body
        ? String((body as { error: unknown }).error)
        : null) ?? `Request failed (${res.status})`;
    throw new ApiError(msg, res.status, body);
  }

  return body as T;
}

const json = (data: unknown): RequestInit => ({
  method: "POST",
  body: JSON.stringify(data ?? {}),
});

// =============================================================================
// API surface — one method per documented endpoint.
// =============================================================================

export const api = {
  // ---- system ----
  health: () => request<Health>("/api/health"),
  me: () => request<Me>("/api/me"),

  // ---- connected apps ----
  apps: () => request<AppsResponse>("/api/apps"),
  connectApp: (provider: string) =>
    request<ConnectResponse>("/api/apps/connect", json({ provider })),
  disconnectApp: (connectionId: string) =>
    request<{ ok: boolean }>(`/api/apps/${connectionId}`, { method: "DELETE" }),
  appActions: (provider: string) =>
    request<AppActionsResponse>(`/api/apps/${provider}/actions`),

  // ---- tools ----
  tools: () => request<Tool[]>("/api/tools"),
  tool: (id: string) => request<ToolDetail>(`/api/tools/${id}`),
  createTool: (body: CreateToolBody) =>
    request<Tool>("/api/tools", json(body)),
  updateTool: (id: string, body: UpdateToolBody) =>
    request<Tool>(`/api/tools/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  deleteTool: (id: string) =>
    request<{ ok: boolean }>(`/api/tools/${id}`, { method: "DELETE" }),

  // ---- build flow ----
  discover: (id: string) =>
    request<DiscoveryResponse>(`/api/tools/${id}/discover`, json({})),
  plan: (id: string) =>
    request<{ plan: BuildPlan; planId: string }>(`/api/tools/${id}/plan`, json({})),
  savePlan: (id: string, plan: BuildPlan) =>
    request<{ plan: BuildPlan; planId: string }>(`/api/tools/${id}/plan`, {
      method: "PUT",
      body: JSON.stringify({ plan }),
    }),
  approve: (id: string) =>
    request<{ jobId: string }>(`/api/tools/${id}/approve`, json({})),
  chat: (id: string, message: string) =>
    request<{ jobId: string }>(`/api/tools/${id}/chat`, json({ message })),
  job: (id: string) => request<Job | null>(`/api/tools/${id}/job`),
  buildLogs: (jobId: string) => request<BuildLog[]>(`/api/builds/${jobId}/logs`),

  // ---- actions ----
  executeAction: (
    id: string,
    payload: { slug: string; args: Record<string, unknown>; live?: boolean },
  ) => request<ExecuteActionResponse>(`/api/tools/${id}/actions/execute`, json(payload)),

  // ---- preview & deploy ----
  preview: (id: string) => request<{ url: string | null }>(`/api/tools/${id}/preview`),
  deploy: (id: string, environment?: "preview" | "production") =>
    request<{ deploymentId: string }>(
      `/api/tools/${id}/deploy`,
      json(environment ? { environment } : {}),
    ),
  deployments: (id: string) => request<Deployment[]>(`/api/tools/${id}/deployments`),

  // ---- changes ----
  changes: (id: string) => request<Change[]>(`/api/tools/${id}/changes`),
  change: (id: string) => request<Change>(`/api/changes/${id}`),
  approveChange: (id: string) =>
    request<Change>(`/api/changes/${id}/approve`, json({})),
  rejectChange: (id: string) =>
    request<Change>(`/api/changes/${id}/reject`, json({})),

  // ---- runtime data ----
  data: (id: string) => request<DataTablesResponse>(`/api/tools/${id}/data`),
  dataTable: (id: string, table: string) =>
    request<DataRecordsResponse>(`/api/tools/${id}/data/${table}`),
  workflows: (id: string) => request<WorkflowsResponse>(`/api/tools/${id}/workflows`),
  logs: (id: string) => request<ToolLogsResponse>(`/api/tools/${id}/logs`),
};

// ---- SSE stream URLs (used by the EventSource helper) ----
export const streamUrls = {
  build: (jobId: string) => `${API_URL}/api/builds/${jobId}/stream`,
  deploy: (toolId: string) => `${API_URL}/api/deploy/${toolId}/stream`,
};
