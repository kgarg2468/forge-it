// Shared status enums + small vocabularies used across server, web, and services.
// Kept as `as const` string unions so they serialize cleanly over JSON.

export const PROVIDERS = [
  "gmail",
  "slack",
  "stripe",
  "hubspot",
  "notion",
  "linear",
  "sheets",
  "airtable",
  "github",
] as const;
export type Provider = (typeof PROVIDERS)[number];

// Human metadata for each provider (label + what ForgeIt uses it for + accent).
export const PROVIDER_META: Record<
  Provider,
  { label: string; blurb: string; toolkit: string; accent: string }
> = {
  gmail: { label: "Gmail", blurb: "Use emails as workflow triggers and customer context.", toolkit: "GMAIL", accent: "#EA4335" },
  slack: { label: "Slack", blurb: "Send approvals, alerts, and team updates.", toolkit: "SLACK", accent: "#611f69" },
  stripe: { label: "Stripe", blurb: "Read customers, payments, refunds, disputes.", toolkit: "STRIPE", accent: "#635bff" },
  hubspot: { label: "HubSpot", blurb: "Use leads, deals, companies, and contacts.", toolkit: "HUBSPOT", accent: "#ff7a59" },
  notion: { label: "Notion", blurb: "Use docs, policies, databases, and team knowledge.", toolkit: "NOTION", accent: "#111" },
  linear: { label: "Linear", blurb: "Create and track engineering tasks.", toolkit: "LINEAR", accent: "#5e6ad2" },
  sheets: { label: "Google Sheets", blurb: "Turn spreadsheets into internal tools.", toolkit: "GOOGLESHEETS", accent: "#0f9d58" },
  airtable: { label: "Airtable", blurb: "Use existing ops data and tables.", toolkit: "AIRTABLE", accent: "#fcb400" },
  github: { label: "GitHub", blurb: "Track issues, PRs, and repos.", toolkit: "GITHUB", accent: "#111" },
};

export const TOOL_STATUSES = [
  "draft",
  "planning",
  "building",
  "preview_ready",
  "review_needed",
  "live",
  "failed",
  "archived",
] as const;
export type ToolStatus = (typeof TOOL_STATUSES)[number];

export const BUILD_JOB_STATUSES = [
  "queued",
  "running",
  "waiting_for_user",
  "succeeded",
  "failed",
  "cancelled",
] as const;
export type BuildJobStatus = (typeof BUILD_JOB_STATUSES)[number];

export const BUILD_PLAN_STATUSES = ["draft", "approved", "rejected", "superseded"] as const;
export type BuildPlanStatus = (typeof BUILD_PLAN_STATUSES)[number];

export const CHANGE_STATUSES = [
  "draft",
  "ready_for_review",
  "approved",
  "rejected",
  "deployed",
] as const;
export type ChangeStatus = (typeof CHANGE_STATUSES)[number];

export const DEPLOYMENT_STATUSES = ["queued", "deploying", "live", "failed", "rolled_back"] as const;
export type DeploymentStatus = (typeof DEPLOYMENT_STATUSES)[number];

export const DEPLOYMENT_ENVS = ["preview", "production"] as const;
export type DeploymentEnv = (typeof DEPLOYMENT_ENVS)[number];

export const LOG_LEVELS = ["info", "success", "warning", "error"] as const;
export type LogLevel = (typeof LOG_LEVELS)[number];

export const ACTION_RISKS = ["low", "medium", "high"] as const;
export type ActionRisk = (typeof ACTION_RISKS)[number];

export const DEPARTMENTS = [
  "Sales",
  "Support",
  "Finance",
  "HR",
  "Ops",
  "Engineering",
  "Founder / Admin",
] as const;
export type Department = (typeof DEPARTMENTS)[number];
