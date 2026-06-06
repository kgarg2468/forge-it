import type { FastifyReply } from "fastify";
import type { BuildEvent } from "@forgeit/shared";

// Simple per-channel SSE hub. Channels are keyed by jobId (build/edit) or a
// tool-scoped deploy channel ("deploy:<toolId>").
const channels = new Map<string, Set<FastifyReply>>();

export function subscribe(channel: string, reply: FastifyReply): void {
  let set = channels.get(channel);
  if (!set) {
    set = new Set();
    channels.set(channel, set);
  }
  set.add(reply);
  reply.raw.on("close", () => {
    set?.delete(reply);
  });
}

export function publish(channel: string, event: BuildEvent): void {
  const set = channels.get(channel);
  if (!set || set.size === 0) return;
  const payload = `data: ${JSON.stringify(event)}\n\n`;
  for (const reply of set) {
    try {
      reply.raw.write(payload);
    } catch {
      set.delete(reply);
    }
  }
}

export function setupSseHeaders(reply: FastifyReply): void {
  // Take over the raw socket so Fastify doesn't try to send its own response.
  reply.hijack();
  reply.raw.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "Access-Control-Allow-Origin": "*",
  });
  reply.raw.write(": connected\n\n");
}
