import type { BuildJobStatus, LogLevel } from "./enums.js";

// Events streamed from the server to the live builder over SSE.
export type BuildEvent =
  | { kind: "log"; level: LogLevel; message: string; step?: string; ts: number }
  | { kind: "status"; status: BuildJobStatus; currentStep?: string; ts: number }
  | { kind: "preview_ready"; url: string; ts: number }
  | { kind: "file"; path: string; action: "created" | "edited" | "deleted"; ts: number }
  | { kind: "done"; ok: boolean; ts: number };

export function logEvent(level: LogLevel, message: string, step?: string): BuildEvent {
  return { kind: "log", level, message, step, ts: Date.now() };
}
