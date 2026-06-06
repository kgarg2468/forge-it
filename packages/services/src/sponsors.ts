export type SponsorProvider = "replicas" | "devin" | "memoir" | "limrun";

export interface SponsorToolContext {
  toolId: string;
  toolName: string;
  toolSlug: string;
  prompt?: string;
  planSummary?: string;
  changeSummary?: string;
  previewUrl?: string;
  productionUrl?: string;
}

export interface SponsorIntegrationResult {
  provider: SponsorProvider;
  configured: boolean;
  simulated: boolean;
  ok: boolean;
  message: string;
  external: {
    id?: string;
    url?: string;
    status?: string;
    artifact?: Record<string, unknown>;
    raw?: unknown;
  };
}

export interface SponsorStatus {
  configured: boolean;
  mode: "live" | "simulated";
  missing: string[];
}

type FetchLike = (input: string | URL, init?: RequestInit) => Promise<Response>;

function fetcher(fetchImpl?: FetchLike): FetchLike {
  return fetchImpl ?? fetch;
}

function sponsorStatus(required: Record<string, string | undefined>): SponsorStatus {
  const missing = Object.entries(required)
    .filter(([, value]) => !value)
    .map(([key]) => key);
  return {
    configured: missing.length === 0,
    mode: missing.length === 0 ? "live" : "simulated",
    missing,
  };
}

function contextLines(ctx: SponsorToolContext): string {
  return [
    `Tool: ${ctx.toolName} (${ctx.toolSlug})`,
    ctx.prompt ? `Original request: ${ctx.prompt}` : "",
    ctx.planSummary ? `Build plan: ${ctx.planSummary}` : "",
    ctx.changeSummary ? `Latest change: ${ctx.changeSummary}` : "",
    ctx.previewUrl ? `Preview URL: ${ctx.previewUrl}` : "",
    ctx.productionUrl ? `Production URL: ${ctx.productionUrl}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

function cleanName(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "forgeit-tool";
}

async function readJson(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { text };
  }
}

function stringFrom(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function objectFrom(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function nestedStringFrom(value: Record<string, unknown>, path: string[]): string | undefined {
  let current: unknown = value;
  for (const key of path) {
    current = objectFrom(current)[key];
  }
  return stringFrom(current);
}

function redactSensitiveValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map((item) => redactSensitiveValue(item));
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, child]) => [
        key,
        /authorization|api[_-]?key|password|secret|token/i.test(key) ? "[redacted]" : redactSensitiveValue(child),
      ]),
    );
  }
  if (typeof value === "string") {
    return value.replace(/([?&](?:access_token|api_key|key|signature|sig|token)=)[^&]+/gi, "$1[redacted]");
  }
  return value;
}

export class ReplicasService {
  private baseUrl: string;
  private fetchImpl: FetchLike;

  constructor(
    private cfg: {
      apiKey: string;
      environmentId?: string;
      repository?: string;
      model?: string;
      codingAgent?: string;
      baseUrl?: string;
      fetchImpl?: FetchLike;
    },
  ) {
    this.baseUrl = cfg.baseUrl ?? "https://api.tryreplicas.com";
    this.fetchImpl = fetcher(cfg.fetchImpl);
  }

  status(): SponsorStatus {
    return sponsorStatus({
      REPLICAS_API_KEY: this.cfg.apiKey,
      REPLICAS_ENVIRONMENT_ID: this.cfg.environmentId,
    });
  }

  async createReview(ctx: SponsorToolContext): Promise<SponsorIntegrationResult> {
    const status = this.status();
    if (!status.configured) {
      return {
        provider: "replicas",
        configured: false,
        simulated: true,
        ok: true,
        message: `Simulated Replicas background agent review for ${ctx.toolName}.`,
        external: {
          id: `sim-replica-${ctx.toolId}`,
          status: "queued",
          url: "https://tryreplicas.com/dashboard",
        },
      };
    }

    const body: Record<string, unknown> = {
      name: cleanName(`forgeit-${ctx.toolSlug}`),
      environment_id: this.cfg.environmentId,
      message: `Review this ForgeIt-generated internal tool and suggest safe follow-up changes.\n\n${contextLines(ctx)}`,
      coding_agent: this.cfg.codingAgent ?? this.cfg.model ?? "codex",
      lifecycle_policy: "delete_after_inactivity",
    };
    if (this.cfg.repository) body.repository = this.cfg.repository;

    const res = await this.fetchImpl(`${this.baseUrl}/v1/replica`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.cfg.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    const json = objectFrom(await readJson(res));
    if (!res.ok) {
      return {
        provider: "replicas",
        configured: true,
        simulated: false,
        ok: false,
        message: `Replicas request failed with HTTP ${res.status}.`,
        external: { status: String(res.status), raw: redactSensitiveValue(json) },
      };
    }

    return {
      provider: "replicas",
      configured: true,
      simulated: false,
      ok: true,
      message: `Replicas background review created for ${ctx.toolName}.`,
      external: {
        id: stringFrom(json.id) ?? stringFrom(json.replica_id),
        status: stringFrom(json.status),
        url: stringFrom(json.url),
        raw: redactSensitiveValue(json),
      },
    };
  }
}

export class DevinService {
  private baseUrl: string;
  private fetchImpl: FetchLike;

  constructor(
    private cfg: {
      apiKey: string;
      orgId?: string;
      devinMode?: "normal" | "fast" | "lite";
      baseUrl?: string;
      fetchImpl?: FetchLike;
    },
  ) {
    this.baseUrl = cfg.baseUrl ?? "https://api.devin.ai/v3";
    this.fetchImpl = fetcher(cfg.fetchImpl);
  }

  status(): SponsorStatus {
    return sponsorStatus({
      DEVIN_API_KEY: this.cfg.apiKey,
      DEVIN_ORG_ID: this.cfg.orgId,
    });
  }

  async createReview(ctx: SponsorToolContext): Promise<SponsorIntegrationResult> {
    const status = this.status();
    if (!status.configured) {
      return {
        provider: "devin",
        configured: false,
        simulated: true,
        ok: true,
        message: `Simulated Devin engineering review for ${ctx.toolName}.`,
        external: {
          id: `sim-devin-${ctx.toolId}`,
          status: "created",
          url: "https://app.devin.ai",
        },
      };
    }

    const body = {
      title: `ForgeIt review: ${ctx.toolName}`,
      prompt: `Perform an engineering review of this ForgeIt-generated internal tool. Focus on safety, generated backend usage, demo-safe action handling, and missing tests.\n\n${contextLines(ctx)}`,
      devin_mode: this.cfg.devinMode,
      tags: ["forgeit", "sponsor-integration"],
    };

    const res = await this.fetchImpl(`${this.baseUrl}/organizations/${this.cfg.orgId}/sessions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.cfg.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    const json = objectFrom(await readJson(res));
    if (!res.ok) {
      return {
        provider: "devin",
        configured: true,
        simulated: false,
        ok: false,
        message: `Devin request failed with HTTP ${res.status}.`,
        external: { status: String(res.status), raw: redactSensitiveValue(json) },
      };
    }

    return {
      provider: "devin",
      configured: true,
      simulated: false,
      ok: true,
      message: `Devin review session created for ${ctx.toolName}.`,
      external: {
        id: stringFrom(json.session_id) ?? stringFrom(json.id),
        status: stringFrom(json.status),
        url: stringFrom(json.url),
        raw: redactSensitiveValue(json),
      },
    };
  }
}

export class MemoirService {
  private fetchImpl: FetchLike;

  constructor(
    private cfg: {
      webhookUrl?: string;
      fetchImpl?: FetchLike;
    },
  ) {
    this.fetchImpl = fetcher(cfg.fetchImpl);
  }

  status(): SponsorStatus {
    return sponsorStatus({ MEMOIR_WEBHOOK_URL: this.cfg.webhookUrl });
  }

  async createLaunchBrief(ctx: SponsorToolContext): Promise<SponsorIntegrationResult> {
    const artifact = this.launchPacket(ctx);
    const status = this.status();
    if (!status.configured) {
      return {
        provider: "memoir",
        configured: false,
        simulated: true,
        ok: true,
        message: `Simulated Memoir launch packet for ${ctx.toolName}.`,
        external: { id: `sim-memoir-${ctx.toolId}`, status: "draft", artifact },
      };
    }

    const res = await this.fetchImpl(this.cfg.webhookUrl!, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        source: "forgeit",
        tool: {
          id: ctx.toolId,
          name: ctx.toolName,
          slug: ctx.toolSlug,
          previewUrl: ctx.previewUrl,
          productionUrl: ctx.productionUrl,
        },
        artifact,
      }),
    });
    const json = objectFrom(await readJson(res));
    if (!res.ok) {
      return {
        provider: "memoir",
        configured: true,
        simulated: false,
        ok: false,
        message: `Memoir webhook failed with HTTP ${res.status}.`,
        external: { status: String(res.status), artifact, raw: redactSensitiveValue(json) },
      };
    }

    return {
      provider: "memoir",
      configured: true,
      simulated: false,
      ok: true,
      message: `Memoir launch packet sent for ${ctx.toolName}.`,
      external: {
        id: stringFrom(json.id),
        status: stringFrom(json.status) ?? "accepted",
        url: stringFrom(json.url),
        artifact,
        raw: redactSensitiveValue(json),
      },
    };
  }

  private launchPacket(ctx: SponsorToolContext): Record<string, unknown> {
    return {
      kind: "launch_packet",
      headline: `${ctx.toolName}: generated internal tooling from a plain-English workflow`,
      angle: "ForgeIt turns messy internal operations workflows into planned, backed, reviewable tools.",
      proofPoints: [
        ctx.planSummary ?? "Structured build plan with pages, data models, workflows, permissions, and risks.",
        ctx.changeSummary ?? "Generated change summary ready for non-technical review.",
        ctx.previewUrl ? `Live preview available at ${ctx.previewUrl}` : "Preview URL can be attached when generated.",
      ],
      suggestedPosts: [
        `We built ${ctx.toolName} by describing the workflow, not hand-writing the internal app spec.`,
        "The interesting part is not the UI. It is the reviewable path from prompt to backend tables to safe workflow actions.",
      ],
    };
  }
}

export class LimrunService {
  private fetchImpl: FetchLike;
  private baseUrl: string;

  constructor(
    private cfg: {
      apiKey: string;
      baseUrl?: string;
      platform?: "android" | "ios";
      streamBaseUrl?: string;
      fetchImpl?: FetchLike;
    },
  ) {
    this.baseUrl = cfg.baseUrl ?? "https://api.lim.run";
    this.fetchImpl = fetcher(cfg.fetchImpl);
  }

  status(): SponsorStatus {
    return sponsorStatus({
      LIM_API_KEY: this.cfg.apiKey,
    });
  }

  async createPreview(ctx: SponsorToolContext): Promise<SponsorIntegrationResult> {
    const status = this.status();
    if (!status.configured) {
      return {
        provider: "limrun",
        configured: false,
        simulated: true,
        ok: true,
        message: `Simulated Limrun mobile preview for ${ctx.toolName}.`,
        external: {
          id: `sim-limrun-${ctx.toolId}`,
          status: "ready",
          url: `https://limrun.example/streams/${ctx.toolSlug}`,
        },
      };
    }

    const platform = this.cfg.platform ?? "android";
    const endpoint = platform === "ios" ? "/v1/ios_instances?wait=false" : "/v1/android_instances?wait=false";
    const body = {
      metadata: {
        displayName: `ForgeIt ${ctx.toolName}`,
        labels: {
          source: "forgeit",
          purpose: "mobile-qa",
          toolId: ctx.toolId,
          toolSlug: ctx.toolSlug,
          previewUrl: ctx.previewUrl ?? "",
          productionUrl: ctx.productionUrl ?? "",
        },
      },
      spec: {
        inactivityTimeout: "10m",
        hardTimeout: "1h",
      },
    };

    const res = await this.fetchImpl(`${this.baseUrl}${endpoint}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.cfg.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    const json = objectFrom(await readJson(res));
    if (!res.ok) {
      return {
        provider: "limrun",
        configured: true,
        simulated: false,
        ok: false,
        message: `Limrun handoff failed with HTTP ${res.status}.`,
        external: { status: String(res.status), raw: redactSensitiveValue(json) },
      };
    }

    const instanceId = nestedStringFrom(json, ["metadata", "id"]) ?? stringFrom(json.id);
    const instanceStatus = nestedStringFrom(json, ["status", "state"]) ?? stringFrom(json.status) ?? "creating";
    const streamUrl =
      stringFrom(json.streamUrl) ??
      stringFrom(json.url) ??
      nestedStringFrom(json, ["status", "streamUrl"]) ??
      nestedStringFrom(json, ["status", "endpointWebSocketUrl"]);

    return {
      provider: "limrun",
      configured: true,
      simulated: false,
      ok: true,
      message: `Limrun ${platform} QA instance created for ${ctx.toolName}.`,
      external: {
        id: instanceId,
        status: instanceStatus,
        url:
          streamUrl ??
          `${this.cfg.streamBaseUrl ?? "https://console.limrun.com"}/?tool=${encodeURIComponent(ctx.toolSlug)}`,
        raw: redactSensitiveValue(json),
      },
    };
  }
}
