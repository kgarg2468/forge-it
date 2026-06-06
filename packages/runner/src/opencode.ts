import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import type { RunnerConfig } from "./config.js";
import { childEnv } from "./childenv.js";

export interface OpencodeLog {
  (level: "info" | "success" | "warning" | "error", message: string, step?: string): void;
}

/** Write opencode.json into the sandbox configuring MiniMax as an OpenAI-compatible provider. */
export async function writeOpencodeConfig(dir: string, cfg: RunnerConfig): Promise<void> {
  const config = {
    $schema: "https://opencode.ai/config.json",
    model: `minimax/${cfg.codeModel}`,
    provider: {
      minimax: {
        npm: "@ai-sdk/openai-compatible",
        name: "MiniMax",
        options: {
          baseURL: cfg.minimaxBaseUrl,
          apiKey: "{env:MINIMAX_API_KEY}",
        },
        models: {
          [cfg.codeModel]: {
            name: cfg.codeModel,
            limit: { context: 200000, output: 65536 },
          },
        },
      },
    },
    // Auto-approve all tools — REQUIRED for headless (an "ask" silently blocks).
    permission: { edit: "allow", bash: "allow", webfetch: "allow" },
  };
  await fs.writeFile(path.join(dir, "opencode.json"), JSON.stringify(config, null, 2), "utf8");
}

function basename(p: string): string {
  return p.split(/[\\/]/).pop() || p;
}

/**
 * Map an OpenCode event to a clean build-log line. Handles both the
 * `opencode run --format json` shape (evt.type = "tool_use"|"text"|"step_*",
 * evt.part = {...}) and the SSE shape (evt.type = "message.part.updated",
 * evt.properties.part). Returns null for events we don't want to surface.
 */
function describeEvent(evt: any): { msg: string; level: "info" | "success" | "error" } | null {
  if (!evt || typeof evt !== "object") return null;
  const type: string = evt.type ?? evt.event ?? "";
  const props = evt.properties ?? evt.data ?? evt;
  const part = evt.part ?? props?.part ?? props?.message?.part;

  if (type.includes("error") || props?.error || part?.state?.status === "error") {
    const m = props?.error?.message ?? part?.state?.error ?? props?.message ?? "error";
    return { msg: String(m).slice(0, 300), level: "error" };
  }

  if (part && (part.type === "tool" || part.tool)) {
    // Only log once a tool call completes (avoids noisy partial states).
    const status = part.state?.status;
    if (status && status !== "completed") return null;
    const tool: string = part.tool ?? "tool";
    const input = part.state?.input ?? {};
    if ((tool === "write" || tool === "edit") && input.filePath)
      return { msg: `${tool === "write" ? "Wrote" : "Edited"} ${basename(input.filePath)}`, level: "info" };
    if (tool === "bash" && (input.command || input.cmd))
      return { msg: `Ran: ${(input.command ?? input.cmd).slice(0, 80)}`, level: "info" };
    if (tool === "read" && input.filePath) return { msg: `Read ${basename(input.filePath)}`, level: "info" };
    const title = part.state?.title ?? part.title;
    if (title) return { msg: `${tool}: ${basename(String(title))}`.slice(0, 160), level: "info" };
    return { msg: `${tool} done`, level: "info" };
  }

  if (part?.type === "text" && typeof part.text === "string") {
    const t = part.text
      .replace(/<think>[\s\S]*?<\/think>/gi, "")
      .replace(/<think>[\s\S]*$/i, "")
      .trim()
      .replace(/\s+/g, " ");
    if (t.length > 8) return { msg: t.slice(0, 200), level: "info" };
  }
  return null;
}

/**
 * Run a one-shot OpenCode task in the sandbox, streaming progress via onLog.
 * Uses `opencode run "<prompt>" --format json` and parses stdout line-by-line.
 * Resolves when the process exits.
 */
export async function runOpencodeTask(
  dir: string,
  prompt: string,
  cfg: RunnerConfig,
  onLog: OpencodeLog,
  opts: { timeoutMs?: number } = {},
): Promise<{ ok: boolean; rawTail: string }> {
  const timeoutMs = opts.timeoutMs ?? 10 * 60 * 1000;
  return new Promise((resolve) => {
    const child = spawn(
      cfg.opencodeBin,
      ["run", prompt, "--format", "json", "--model", `minimax/${cfg.codeModel}`],
      {
        cwd: dir,
        // PWD scoped to the sandbox (parent leaks the monorepo path) + MiniMax key.
        env: childEnv(dir, { MINIMAX_API_KEY: cfg.minimaxApiKey }),
        // CRITICAL: stdin must be closed (EOF) or `opencode run` blocks reading it forever.
        stdio: ["ignore", "pipe", "pipe"],
      },
    );

    let buf = "";
    const tail: string[] = [];
    let lastEmit = 0;
    let sawError = false;

    const handleLine = (line: string) => {
      const trimmed = line.trim();
      if (!trimmed) return;
      tail.push(trimmed);
      if (tail.length > 50) tail.shift();
      let evt: any;
      try {
        evt = JSON.parse(trimmed);
      } catch {
        return; // non-JSON noise
      }
      const desc = describeEvent(evt);
      if (desc) {
        if (desc.level === "error") sawError = true;
        // throttle very chatty text streams
        const now = Date.now();
        if (desc.level === "error" || now - lastEmit > 250) {
          onLog(desc.level, desc.msg);
          lastEmit = now;
        }
      }
    };

    child.stdout.on("data", (d) => {
      buf += d.toString();
      const lines = buf.split("\n");
      buf = lines.pop() ?? "";
      for (const l of lines) handleLine(l);
    });
    child.stderr.on("data", (d) => {
      const s = d.toString().trim();
      if (s) {
        tail.push(s);
        if (tail.length > 50) tail.shift();
      }
    });

    const timer = setTimeout(() => {
      onLog("warning", "Build timed out — stopping the agent.");
      child.kill("SIGTERM");
    }, timeoutMs);

    child.on("error", (err) => {
      clearTimeout(timer);
      onLog("error", `Failed to start OpenCode: ${err.message}. Is it installed? (npm i -g opencode-ai)`);
      resolve({ ok: false, rawTail: tail.join("\n") });
    });

    child.on("close", (code) => {
      clearTimeout(timer);
      if (buf.trim()) handleLine(buf);
      const ok = code === 0 && !sawError;
      resolve({ ok, rawTail: tail.join("\n") });
    });
  });
}
