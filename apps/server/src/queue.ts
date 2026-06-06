// Minimal in-process FIFO queue with concurrency 1. The prod swap
// is BullMQ + Redis, but a single worker is plenty for one builder at a time.

type Job = () => Promise<void>;

const queue: Job[] = [];
let running = false;

async function drain(): Promise<void> {
  if (running) return;
  running = true;
  while (queue.length) {
    const job = queue.shift()!;
    try {
      await job();
    } catch (err) {
      console.error("[queue] job failed:", err);
    }
  }
  running = false;
}

export function enqueue(job: Job): void {
  queue.push(job);
  void drain();
}
