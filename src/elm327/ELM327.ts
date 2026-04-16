/**
 * ELM327 protocol driver.
 *
 * Owns the init sequence, protocol negotiation, and exposes a clean API for
 * sending OBD commands. Sits above the CommandQueue and TransportManager.
 */

import { commandQueue } from "./commandQueue";
import {
  parseRawResponse,
  stripRaw,
  ParsedResponse,
} from "./responseParser";

export interface ELM327Info {
  version: string;
  protocol: string;
  protocolNumber: string;
}

const PROTOCOLS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "A", "B", "C"];

export class ELM327 {
  private _info: ELM327Info | null = null;
  private _initialized = false;

  get info(): ELM327Info | null {
    return this._info;
  }

  get isInitialized(): boolean {
    return this._initialized;
  }

  /**
   * Full ELM327 initialization sequence.
   * Must be called after transport is connected.
   *
   * @param initDelayMs  Optional additional delay after ATZ (some cheap clones need this).
   * @param customCmds   Optional extra AT commands to send after the standard sequence.
   */
  async initialize(
    initDelayMs = 0,
    customCmds: string[] = []
  ): Promise<ELM327Info> {
    this._initialized = false;
    commandQueue.flush("Reinitializing ELM327");

    // 1. Reset
    await this.sendAT("ATZ", { timeoutMs: 5000, retries: 0 });

    if (initDelayMs > 0) {
      await sleep(initDelayMs);
    }

    // 2. Echo off
    await this.sendAT("ATE0");

    // 3. Line-feeds off
    await this.sendAT("ATL0");

    // 4. Spaces off (most efficient for parsing)
    await this.sendAT("ATS0");

    // 5. Headers off (we don't need them for standard PID reads)
    await this.sendAT("ATH0");

    // 6. Auto protocol detection
    await this.sendAT("ATSP0", { timeoutMs: 5000 });

    // 7. Optional custom init commands
    for (const cmd of customCmds) {
      await this.sendAT(cmd);
    }

    // 8. Identify firmware
    const versionResult = await this.sendAT("ATI");
    const version = versionResult.kind === "ok" ? versionResult.data : "unknown";

    // 9. Attempt to detect protocol by sending a known PID
    const protocol = await this.detectProtocol();

    // 10. Read human-readable protocol description
    const protocolDescResult = await this.sendAT("ATDPN");
    const protocolNumber =
      protocolDescResult.kind === "ok" ? protocolDescResult.data.trim() : "0";

    this._info = { version, protocol, protocolNumber };
    this._initialized = true;

    return this._info;
  }

  /**
   * Send a raw OBD2 command (mode + PID hex string) and return the raw response.
   * Throws if not initialized.
   */
  async sendCommand(
    command: string,
    options: { timeoutMs?: number } = {}
  ): Promise<ParsedResponse> {
    if (!this._initialized) {
      throw new Error("ELM327 not initialized. Call initialize() first.");
    }
    const result = await commandQueue.enqueue(command, {
      timeoutMs: options.timeoutMs ?? 2000,
    });
    return parseRawResponse(result.raw, command);
  }

  /**
   * Send an AT command and return the parsed response.
   * Does NOT require initialization (used during the init sequence itself).
   */
  async sendAT(
    command: string,
    options: { timeoutMs?: number; retries?: number } = {}
  ): Promise<ParsedResponse> {
    const result = await commandQueue.enqueue(command, {
      timeoutMs: options.timeoutMs ?? 2000,
      retries: options.retries ?? 2,
    });
    return parseRawResponse(result.raw, command);
  }

  // ---------------------------------------------------------------------------
  // Protocol detection
  // ---------------------------------------------------------------------------

  /**
   * Try to elicit a response from the vehicle using a known PID (mode 01, PID 00
   * = supported PIDs bitmask). Starts with ATSP0 (auto), falls back through
   * protocols 1–C if auto doesn't produce a response within 5s.
   */
  private async detectProtocol(): Promise<string> {
    // Try auto-detected protocol first
    const autoResult = await commandQueue.enqueue("0100", { timeoutMs: 5000, retries: 0 });
    const parsed = parseRawResponse(autoResult.raw);
    if (parsed.kind === "ok") {
      const dpResult = await commandQueue.enqueue("ATDP", { timeoutMs: 2000 });
      return stripRaw(dpResult.raw);
    }

    // Fallback: try each protocol explicitly
    for (const proto of PROTOCOLS) {
      await commandQueue.enqueue(`ATSP${proto}`, { timeoutMs: 2000, retries: 0 });
      const testResult = await commandQueue.enqueue("0100", {
        timeoutMs: 5000,
        retries: 0,
      });
      const testParsed = parseRawResponse(testResult.raw);
      if (testParsed.kind === "ok") {
        const dpResult = await commandQueue.enqueue("ATDP", { timeoutMs: 2000 });
        return stripRaw(dpResult.raw);
      }
    }

    // Last resort: reset to auto
    await commandQueue.enqueue("ATSP0", { timeoutMs: 2000 });
    return "Unknown";
  }
}

export const elm327 = new ELM327();

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
