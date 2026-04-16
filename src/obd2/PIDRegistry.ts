/**
 * PID Registry — definitions and decoders for standard OBD2 Mode 01 PIDs.
 *
 * Each entry includes the raw byte decoder function. Decoder input is the
 * data bytes returned by the adapter (header and mode/PID echo already stripped).
 *
 * Reference: SAE J1979 / ISO 15031-5
 */

export interface PIDDefinition {
  /** OBD mode (1 = real-time, 9 = vehicle info, etc.) */
  mode: number;
  /** PID hex code (e.g. 0x0C for RPM) */
  pid: number;
  /** Human-readable name */
  name: string;
  /** Display unit */
  unit: string;
  /** Minimum decoded value */
  minValue: number;
  /** Maximum decoded value */
  maxValue: number;
  /** Decode raw response bytes into a numeric value */
  decode: (bytes: number[]) => number;
  /** Optional: number of decimal places for display */
  decimals?: number;
}

// ---------------------------------------------------------------------------
// Mode 01 — Real-time data
// ---------------------------------------------------------------------------

export const PID_DEFINITIONS: PIDDefinition[] = [
  {
    mode: 0x01,
    pid: 0x04,
    name: "ENGINE_LOAD",
    unit: "%",
    minValue: 0,
    maxValue: 100,
    decode: ([a]) => (a !== undefined ? (a * 100) / 255 : 0),
    decimals: 1,
  },
  {
    mode: 0x01,
    pid: 0x05,
    name: "COOLANT_TEMP",
    unit: "°C",
    minValue: -40,
    maxValue: 215,
    decode: ([a]) => (a !== undefined ? a - 40 : 0),
  },
  {
    mode: 0x01,
    pid: 0x0b,
    name: "INTAKE_PRESSURE",
    unit: "kPa",
    minValue: 0,
    maxValue: 255,
    decode: ([a]) => a ?? 0,
  },
  {
    mode: 0x01,
    pid: 0x0c,
    name: "RPM",
    unit: "RPM",
    minValue: 0,
    maxValue: 16383.75,
    decode: ([a, b]) =>
      a !== undefined && b !== undefined ? (a * 256 + b) / 4 : 0,
    decimals: 0,
  },
  {
    mode: 0x01,
    pid: 0x0d,
    name: "SPEED",
    unit: "km/h",
    minValue: 0,
    maxValue: 255,
    decode: ([a]) => a ?? 0,
  },
  {
    mode: 0x01,
    pid: 0x0e,
    name: "TIMING_ADVANCE",
    unit: "°",
    minValue: -64,
    maxValue: 63.5,
    decode: ([a]) => (a !== undefined ? a / 2 - 64 : 0),
    decimals: 1,
  },
  {
    mode: 0x01,
    pid: 0x0f,
    name: "INTAKE_TEMP",
    unit: "°C",
    minValue: -40,
    maxValue: 215,
    decode: ([a]) => (a !== undefined ? a - 40 : 0),
  },
  {
    mode: 0x01,
    pid: 0x10,
    name: "MAF_RATE",
    unit: "g/s",
    minValue: 0,
    maxValue: 655.35,
    decode: ([a, b]) =>
      a !== undefined && b !== undefined ? (a * 256 + b) / 100 : 0,
    decimals: 2,
  },
  {
    mode: 0x01,
    pid: 0x11,
    name: "THROTTLE",
    unit: "%",
    minValue: 0,
    maxValue: 100,
    decode: ([a]) => (a !== undefined ? (a * 100) / 255 : 0),
    decimals: 1,
  },
  {
    mode: 0x01,
    pid: 0x1f,
    name: "RUN_TIME",
    unit: "s",
    minValue: 0,
    maxValue: 65535,
    decode: ([a, b]) =>
      a !== undefined && b !== undefined ? a * 256 + b : 0,
  },
  {
    mode: 0x01,
    pid: 0x21,
    name: "DIST_MIL_ON",
    unit: "km",
    minValue: 0,
    maxValue: 65535,
    decode: ([a, b]) =>
      a !== undefined && b !== undefined ? a * 256 + b : 0,
  },
  {
    mode: 0x01,
    pid: 0x2f,
    name: "FUEL_LEVEL",
    unit: "%",
    minValue: 0,
    maxValue: 100,
    decode: ([a]) => (a !== undefined ? (a * 100) / 255 : 0),
    decimals: 1,
  },
  {
    mode: 0x01,
    pid: 0x33,
    name: "BARO_PRESSURE",
    unit: "kPa",
    minValue: 0,
    maxValue: 255,
    decode: ([a]) => a ?? 0,
  },
  {
    mode: 0x01,
    pid: 0x42,
    name: "CONTROL_MODULE_VOLTAGE",
    unit: "V",
    minValue: 0,
    maxValue: 65.535,
    decode: ([a, b]) =>
      a !== undefined && b !== undefined ? (a * 256 + b) / 1000 : 0,
    decimals: 3,
  },
  {
    mode: 0x01,
    pid: 0x43,
    name: "ABS_LOAD",
    unit: "%",
    minValue: 0,
    maxValue: 25700,
    decode: ([a, b]) =>
      a !== undefined && b !== undefined
        ? ((a * 256 + b) * 100) / 255
        : 0,
    decimals: 1,
  },
  {
    mode: 0x01,
    pid: 0x46,
    name: "AMBIENT_TEMP",
    unit: "°C",
    minValue: -40,
    maxValue: 215,
    decode: ([a]) => (a !== undefined ? a - 40 : 0),
  },
  {
    mode: 0x01,
    pid: 0x47,
    name: "THROTTLE_B",
    unit: "%",
    minValue: 0,
    maxValue: 100,
    decode: ([a]) => (a !== undefined ? (a * 100) / 255 : 0),
    decimals: 1,
  },
  {
    mode: 0x01,
    pid: 0x5c,
    name: "OIL_TEMP",
    unit: "°C",
    minValue: -40,
    maxValue: 210,
    decode: ([a]) => (a !== undefined ? a - 40 : 0),
  },
  {
    mode: 0x01,
    pid: 0x5e,
    name: "FUEL_RATE",
    unit: "L/h",
    minValue: 0,
    maxValue: 3276.75,
    decode: ([a, b]) =>
      a !== undefined && b !== undefined ? (a * 256 + b) / 20 : 0,
    decimals: 2,
  },
];

// ---------------------------------------------------------------------------
// Index structures for O(1) lookup
// ---------------------------------------------------------------------------

/** Map from PID name → definition */
const byName = new Map<string, PIDDefinition>(
  PID_DEFINITIONS.map((p) => [p.name, p])
);

/** Map from mode+pid key → definition */
const byModeAndPid = new Map<string, PIDDefinition>(
  PID_DEFINITIONS.map((p) => [`${p.mode}:${p.pid}`, p])
);

export function getPIDByName(name: string): PIDDefinition | undefined {
  return byName.get(name);
}

export function getPIDByCode(mode: number, pid: number): PIDDefinition | undefined {
  return byModeAndPid.get(`${mode}:${pid}`);
}

/** Format a command hex string for a given mode/pid: e.g. mode=1, pid=0x0c → "010C" */
export function formatPIDCommand(mode: number, pid: number): string {
  return `${mode.toString(16).toUpperCase().padStart(2, "0")}${pid
    .toString(16)
    .toUpperCase()
    .padStart(2, "0")}`;
}

/**
 * Extract the data bytes from a raw PID response.
 * Mode 01 response format: 41 XX YY ZZ ...
 *   where 41 = 0x40 + mode, XX = PID, YY ZZ = data bytes
 */
export function extractDataBytes(bytes: number[], mode: number, pid: number): number[] {
  const expectedFirst = 0x40 + mode;
  // Find the response header position
  const idx = bytes.findIndex(
    (b, i) => b === expectedFirst && bytes[i + 1] === pid
  );
  if (idx === -1) return bytes; // fallback: return all (might be pre-stripped)
  return bytes.slice(idx + 2);
}
