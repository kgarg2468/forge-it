import { z } from "zod";

// ---------------------------------------------------------------------------
// BuildPlan — the structured contract the model produces and the UI/runner use.
// Field types are aligned to InsForge column types so the InsForge service can
// provision tables directly from a BuildPlan with no remapping.
// ---------------------------------------------------------------------------

export const FIELD_TYPES = [
  "string",
  "text",
  "integer",
  "float",
  "boolean",
  "datetime",
  "uuid",
  "json",
  "file",
] as const;
export type FieldType = (typeof FIELD_TYPES)[number];

export const PAGE_TYPES = [
  "dashboard",
  "list",
  "detail",
  "form",
  "approval_queue",
  "kanban",
  "audit_log",
] as const;
export type PageType = (typeof PAGE_TYPES)[number];

export const fieldSchema = z.object({
  name: z.string().describe("snake_case column name"),
  type: z.enum(FIELD_TYPES),
  required: z.boolean().optional().default(false),
  unique: z.boolean().optional().default(false),
  description: z.string().optional(),
  // Optional reference to another data model (by name) for relations.
  relation: z.string().optional(),
});
export type PlanField = z.infer<typeof fieldSchema>;

export const dataModelSchema = z.object({
  name: z.string().describe("PascalCase entity name, e.g. RefundRequests"),
  description: z.string().optional(),
  fields: z.array(fieldSchema).min(1),
});
export type PlanDataModel = z.infer<typeof dataModelSchema>;

export const pageSchema = z.object({
  name: z.string(),
  route: z.string().describe("react-router path, e.g. / or /requests/:id"),
  type: z.enum(PAGE_TYPES),
  description: z.string(),
  // Which data model this page is primarily bound to (by name), if any.
  entity: z.string().optional(),
});
export type PlanPage = z.infer<typeof pageSchema>;

export const connectedAppSchema = z.object({
  provider: z.enum([
    "gmail",
    "slack",
    "stripe",
    "hubspot",
    "notion",
    "linear",
    "sheets",
    "airtable",
    "github",
  ]),
  purpose: z.string(),
});
export type PlanConnectedApp = z.infer<typeof connectedAppSchema>;

export const workflowSchema = z.object({
  name: z.string(),
  trigger: z.string().describe("Plain-English description of what starts this workflow"),
  steps: z.array(z.string()).min(1).describe("Ordered plain-English steps"),
  risk: z.enum(["low", "medium", "high"]).optional().default("low"),
});
export type PlanWorkflow = z.infer<typeof workflowSchema>;

export const permissionSchema = z.object({
  role: z.string(),
  capabilities: z.array(z.string()),
});
export type PlanPermission = z.infer<typeof permissionSchema>;

export const riskSchema = z.object({
  type: z.string(),
  description: z.string(),
});
export type PlanRisk = z.infer<typeof riskSchema>;

export const buildPlanSchema = z.object({
  appName: z.string(),
  description: z.string(),
  targetUsers: z.array(z.string()).default([]),
  department: z.string(),
  connectedApps: z.array(connectedAppSchema).default([]),
  pages: z.array(pageSchema).min(1),
  dataModels: z.array(dataModelSchema).min(1),
  workflows: z.array(workflowSchema).default([]),
  permissions: z.array(permissionSchema).default([]),
  risks: z.array(riskSchema).default([]),
});
export type BuildPlan = z.infer<typeof buildPlanSchema>;

// ---------------------------------------------------------------------------
// Context discovery — what the model returns when "reading the stack".
// ---------------------------------------------------------------------------

export const discoveryFindingSchema = z.object({
  provider: z.string(),
  title: z.string(),
  detail: z.string().optional(),
  items: z.array(z.string()).optional(),
});
export type DiscoveryFinding = z.infer<typeof discoveryFindingSchema>;

export const discoveryResultSchema = z.object({
  findings: z.array(discoveryFindingSchema).default([]),
  suggestedRoles: z.array(z.string()).default([]),
  normalizedIntent: z.string().optional(),
});
export type DiscoveryResult = z.infer<typeof discoveryResultSchema>;
