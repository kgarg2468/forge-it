import { tableName as makeTableName, type BuildPlan, type FieldType, type PlanField } from "@forgeit/shared";

// ---------------------------------------------------------------------------
// InsForge service — admin REST client for the shared hosted cloud project.
// Contract verified live against v2.2.0:
//   POST   /api/database/tables          {tableName, rlsEnabled, columns:[{columnName,type,isNullable,isUnique,defaultValue?,foreignKey?}]}
//   GET    /api/database/tables          -> ["t_x", ...]
//   DELETE /api/database/tables/{table}
//   POST   /api/database/records/{table} (array body, Prefer: return=representation)
//   GET    /api/database/records/{table}?col=eq.v&order=col.desc&limit=n
// Auth: header "X-API-Key: ik_..." (Bearer also works). id/created_at/updated_at are auto-added.
// rlsEnabled is false for generated tables so generated tools can read/write during preview and deployment.
// ---------------------------------------------------------------------------

const AUTO_FIELDS = new Set(["id", "created_at", "updated_at", "createdat", "updatedat"]);

const TYPE_MAP: Record<FieldType, string> = {
  string: "string",
  text: "string",
  integer: "integer",
  float: "float",
  boolean: "boolean",
  datetime: "datetime",
  uuid: "uuid",
  json: "json",
  file: "file",
};

export interface InsForgeColumn {
  columnName: string;
  type: string;
  isNullable: boolean;
  isUnique: boolean;
  defaultValue?: string;
}

export interface ProvisionResult {
  // entity name (from plan) -> actual InsForge table name
  tables: Record<string, string>;
  created: string[];
  skipped: string[];
}

export class InsForgeClient {
  constructor(
    private cfg: { baseUrl: string; apiKey: string },
  ) {}

  get isConfigured(): boolean {
    return Boolean(this.cfg.apiKey && this.cfg.baseUrl);
  }

  private async req(path: string, init: RequestInit = {}): Promise<Response> {
    return fetch(`${this.cfg.baseUrl}${path}`, {
      ...init,
      headers: {
        "X-API-Key": this.cfg.apiKey,
        "Content-Type": "application/json",
        ...(init.headers ?? {}),
      },
    });
  }

  async listTables(): Promise<string[]> {
    const res = await this.req("/api/database/tables");
    if (!res.ok) throw new Error(`InsForge listTables HTTP ${res.status}`);
    return (await res.json()) as string[];
  }

  async createTable(tableName: string, columns: InsForgeColumn[], rlsEnabled = false): Promise<void> {
    const res = await this.req("/api/database/tables", {
      method: "POST",
      body: JSON.stringify({ tableName, rlsEnabled, columns }),
    });
    if (!res.ok && res.status !== 409) {
      const txt = await res.text().catch(() => "");
      throw new Error(`InsForge createTable(${tableName}) HTTP ${res.status}: ${txt.slice(0, 300)}`);
    }
  }

  async deleteTable(tableName: string): Promise<void> {
    await this.req(`/api/database/tables/${tableName}`, { method: "DELETE" });
  }

  async insertRecords<T extends Record<string, unknown>>(tableName: string, rows: T[]): Promise<T[]> {
    if (!rows.length) return [];
    const res = await this.req(`/api/database/records/${tableName}`, {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify(rows),
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      throw new Error(`InsForge insert(${tableName}) HTTP ${res.status}: ${txt.slice(0, 300)}`);
    }
    return (await res.json()) as T[];
  }

  async getRecords(tableName: string, query = ""): Promise<unknown[]> {
    const res = await this.req(`/api/database/records/${tableName}${query ? `?${query}` : ""}`);
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      throw new Error(`InsForge get(${tableName}) HTTP ${res.status}: ${txt.slice(0, 300)}`);
    }
    return (await res.json()) as unknown[];
  }

  /** Map a BuildPlan field to an InsForge column, or null to skip (auto fields). */
  private columnFromField(f: PlanField): InsForgeColumn | null {
    if (AUTO_FIELDS.has(f.name.toLowerCase())) return null;
    return {
      columnName: f.name,
      type: TYPE_MAP[f.type] ?? "string",
      isNullable: !f.required,
      isUnique: Boolean(f.unique),
    };
  }

  /**
   * Provision every data model in a plan as a prefixed table (t_<slug>_<entity>).
   * Idempotent: tables that already exist are skipped.
   */
  async provisionPlan(toolSlug: string, plan: BuildPlan): Promise<ProvisionResult> {
    const existing = new Set(await this.listTables());
    const result: ProvisionResult = { tables: {}, created: [], skipped: [] };

    for (const model of plan.dataModels) {
      const table = makeTableName(toolSlug, model.name);
      result.tables[model.name] = table;
      if (existing.has(table)) {
        result.skipped.push(table);
        continue;
      }
      const columns = model.fields
        .map((f) => this.columnFromField(f))
        .filter((c): c is InsForgeColumn => c !== null);
      // Guarantee at least one column besides the auto fields.
      if (columns.length === 0) {
        columns.push({ columnName: "name", type: "string", isNullable: true, isUnique: false });
      }
      await this.createTable(table, columns, false);
      result.created.push(table);
    }
    return result;
  }
}
