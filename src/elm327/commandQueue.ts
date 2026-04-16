/**
 * ELM327 Command Queue
 *
 * ELM327 adapters are strictly serial: only one command can be in-flight at a
 * time. This queue ensures that even if callers issue concurrent commands, they
 * are serialized and each waits for the previous response (or timeout) before
 * the next is sent.
 */

import { transportManager } from "../transport/TransportManager";

export interface QueuedCommand {
  command: string;
  timeoutMs: number;
  retries: number;
}

export interface CommandResult {
  raw: string;
  command: string;
  durationMs: number;
}

const DEFAULT_TIMEOUT_MS = 2000;
const DEFAULT_RETRIES = 2;

export class CommandQueue {
  private queue: Array<{
    item: QueuedCommand;
    resolve: (result: CommandResult) => void;
    reject: (err: Error) => void;
  }> = [];
  private processing = false;

  /**
   * Enqueue a command. Returns a promise that resolves with the raw response
   * string when the adapter replies (or rejects on timeout/error).
   */
  enqueue(
    command: string,
    options: Partial<Pick<QueuedCommand, "timeoutMs" | "retries">> = {}
  ): Promise<CommandResult> {
    const item: QueuedCommand = {
      command,
      timeoutMs: options.timeoutMs ?? DEFAULT_TIMEOUT_MS,
      retries: options.retries ?? DEFAULT_RETRIES,
    };

    return new Promise((resolve, reject) => {
      this.queue.push({ item, resolve, reject });
      if (!this.processing) {
        this.processNext();
      }
    });
  }

  /** Drain the queue and reject all pending commands. */
  flush(reason = "Queue flushed"): void {
    const err = new Error(reason);
    for (const entry of this.queue) {
      entry.reject(err);
    }
    this.queue = [];
    this.processing = false;
  }

  get pendingCount(): number {
    return this.queue.length;
  }

  // ---------------------------------------------------------------------------
  // Private
  // ---------------------------------------------------------------------------

  private async processNext(): Promise<void> {
    const entry = this.queue[0];
    if (!entry) {
      this.processing = false;
      return;
    }

    this.processing = true;

    const { item, resolve, reject } = entry;
    let attempt = 0;
    let lastError: Error | null = null;

    while (attempt <= item.retries) {
      try {
        const result = await this.sendWithTimeout(item.command, item.timeoutMs);
        this.queue.shift();
        resolve(result);
        this.processNext();
        return;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        attempt++;
        // Brief pause between retries
        if (attempt <= item.retries) {
          await sleep(200);
        }
      }
    }

    this.queue.shift();
    reject(lastError ?? new Error("Command failed after retries"));
    this.processNext();
  }

  private sendWithTimeout(command: string, timeoutMs: number): Promise<CommandResult> {
    return new Promise((resolve, reject) => {
      const start = Date.now();
      let settled = false;

      const timer = setTimeout(() => {
        if (!settled) {
          settled = true;
          reject(new Error(`Command "${command}" timed out after ${timeoutMs}ms`));
        }
      }, timeoutMs);

      transportManager
        .send(command)
        .then((raw) => {
          if (!settled) {
            settled = true;
            clearTimeout(timer);
            resolve({ raw, command, durationMs: Date.now() - start });
          }
        })
        .catch((err: Error) => {
          if (!settled) {
            settled = true;
            clearTimeout(timer);
            reject(err);
          }
        });
    });
  }
}

export const commandQueue = new CommandQueue();

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
