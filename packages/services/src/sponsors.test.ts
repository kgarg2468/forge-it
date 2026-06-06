import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  DevinService,
  LimrunService,
  MemoirService,
  ReplicasService,
  type SponsorToolContext,
} from "./sponsors.js";

const context: SponsorToolContext = {
  toolId: "tool_123",
  toolName: "Refund Request Dashboard",
  toolSlug: "refund-request-dashboard",
  prompt: "Build a refund dashboard for my pizza shop.",
  planSummary: "Dashboard with refund requests, approvals, and audit logs.",
  changeSummary: "Added manager approval rule.",
  previewUrl: "http://localhost:4300",
  productionUrl: "https://refund-dashboard.example.com",
};

describe("ReplicasService", () => {
  it("returns a simulated review when no API key is configured", async () => {
    const service = new ReplicasService({ apiKey: "", environmentId: "env_123" });

    const result = await service.createReview(context);

    assert.equal(result.provider, "replicas");
    assert.equal(result.configured, false);
    assert.equal(result.simulated, true);
    assert.equal(result.ok, true);
    assert.match(result.message, /Simulated Replicas/i);
    assert.equal(result.external.url, "https://tryreplicas.com/dashboard");
  });

  it("creates a real replica with the expected auth and payload", async () => {
    const calls: Array<{ url: string; init: RequestInit }> = [];
    const service = new ReplicasService({
      apiKey: "rep_key",
      environmentId: "env_123",
      repository: "forgeit/repo",
      model: "codex",
      fetchImpl: async (url, init) => {
        calls.push({ url: String(url), init: init ?? {} });
        return response(200, {
          id: "replica_123",
          status: "active",
          url: "https://tryreplicas.com/dashboard/replica_123",
        });
      },
    });

    const result = await service.createReview(context);

    assert.equal(result.configured, true);
    assert.equal(result.simulated, false);
    assert.equal(result.external.id, "replica_123");
    assert.equal(calls[0]?.url, "https://api.tryreplicas.com/v1/replica");
    assert.equal((calls[0]?.init.headers as Record<string, string>).Authorization, "Bearer rep_key");
    const body = JSON.parse(String(calls[0]?.init.body));
    assert.equal(body.environment_id, "env_123");
    assert.equal(body.repository, "forgeit/repo");
    assert.equal(body.coding_agent, "codex");
    assert.match(body.message, /Refund Request Dashboard/);
  });
});

describe("DevinService", () => {
  it("returns a simulated session when no API key is configured", async () => {
    const service = new DevinService({ apiKey: "", orgId: "org_123" });

    const result = await service.createReview(context);

    assert.equal(result.provider, "devin");
    assert.equal(result.configured, false);
    assert.equal(result.simulated, true);
    assert.equal(result.ok, true);
    assert.match(result.message, /Simulated Devin/i);
  });

  it("creates a real Devin session with the expected auth and payload", async () => {
    const calls: Array<{ url: string; init: RequestInit }> = [];
    const service = new DevinService({
      apiKey: "cog_key",
      orgId: "org_123",
      devinMode: "normal",
      fetchImpl: async (url, init) => {
        calls.push({ url: String(url), init: init ?? {} });
        return response(200, {
          session_id: "session_123",
          url: "https://app.devin.ai/sessions/session_123",
          title: "ForgeIt Review",
        });
      },
    });

    const result = await service.createReview(context);

    assert.equal(result.configured, true);
    assert.equal(result.simulated, false);
    assert.equal(result.external.id, "session_123");
    assert.equal(calls[0]?.url, "https://api.devin.ai/v3/organizations/org_123/sessions");
    assert.equal((calls[0]?.init.headers as Record<string, string>).Authorization, "Bearer cog_key");
    const body = JSON.parse(String(calls[0]?.init.body));
    assert.equal(body.devin_mode, "normal");
    assert.match(body.prompt, /engineering review/i);
    assert.deepEqual(body.tags, ["forgeit", "sponsor-integration"]);
  });
});

describe("MemoirService", () => {
  it("returns a launch packet when no webhook is configured", async () => {
    const service = new MemoirService({ webhookUrl: "" });

    const result = await service.createLaunchBrief(context);

    assert.equal(result.provider, "memoir");
    assert.equal(result.configured, false);
    assert.equal(result.simulated, true);
    assert.equal(result.ok, true);
    assert.equal(result.external.artifact?.kind, "launch_packet");
    assert.match(String(result.external.artifact?.headline), /Refund Request Dashboard/);
  });

  it("posts the launch packet to a configured webhook", async () => {
    const calls: Array<{ url: string; init: RequestInit }> = [];
    const service = new MemoirService({
      webhookUrl: "https://memoir.example.com/hooks/forgeit",
      fetchImpl: async (url, init) => {
        calls.push({ url: String(url), init: init ?? {} });
        return response(202, { id: "brief_123", url: "https://memoir.example.com/brief_123" });
      },
    });

    const result = await service.createLaunchBrief(context);

    assert.equal(result.configured, true);
    assert.equal(result.simulated, false);
    assert.equal(result.external.id, "brief_123");
    assert.equal(calls[0]?.url, "https://memoir.example.com/hooks/forgeit");
    const body = JSON.parse(String(calls[0]?.init.body));
    assert.equal(body.tool.name, "Refund Request Dashboard");
    assert.equal(body.artifact.kind, "launch_packet");
  });
});

describe("LimrunService", () => {
  it("returns a simulated mobile preview when no API key is configured", async () => {
    const service = new LimrunService({ apiKey: "" });

    const result = await service.createPreview(context);

    assert.equal(result.provider, "limrun");
    assert.equal(result.configured, false);
    assert.equal(result.simulated, true);
    assert.equal(result.ok, true);
    assert.match(String(result.external.url), /limrun\.example/);
  });

  it("creates a Limrun mobile instance with review metadata", async () => {
    const calls: Array<{ url: string; init: RequestInit }> = [];
    const service = new LimrunService({
      apiKey: "lim_key",
      baseUrl: "https://limrun.test",
      platform: "android",
      fetchImpl: async (url, init) => {
        calls.push({ url: String(url), init: init ?? {} });
        return response(202, {
          metadata: {
            id: "android_123",
            displayName: "ForgeIt Refund Request Dashboard",
          },
          status: {
            state: "creating",
            endpointWebSocketUrl: "wss://limrun.test/android_123",
          },
        });
      },
    });

    const result = await service.createPreview(context);

    assert.equal(result.configured, true);
    assert.equal(result.simulated, false);
    assert.equal(result.external.id, "android_123");
    assert.equal(result.external.status, "creating");
    assert.equal(calls[0]?.url, "https://limrun.test/v1/android_instances?wait=false");
    assert.equal((calls[0]?.init.headers as Record<string, string>).Authorization, "Bearer lim_key");
    const body = JSON.parse(String(calls[0]?.init.body));
    assert.equal(body.metadata.displayName, "ForgeIt Refund Request Dashboard");
    assert.equal(body.metadata.labels.toolSlug, "refund-request-dashboard");
    assert.equal(body.metadata.labels.previewUrl, "http://localhost:4300");
    assert.equal(body.spec.inactivityTimeout, "10m");
  });
});

function response(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
