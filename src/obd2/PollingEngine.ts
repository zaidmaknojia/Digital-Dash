/**
 * PollingEngine — priority-queue-based real-time PID polling.
 *
 * PIDs are grouped into frequency buckets (Hz). The engine cycles through
 * buckets, interleaving PIDs so no bucket starves. The ELM327 serial
 * constraint is respected via the CommandQueue.
 *
 * Pauses automatically when the app enters the background (AppState listener).
 */

import { AppState, AppStateStatus } from "react-native";
import { elm327 } from "../elm327/ELM327";
import {
  getPIDByName,
  formatPIDCommand,
  extractDataBytes,
  PIDDefinition,
} from "./PIDRegistry";
import { useDiagnosticsStore } from "../store/diagnosticsStore";

export interface PollConfig {
  pidName: string;
  /** Polling frequency in Hz (e.g. 5 = 5 times per second, 0.5 = once every 2s) */
  hz: number;
}

interface ScheduledPID {
  definition: PIDDefinition;
  hz: number;
  nextTickMs: number;
}

export class PollingEngine {
  private scheduled: ScheduledPID[] = [];
  private running = false;
  private loopHandle: ReturnType<typeof setTimeout> | null = null;
  private appStateSubscription: ReturnType<typeof AppState.addEventListener> | null = null;

  /** Configure which PIDs to poll and at what frequency. */
  configure(configs: PollConfig[]): void {
    this.scheduled = [];
    for (const cfg of configs) {
      const definition = getPIDByName(cfg.pidName);
      if (!definition) {
        console.warn(`PollingEngine: unknown PID "${cfg.pidName}"`);
        continue;
      }
      this.scheduled.push({
        definition,
        hz: cfg.hz,
        nextTickMs: 0,
      });
    }
  }

  /** Start polling. Idempotent. */
  start(): void {
    if (this.running) return;
    this.running = true;

    this.appStateSubscription = AppState.addEventListener(
      "change",
      this.handleAppStateChange
    );

    this.scheduleNext();
  }

  /** Stop polling and clear the schedule. */
  stop(): void {
    this.running = false;
    if (this.loopHandle) {
      clearTimeout(this.loopHandle);
      this.loopHandle = null;
    }
    this.appStateSubscription?.remove();
    this.appStateSubscription = null;
  }

  // ---------------------------------------------------------------------------
  // Private
  // ---------------------------------------------------------------------------

  private handleAppStateChange = (nextState: AppStateStatus): void => {
    if (nextState === "background" || nextState === "inactive") {
      this.pause();
    } else if (nextState === "active") {
      this.resume();
    }
  };

  private paused = false;

  private pause(): void {
    this.paused = true;
    if (this.loopHandle) {
      clearTimeout(this.loopHandle);
      this.loopHandle = null;
    }
  }

  private resume(): void {
    if (!this.paused) return;
    this.paused = false;
    if (this.running) {
      this.scheduleNext();
    }
  }

  private scheduleNext(): void {
    if (!this.running || this.paused) return;

    const now = Date.now();

    // Find the PID that is due soonest
    let earliest: ScheduledPID | null = null;
    for (const pid of this.scheduled) {
      if (!earliest || pid.nextTickMs < earliest.nextTickMs) {
        earliest = pid;
      }
    }

    if (!earliest) return;

    const delay = Math.max(0, earliest.nextTickMs - now);
    const target = earliest;

    this.loopHandle = setTimeout(async () => {
      if (!this.running || this.paused) return;

      await this.pollPID(target);
      target.nextTickMs = Date.now() + Math.round(1000 / target.hz);
      this.scheduleNext();
    }, delay);
  }

  private async pollPID(pid: ScheduledPID): Promise<void> {
    try {
      const command = formatPIDCommand(pid.definition.mode, pid.definition.pid);
      const result = await elm327.sendCommand(command);

      if (result.kind !== "ok" || result.bytes.length === 0) return;

      const dataBytes = extractDataBytes(
        result.bytes,
        pid.definition.mode,
        pid.definition.pid
      );
      const value = pid.definition.decode(dataBytes);

      useDiagnosticsStore.getState().updatePIDValue(pid.definition.name, value);
    } catch {
      // Log silently — don't crash the polling loop on a transient error
    }
  }
}

export const pollingEngine = new PollingEngine();
