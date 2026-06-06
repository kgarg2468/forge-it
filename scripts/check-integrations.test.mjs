import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildIntegrationReport, formatReport } from "./check-integrations.mjs";

describe("integration checker", () => {
  it("redacts present env values and reports wired code evidence", () => {
    const report = buildIntegrationReport({
      env: {
        REPLICAS_API_KEY: "rep_secret",
        REPLICAS_ENVIRONMENT_ID: "env_123",
        DEVIN_API_KEY: "devin_secret",
        DEVIN_ORG_ID: "org_123",
      },
      rootDir: process.cwd(),
    });

    const output = formatReport(report);

    assert.match(output, /Replicas/);
    assert.match(output, /Cognition \/ Devin/);
    assert.match(output, /REPLICAS_API_KEY=<present:redacted>/);
    assert.match(output, /DEVIN_API_KEY=<present:redacted>/);
    assert.doesNotMatch(output, /rep_secret/);
    assert.doesNotMatch(output, /devin_secret/);
    assert.equal(report.integrations.find((item) => item.name === "Replicas")?.code.status, "wired");
  });
});
