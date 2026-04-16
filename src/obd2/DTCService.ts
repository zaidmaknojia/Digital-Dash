/**
 * DTCService — reads and clears Diagnostic Trouble Codes.
 *
 * Modes used:
 *   03 — stored DTCs
 *   07 — pending DTCs
 *   0A — permanent DTCs
 *   04 — clear all DTCs
 *
 * DTC encoding (SAE J2012):
 *   Two bytes per code. First nibble of first byte encodes system:
 *     0 = P (Powertrain)
 *     1 = C (Chassis)
 *     2 = B (Body)
 *     3 = U (Network)
 *   Second nibble + second byte = remaining 4 hex digits.
 */

import { elm327 } from "../elm327/ELM327";
import { parseMultiFrameResponse } from "../elm327/responseParser";
import { DTC_DESCRIPTIONS } from "../../constants/dtcDescriptions";

export type DTCType = "stored" | "pending" | "permanent";

export interface DecodedDTC {
  code: string;
  type: DTCType;
  description: string;
  isManufacturerSpecific: boolean;
}

const MODE_COMMANDS: Record<DTCType, string> = {
  stored: "03",
  pending: "07",
  permanent: "0A",
};

export class DTCService {
  /**
   * Read DTCs of a specific type.
   */
  async readDTCs(type: DTCType): Promise<DecodedDTC[]> {
    const command = MODE_COMMANDS[type];
    const result = await elm327.sendCommand(command, { timeoutMs: 5000 });

    if (result.kind !== "ok" || result.bytes.length === 0) {
      return [];
    }

    // Multi-frame response: each frame may carry multiple DTC pairs
    const frames = parseMultiFrameResponse(result.data);
    return this.decodeDTCFrames(frames, type);
  }

  /**
   * Read all DTC types simultaneously.
   */
  async readAllDTCs(): Promise<{
    stored: DecodedDTC[];
    pending: DecodedDTC[];
    permanent: DecodedDTC[];
  }> {
    const [stored, pending, permanent] = await Promise.all([
      this.readDTCs("stored"),
      this.readDTCs("pending"),
      this.readDTCs("permanent"),
    ]);
    return { stored, pending, permanent };
  }

  /**
   * Clear all stored, pending, and permanent DTCs (Mode 04).
   * IMPORTANT: This cannot be undone. Callers must obtain user confirmation
   * before invoking and log cleared codes to session history.
   */
  async clearDTCs(): Promise<void> {
    const result = await elm327.sendCommand("04", { timeoutMs: 5000 });
    if (result.kind === "error") {
      throw new Error(`Failed to clear DTCs: ${result.message}`);
    }
  }

  // ---------------------------------------------------------------------------
  // Decoding
  // ---------------------------------------------------------------------------

  private decodeDTCFrames(
    frames: number[][],
    type: DTCType
  ): DecodedDTC[] {
    const dtcs: DecodedDTC[] = [];

    for (const frame of frames) {
      // Response header: 43 = Mode 03 response, etc. Skip it.
      // Remaining bytes come in pairs
      const data = this.stripModeHeader(frame);

      for (let i = 0; i + 1 < data.length; i += 2) {
        const high = data[i] ?? 0;
        const low = data[i + 1] ?? 0;

        // Skip padding bytes (0x00 0x00)
        if (high === 0 && low === 0) continue;

        const code = this.bytesToDTCCode(high, low);
        const description = this.lookupDescription(code);
        const isManufacturerSpecific =
          code.startsWith("P1") ||
          code.startsWith("P3") ||
          code.startsWith("C1") ||
          code.startsWith("C3") ||
          code.startsWith("B1") ||
          code.startsWith("B3") ||
          code.startsWith("U1") ||
          code.startsWith("U3");

        dtcs.push({ code, type, description, isManufacturerSpecific });
      }
    }

    return dtcs;
  }

  /**
   * Strip the mode response header byte(s).
   * Mode 03 response starts with 0x43, mode 07 with 0x47, mode 0A with 0x4A.
   * The next byte is the count of DTCs.
   */
  private stripModeHeader(frame: number[]): number[] {
    if (frame.length < 2) return [];
    const firstByte = frame[0] ?? 0;
    // Response mode bytes: 0x43, 0x47, 0x4A
    if (firstByte === 0x43 || firstByte === 0x47 || firstByte === 0x4a) {
      return frame.slice(2); // skip mode byte + count byte
    }
    return frame;
  }

  private bytesToDTCCode(high: number, low: number): string {
    const systems = ["P", "C", "B", "U"];
    const systemIndex = (high >> 6) & 0x03;
    const systemChar = systems[systemIndex] ?? "P";

    const digit1 = (high >> 4) & 0x03;
    const digit2 = high & 0x0f;
    const digit3 = (low >> 4) & 0x0f;
    const digit4 = low & 0x0f;

    return `${systemChar}${digit1}${digit2.toString(16).toUpperCase()}${digit3.toString(16).toUpperCase()}${digit4.toString(16).toUpperCase()}`;
  }

  private lookupDescription(code: string): string {
    return (
      (DTC_DESCRIPTIONS as Record<string, string>)[code] ??
      `Unknown fault code (${code}). AI diagnostic analysis available.`
    );
  }
}

export const dtcService = new DTCService();
