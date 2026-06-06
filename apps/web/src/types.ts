// =============================================================================
// ForgeIt domain types — self-contained mirror of the backend API shapes.
// =============================================================================

export type ToolStatus =
  | "draft"
  | "building"
  | "review_needed"
  | "preview_ready"
  | "live"
  | "failed"
  | string;

export type JobStatus =
  | "queued"
  | "running"
  | "waiting_for_user"
  | "succeeded"
  | "failed"
  | "cancelled";

export type Provider =
  | "gmail"
  | "slack"
  | "stripe"
  | "hubspot"
  | "notion"
  | "linear"
  | "sheets"
  | "airtable"
  | "github"
  | string;

// ----- Health & identity ------------------------------------------------------

export interface HealthServices {
  minimax: boolean;
  insforge: boolean;
  composio: boolean;
  railway: boolean;
}

export interface Health {
  ok: boolean;
  services: HealthServices;
}

export interface MeUser {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
}

export interface MeWorkspace {
  id: string;
  name: string;
  slug: string;
  primaryTeam: string;
}

export interface Me {
  user: MeUser | null;
  workspace: MeWorkspace;
}

// ----- Connected apps ---------------------------------------------------------

export interface AppCatalogItem {
  provider: Provider;
  label: string;
  blurb: string;
  toolkit: string;
  accent: string;
  connected: boolean;
  connectionId?: string;
  status: string;
}

export interface AppsResponse {
  configured: boolean;
  catalog: AppCatalogItem[];
}

export interface ConnectResponse {
  configured: boolean;
  redirectUrl?: string;
  connected?: boolean;
  simulated?: boolean;
}

export interface AppAction {
  slug: string;
  provider: Provider;
  description: string;
  risk: string;
}

export interface AppActionsResponse {
  configured: boolean;
  actions: AppAction[];
}

// ----- Tools ------------------------------------------------------------------

export interface Tool {
  id: string;
  name: string;
  slug: string;
  description: string;
  status: ToolStatus;
  department: string | null;
  ownerName: string | null;
  previewUrl: string | null;
  productionUrl: string | null;
  tags: string[];
  connectedApps: Provider[];
  createdAt: string;
  updatedAt: string;
}

export interface ToolDetail extends Tool {
  prompt: string;
  selectedProviders: Provider[];
  plan: BuildPlan | null;
  planId?: string;
  planStatus?: string;
  latestJob?: Job | null;
  deployments: Deployment[];
}

export interface CreateToolBody {
  prompt: string;
  name?: string;
  selectedProviders?: string[];
  department?: string;
  appType?: string;
}

export interface UpdateToolBody {
  name?: string;
  description?: string;
  department?: string;
  status?: string;
  ownerName?: string;
  tags?: string[];
}

// ----- Discovery --------------------------------------------------------------

export interface DiscoveryFinding {
  provider: Provider;
  title: string;
  detail?: string;
  items?: string[];
}

export interface DiscoveryResponse {
  findings: DiscoveryFinding[];
  suggestedRoles: string[];
  normalizedIntent?: string;
}

// ----- Build plan -------------------------------------------------------------

export type PageType =
  | "dashboard"
  | "list"
  | "detail"
  | "form"
  | "approval_queue"
  | "kanban"
  | "audit_log";

export type FieldType =
  | "string"
  | "text"
  | "integer"
  | "float"
  | "boolean"
  | "datetime"
  | "uuid"
  | "json"
  | "file";

export interface PlanField {
  name: string;
  type: FieldType;
  required?: boolean;
  unique?: boolean;
  description?: string;
  relation?: string;
}

export interface PlanPage {
  name: string;
  route: string;
  type: PageType;
  description: string;
  entity?: string;
}

export interface PlanDataModel {
  name: string;
  description?: string;
  fields: PlanField[];
}

export interface PlanWorkflow {
  name: string;
  trigger: string;
  steps: string[];
  risk: string;
}

export interface PlanPermission {
  role: string;
  capabilities: string[];
}

export interface PlanRisk {
  type: string;
  description: string;
}

export interface PlanConnectedApp {
  provider: Provider;
  purpose: string;
}

export interface BuildPlan {
  appName: string;
  description: string;
  targetUsers: string[];
  department: string;
  connectedApps: PlanConnectedApp[];
  pages: PlanPage[];
  dataModels: PlanDataModel[];
  workflows: PlanWorkflow[];
  permissions: PlanPermission[];
  risks: PlanRisk[];
}

// ----- Jobs & build events ----------------------------------------------------

export interface Job {
  id: string;
  toolId: string;
  kind: string;
  status: JobStatus;
  currentStep?: string | null;
  errorMessage?: string | null;
  createdAt: string;
}

export type LogLevel = "info" | "success" | "warning" | "error";

export interface BuildLog {
  level: LogLevel;
  message: string;
  step?: string;
  createdAt: string;
}

export type BuildEvent =
  | { kind: "log"; level: LogLevel; message: string; step?: string; ts: number }
  | { kind: "status"; status: JobStatus; currentStep?: string; ts: number }
  | { kind: "preview_ready"; url: string; ts: number }
  | { kind: "file"; path: string; action: string; ts: number }
  | { kind: "done"; ok: boolean; ts: number };

// ----- Deployments & changes --------------------------------------------------

export interface Deployment {
  id: string;
  environment: "preview" | "production" | string;
  status: string;
  url: string | null;
  version: string | null;
  createdAt: string;
  deployedAt: string | null;
}

export interface Change {
  id: string;
  title: string;
  summary: string;
  status: string;
  whatChanged: string[];
  requestedBy: string;
  createdAt: string;
}

// ----- Data / workflows / logs (runtime) -------------------------------------

export interface DataTableField {
  name: string;
  type: string;
  required?: boolean;
  unique?: boolean;
}

export interface DataTable {
  entity: string;
  table: string;
  fields: DataTableField[];
  description?: string;
  count: number;
}

export interface DataTablesResponse {
  tables: DataTable[];
}

export interface DataRecordsResponse {
  records: Array<Record<string, unknown>>;
}

export interface RuntimeWorkflow {
  name: string;
  trigger: string;
  steps: string[];
  risk: string;
}

export interface WorkflowsResponse {
  workflows: RuntimeWorkflow[];
}

export interface LogRun {
  workflowName: string;
  slug: string;
  status: string;
  simulated: boolean;
  createdAt: string;
}

export interface ToolLogsResponse {
  runs: LogRun[];
  changes: Change[];
  deployments: Deployment[];
}

// ----- Action execution -------------------------------------------------------

export interface ExecuteActionResponse {
  ok: boolean;
  simulated: boolean;
  data?: unknown;
  error?: string;
}
