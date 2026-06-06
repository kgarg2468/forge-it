import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

// Centralized query keys so invalidation stays consistent.
export const qk = {
  health: ["health"] as const,
  me: ["me"] as const,
  apps: ["apps"] as const,
  appActions: (provider: string) => ["app-actions", provider] as const,
  tools: ["tools"] as const,
  tool: (id: string) => ["tool", id] as const,
  job: (id: string) => ["job", id] as const,
  preview: (id: string) => ["preview", id] as const,
  data: (id: string) => ["data", id] as const,
  dataTable: (id: string, table: string) => ["data", id, table] as const,
  workflows: (id: string) => ["workflows", id] as const,
  changes: (id: string) => ["changes", id] as const,
  deployments: (id: string) => ["deployments", id] as const,
  logs: (id: string) => ["logs", id] as const,
};

export const useHealth = () =>
  useQuery({ queryKey: qk.health, queryFn: api.health, staleTime: 30_000 });

export const useMe = () =>
  useQuery({ queryKey: qk.me, queryFn: api.me, staleTime: 60_000 });

export const useApps = () =>
  useQuery({ queryKey: qk.apps, queryFn: api.apps });

export const useTools = () =>
  useQuery({ queryKey: qk.tools, queryFn: api.tools });

export const useTool = (id: string | undefined) =>
  useQuery({
    queryKey: qk.tool(id ?? ""),
    queryFn: () => api.tool(id as string),
    enabled: !!id,
  });
