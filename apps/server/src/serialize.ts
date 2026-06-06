import { fromJson } from "./db.js";
import { PROVIDERS, PROVIDER_META, type Provider } from "@forgeit/shared";

export function serializeTool(tool: any, extra: Record<string, unknown> = {}) {
  return {
    id: tool.id,
    name: tool.name,
    slug: tool.slug,
    description: tool.description,
    status: tool.status,
    department: tool.department,
    ownerName: tool.ownerName,
    previewUrl: tool.previewUrl,
    productionUrl: tool.productionUrl,
    tags: fromJson<string[]>(tool.tags, []),
    createdAt: tool.createdAt,
    updatedAt: tool.updatedAt,
    ...extra,
  };
}

export function providerCatalog(connected: Array<{ provider: string; id: string; status: string }>) {
  const byProvider = new Map(connected.map((c) => [c.provider, c]));
  return PROVIDERS.map((p: Provider) => {
    const c = byProvider.get(p);
    return {
      provider: p,
      ...PROVIDER_META[p],
      connected: Boolean(c),
      connectionId: c?.id,
      status: c?.status ?? "not_connected",
    };
  });
}
