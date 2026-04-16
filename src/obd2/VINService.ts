/**
 * VINService — reads the Vehicle Identification Number via OBD2 Mode 09 PID 02.
 *
 * The VIN is returned across multiple frames. Each frame carries 3 ASCII bytes
 * after a mode/PID/index header. We reassemble all frames and strip headers.
 */

import { elm327 } from "../elm327/ELM327";
import { parseMultiFrameResponse } from "../elm327/responseParser";

export interface VINDecodeResult {
  vin: string;
  year?: number;
  make?: string;
  model?: string;
}

export class VINService {
  /**
   * Read the VIN from the vehicle ECU.
   * Returns null if the vehicle does not support this PID or the response is invalid.
   */
  async readVIN(): Promise<string | null> {
    const result = await elm327.sendCommand("0902", { timeoutMs: 8000 });

    if (result.kind !== "ok" || result.bytes.length === 0) {
      return null;
    }

    return this.parseVINResponse(result.data);
  }

  /**
   * Decode a WMI/VDS/VIS from a raw VIN string.
   * Returns a partial decode — year/make/model require a lookup table.
   */
  decodeVIN(vin: string): VINDecodeResult {
    if (vin.length !== 17) {
      return { vin };
    }

    const year = this.decodeModelYear(vin.charAt(9));

    return { vin, year };
  }

  // ---------------------------------------------------------------------------
  // Private
  // ---------------------------------------------------------------------------

  private parseVINResponse(raw: string): string | null {
    const frames = parseMultiFrameResponse(raw);
    const vinBytes: number[] = [];

    for (const frame of frames) {
      // Mode 09 response header: 49 02 XX (service 09, PID 02, frame index)
      // Find the header and strip it
      let dataStart = 0;
      for (let i = 0; i < frame.length - 1; i++) {
        if (frame[i] === 0x49 && frame[i + 1] === 0x02) {
          dataStart = i + 3; // skip 49 02 <index>
          break;
        }
      }

      for (let j = dataStart; j < frame.length; j++) {
        const byte = frame[j] ?? 0;
        if (byte !== 0x00) {
          vinBytes.push(byte);
        }
      }
    }

    if (vinBytes.length < 17) return null;

    const vin = String.fromCharCode(...vinBytes.slice(0, 17));

    // Validate: VINs must be alphanumeric, no I O Q
    if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(vin)) {
      return null;
    }

    return vin;
  }

  private decodeModelYear(char: string): number | undefined {
    const yearMap: Record<string, number> = {
      A: 1980, B: 1981, C: 1982, D: 1983, E: 1984, F: 1985, G: 1986,
      H: 1987, J: 1988, K: 1989, L: 1990, M: 1991, N: 1992, P: 1993,
      R: 1994, S: 1995, T: 1996, V: 1997, W: 1998, X: 1999, Y: 2000,
      1: 2001, 2: 2002, 3: 2003, 4: 2004, 5: 2005, 6: 2006, 7: 2007,
      8: 2008, 9: 2009, A2: 2010, B2: 2011, C2: 2012, D2: 2013,
      E2: 2014, F2: 2015, G2: 2016, H2: 2017, J2: 2018, K2: 2019,
      L2: 2020, M2: 2021, N2: 2022, P2: 2023, R2: 2024, S2: 2025,
    };
    return yearMap[char];
  }
}

export const vinService = new VINService();
