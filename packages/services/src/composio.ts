import { classifyActionRisk, PROVIDER_META, type Provider } from "@forgeit/shared";

// ---------------------------------------------------------------------------
// Composio service — wraps @composio/core (v3). Lazy-imported so the platform
// runs even before COMPOSIO_API_KEY is set. Uses connectedAccounts.link()
// (NOT the retired initiate()). Degrades to a clear "not configured" state.
// ---------------------------------------------------------------------------

export interface ConnectResult {
  redirectUrl: string;
  connectionRequestId?: string;
}

export interface ExecuteResult {
  ok: boolean;
  simulated: boolean;
  data?: unknown;
  error?: string;
}

export interface ComposioToolInfo {
  slug: string;
  provider: string;
  description?: string;
  risk: "low" | "medium" | "high";
}

export class ComposioService {
  private client: any = null;
  private authConfigs: Partial<Record<Provider, string>>;

  constructor(
    private cfg: {
      apiKey: string;
      authConfigs: Partial<Record<Provider, string>>;
    },
  ) {
    this.authConfigs = cfg.authConfigs;
  }

  get isConfigured(): boolean {
    return Boolean(this.cfg.apiKey);
  }

  authConfigFor(provider: Provider): string | undefined {
    return this.authConfigs[provider];
  }

  private async getClient(): Promise<any> {
    if (!this.isConfigured) throw new Error("Composio not configured (set COMPOSIO_API_KEY)");
    if (this.client) return this.client;
    const mod: any = await import("@composio/core");
    const Composio = mod.Composio ?? mod.default?.Composio ?? mod.default;
    this.client = new Composio({ apiKey: this.cfg.apiKey });
    return this.client;
  }

  /** Begin an OAuth/API-key connection for a user; returns a redirect URL. */
  async startConnect(provider: Provider, userId: string, callbackUrl: string): Promise<ConnectResult> {
    const authConfigId = this.authConfigs[provider];
    if (!authConfigId)
      throw new Error(
        `No Composio auth config for ${provider}. Create one in the Composio dashboard and set COMPOSIO_AUTH_CONFIG_${provider.toUpperCase()}.`,
      );
    const composio = await this.getClient();
    const connection = await composio.connectedAccounts.link(userId, authConfigId, { callbackUrl });
    return {
      redirectUrl: connection.redirectUrl ?? connection.redirect_url,
      connectionRequestId: connection.id ?? connection.connectionRequestId,
    };
  }

  /** List the available tools/actions for given toolkits (provider names). */
  async getTools(userId: string, providers: Provider[], limit = 30): Promise<ComposioToolInfo[]> {
    const composio = await this.getClient();
    const toolkits = providers.map((p) => PROVIDER_META[p].toolkit);
    const tools = await composio.tools.get(userId, { toolkits, limit });
    const arr: any[] = Array.isArray(tools) ? tools : tools?.items ?? Object.values(tools ?? {});
    return arr.map((t: any) => {
      const slug: string = t.slug ?? t.name ?? t.function?.name ?? String(t);
      return {
        slug,
        provider: t.toolkit?.slug ?? t.toolkit ?? "",
        description: t.description ?? t.function?.description,
        risk: classifyActionRisk(slug),
      };
    });
  }

  /**
   * Execute a Composio action. High-risk actions are simulated unless live=true
   * (demo-safe mode). Returns {simulated:true} when simulated or not configured.
   */
  async execute(
    slug: string,
    userId: string,
    args: Record<string, unknown>,
    opts: { live?: boolean } = {},
  ): Promise<ExecuteResult> {
    const risk = classifyActionRisk(slug);
    const live = opts.live === true;
    // Demo-safe: never run high-risk for real unless explicitly live; if not
    // configured, always simulate.
    if (!this.isConfigured || (risk === "high" && !live)) {
      return {
        ok: true,
        simulated: true,
        data: { note: `Simulated ${slug} (demo-safe mode)`, args },
      };
    }
    try {
      const composio = await this.getClient();
      const result = await composio.tools.execute(slug, { userId, arguments: args });
      return { ok: true, simulated: false, data: result?.data ?? result };
    } catch (err) {
      return { ok: false, simulated: false, error: String(err) };
    }
  }
}
