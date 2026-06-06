import { useEffect, useRef, useState } from "react";
import type { BuildEvent } from "@/types";

export interface SseHandlers {
  onEvent?: (event: BuildEvent) => void;
  onOpen?: () => void;
  onError?: (err: Event) => void;
}

/**
 * Subscribe to a Server-Sent-Events endpoint emitting JSON BuildEvents.
 * Each `data:` line is parsed as a BuildEvent. Returns a disposer.
 */
export function subscribeSse(url: string, handlers: SseHandlers): () => void {
  const source = new EventSource(url);

  source.onopen = () => handlers.onOpen?.();

  source.onmessage = (msg) => {
    if (!msg.data) return;
    try {
      const parsed = JSON.parse(msg.data) as BuildEvent;
      handlers.onEvent?.(parsed);
    } catch {
      // Ignore keep-alive / non-JSON frames.
    }
  };

  source.onerror = (err) => {
    handlers.onError?.(err);
  };

  return () => {
    source.close();
  };
}

export interface UseBuildStreamState {
  events: BuildEvent[];
  connected: boolean;
  done: boolean;
  ok: boolean | null;
}

/**
 * React hook that opens an SSE stream for the given URL and accumulates events.
 * Pass `null` to keep the stream closed. Reopens when the URL changes (e.g.
 * after a chat follow-up swaps the jobId), and the backend replays past logs.
 */
export function useBuildStream(url: string | null): UseBuildStreamState {
  const [events, setEvents] = useState<BuildEvent[]>([]);
  const [connected, setConnected] = useState(false);
  const [done, setDone] = useState(false);
  const [ok, setOk] = useState<boolean | null>(null);
  const urlRef = useRef<string | null>(null);

  useEffect(() => {
    if (!url) return;
    // Fresh stream — reset accumulated state.
    urlRef.current = url;
    setEvents([]);
    setConnected(false);
    setDone(false);
    setOk(null);

    const dispose = subscribeSse(url, {
      onOpen: () => setConnected(true),
      onEvent: (event) => {
        setEvents((prev) => [...prev, event]);
        if (event.kind === "done") {
          setDone(true);
          setOk(event.ok);
        }
      },
      onError: () => setConnected(false),
    });

    return dispose;
  }, [url]);

  return { events, connected, done, ok };
}
