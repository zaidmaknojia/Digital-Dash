/**
 * ELM327 response parser.
 *
 * Responsibilities:
 *  - Strip the echo (the command line echoed back when ATE1 is still active
 *    during the ATZ/ATE0 init sequence)
 *  - Remove the trailing ">" prompt
 *  - Strip CR/LF and excess whitespace
 *  - Return SEARCHING... and NO DATA as recognisable sentinel values rather
 *    than throwing so that callers can handle gracefully
 */

export type ParsedResponse =
  | { kind: "ok"; data: string; bytes: number[] }
  | { kind: "no_data" }
  | { kind: "searching" }
  | { kind: "unable_to_connect" }
  | { kind: "error"; message: string };

/** Characters and strings produced by ELM327 that are noise, not data. */
const NOISE_PATTERNS = [
  /^>/gm,          // prompt char
  /\r/g,           // carriage return
  /^\s+/gm,        // leading whitespace per line
  /\s+$/gm,        // trailing whitespace per line
];

/**
 * Strip echo, prompt, whitespace and control characters from a raw ELM327
 * response string.
 *
 * @param raw      The raw bytes received from the adapter after sending a command.
 * @param command  The command that was sent (used to strip echo if ATE0 not yet active).
 */
export function stripRaw(raw: string, command?: string): string {
  let s = raw;

  // Strip echo: if the first non-empty line matches the sent command, remove it
  if (command) {
    const echoPattern = new RegExp(
      `^\\s*${escapeRegExp(command.replace(/\r$/, "").toUpperCase())}\\s*`,
      "i"
    );
    s = s.replace(echoPattern, "");
  }

  // Apply noise patterns
  for (const p of NOISE_PATTERNS) {
    s = s.replace(p, "");
  }

  // Collapse multiple blank lines
  s = s.replace(/\n{2,}/g, "\n").trim();

  return s;
}

/**
 * Parse a stripped ELM327 response into a structured result.
 * Input should have already been passed through `stripRaw`.
 */
export function parseResponse(stripped: string): ParsedResponse {
  const upper = stripped.toUpperCase();

  if (upper === "NO DATA" || upper === "NODATA") {
    return { kind: "no_data" };
  }

  if (upper.includes("SEARCHING")) {
    return { kind: "searching" };
  }

  if (upper === "UNABLE TO CONNECT" || upper === "UNABLETOCONNECT") {
    return { kind: "unable_to_connect" };
  }

  // ELM327 error responses
  if (
    upper === "?" ||
    upper.startsWith("ERROR") ||
    upper.startsWith("BUS ERROR") ||
    upper.startsWith("BUS BUSY") ||
    upper.startsWith("FB ERROR") ||
    upper.startsWith("DATA ERROR") ||
    upper.startsWith("BUFFER FULL") ||
    upper.startsWith("CAN ERROR")
  ) {
    return { kind: "error", message: stripped };
  }

  // Parse hex byte sequence: "41 0C 1A F8" → [0x41, 0x0C, 0x1A, 0xF8]
  const hexTokens = stripped
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter((t) => /^[0-9A-Fa-f]{1,2}$/.test(t));

  const bytes = hexTokens.map((h) => parseInt(h, 16));

  return { kind: "ok", data: stripped, bytes };
}

/**
 * Full pipeline: raw string in, structured result out.
 */
export function parseRawResponse(raw: string, command?: string): ParsedResponse {
  const stripped = stripRaw(raw, command);
  return parseResponse(stripped);
}

/**
 * Parse a multi-line OBD response that may contain multiple frames
 * (e.g. mode 03 DTC response). Returns an array of byte arrays, one per frame.
 */
export function parseMultiFrameResponse(raw: string, command?: string): number[][] {
  const stripped = stripRaw(raw, command);
  const lines = stripped.split("\n").filter((l) => l.trim().length > 0);

  return lines.map((line) =>
    line
      .trim()
      .split(/\s+/)
      .filter((t) => /^[0-9A-Fa-f]{1,2}$/.test(t))
      .map((h) => parseInt(h, 16))
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
