import { execFile } from "node:child_process";
import { promisify } from "node:util";

const pexec = promisify(execFile);

// ---------------------------------------------------------------------------
// Railway deploy service. For deploying a freshly-generated LOCAL dir, the
// Railway CLI ("railway up") is the right tool — it uploads the dir and builds
// remotely. GraphQL only deploys from repo/image. We shell out to the CLI with
// RAILWAY_TOKEN (project token recommended). Not configured -> caller simulates.
//   railway up --service <name> --detach   (cwd = generated dir)
//   railway domain --service <name>        -> public *.up.railway.app URL
// App must bind 0.0.0.0:$PORT.
// ---------------------------------------------------------------------------

export interface DeployResult {
  ok: boolean;
  url?: string;
  logs: string;
  error?: string;
}

export class RailwayService {
  constructor(
    private cfg: { token: string; projectId?: string },
  ) {}

  get isConfigured(): boolean {
    return Boolean(this.cfg.token);
  }

  private env(): NodeJS.ProcessEnv {
    return { ...process.env, RAILWAY_TOKEN: this.cfg.token };
  }

  async cliAvailable(): Promise<boolean> {
    try {
      await pexec("railway", ["--version"], { env: this.env() });
      return true;
    } catch {
      return false;
    }
  }

  /** Deploy a local directory as a Railway service and return its public URL. */
  async deployDir(dir: string, serviceName: string): Promise<DeployResult> {
    if (!this.isConfigured) return { ok: false, logs: "", error: "Railway not configured" };
    if (!(await this.cliAvailable()))
      return {
        ok: false,
        logs: "",
        error: "Railway CLI not found. Install with: npm i -g @railway/cli",
      };

    let logs = "";
    try {
      // Link to the project if a project id was provided (account token case).
      if (this.cfg.projectId) {
        try {
          const linked = await pexec("railway", ["link", "--project", this.cfg.projectId], {
            cwd: dir,
            env: this.env(),
          });
          logs += linked.stdout + linked.stderr;
        } catch (e) {
          logs += `link: ${String(e)}\n`;
        }
      }

      const up = await pexec("railway", ["up", "--service", serviceName, "--detach"], {
        cwd: dir,
        env: this.env(),
        maxBuffer: 10 * 1024 * 1024,
      });
      logs += up.stdout + up.stderr;

      // Ensure a public domain exists.
      let url: string | undefined;
      try {
        const dom = await pexec("railway", ["domain", "--service", serviceName], {
          cwd: dir,
          env: this.env(),
        });
        logs += dom.stdout + dom.stderr;
        const m = (dom.stdout + dom.stderr).match(/https?:\/\/[^\s"']+\.up\.railway\.app/);
        if (m) url = m[0];
      } catch (e) {
        logs += `domain: ${String(e)}\n`;
      }

      return { ok: true, url, logs };
    } catch (err: any) {
      logs += String(err?.stdout ?? "") + String(err?.stderr ?? "");
      return { ok: false, logs, error: String(err?.message ?? err) };
    }
  }
}
