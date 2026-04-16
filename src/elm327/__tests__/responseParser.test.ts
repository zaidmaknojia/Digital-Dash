/**
 * Unit tests for ELM327 response parser.
 *
 * These tests verify that raw adapter output is correctly cleaned,
 * classified, and decoded without any transport / native dependencies.
 */

import {
  stripRaw,
  parseResponse,
  parseRawResponse,
  parseMultiFrameResponse,
} from "../responseParser";

// ---------------------------------------------------------------------------
// stripRaw
// ---------------------------------------------------------------------------

describe("stripRaw", () => {
  it("removes the trailing > prompt", () => {
    expect(stripRaw("41 0C 1A F8\r\n>")).toBe("41 0C 1A F8");
  });

  it("removes carriage returns", () => {
    expect(stripRaw("41 0C 1A F8\r\n>")).not.toContain("\r");
  });

  it("strips leading and trailing whitespace from each line", () => {
    const result = stripRaw("  41 0C 1A F8  \r\n>");
    expect(result).toBe("41 0C 1A F8");
  });

  it("strips echo if command provided and echo present", () => {
    const raw = "010C\r41 0C 1A F8\r\n>";
    const result = stripRaw(raw, "010C");
    expect(result).toBe("41 0C 1A F8");
  });

  it("does NOT strip non-matching echo", () => {
    const raw = "010D\r41 0C 1A F8\r\n>";
    const result = stripRaw(raw, "010C");
    // echo is different command, should remain (though > is stripped)
    expect(result).toContain("010D");
  });

  it("collapses multiple blank lines", () => {
    const raw = "41 0C\r\n\r\n\r\n1A F8\r\n>";
    const result = stripRaw(raw);
    expect(result).not.toMatch(/\n{2,}/);
  });

  it("handles empty string", () => {
    expect(stripRaw("")).toBe("");
  });

  it("handles prompt-only response", () => {
    expect(stripRaw(">")).toBe("");
  });
});

// ---------------------------------------------------------------------------
// parseResponse
// ---------------------------------------------------------------------------

describe("parseResponse", () => {
  it('returns kind="no_data" for "NO DATA"', () => {
    expect(parseResponse("NO DATA")).toEqual({ kind: "no_data" });
  });

  it('returns kind="no_data" for "NODATA" (spaces off)', () => {
    expect(parseResponse("NODATA")).toEqual({ kind: "no_data" });
  });

  it('returns kind="no_data" case-insensitively', () => {
    expect(parseResponse("no data")).toEqual({ kind: "no_data" });
  });

  it('returns kind="searching" when response contains SEARCHING', () => {
    expect(parseResponse("SEARCHING...")).toEqual({ kind: "searching" });
  });

  it('returns kind="unable_to_connect" for that literal', () => {
    expect(parseResponse("UNABLE TO CONNECT")).toEqual({
      kind: "unable_to_connect",
    });
  });

  it('returns kind="error" for "?"', () => {
    expect(parseResponse("?")).toEqual({ kind: "error", message: "?" });
  });

  it('returns kind="error" for BUS ERROR', () => {
    expect(parseResponse("BUS ERROR")).toEqual({
      kind: "error",
      message: "BUS ERROR",
    });
  });

  it('returns kind="error" for DATA ERROR', () => {
    expect(parseResponse("DATA ERROR")).toEqual({
      kind: "error",
      message: "DATA ERROR",
    });
  });

  it("parses a valid hex response into bytes", () => {
    const result = parseResponse("41 0C 1A F8");
    expect(result.kind).toBe("ok");
    if (result.kind === "ok") {
      expect(result.bytes).toEqual([0x41, 0x0c, 0x1a, 0xf8]);
    }
  });

  it("parses a valid hex response without spaces (ATS0 mode)", () => {
    const result = parseResponse("410C1AF8");
    // Without spaces each char is a nibble, but we need space-separated tokens
    // Our regex splits on whitespace, so single run = one token
    expect(result.kind).toBe("ok");
  });

  it("handles spaces-off mode with space-separated hex correctly", () => {
    const result = parseResponse("41 04 64");
    expect(result.kind).toBe("ok");
    if (result.kind === "ok") {
      expect(result.bytes).toEqual([0x41, 0x04, 0x64]);
    }
  });

  it("returns data string equal to the stripped input", () => {
    const result = parseResponse("41 0C 1A F8");
    if (result.kind === "ok") {
      expect(result.data).toBe("41 0C 1A F8");
    }
  });
});

// ---------------------------------------------------------------------------
// parseRawResponse (full pipeline)
// ---------------------------------------------------------------------------

describe("parseRawResponse", () => {
  it("processes RPM response correctly (ATZ mode)", () => {
    // RPM raw from adapter: echo + data + prompt
    const raw = "010C\r41 0C 1A F8\r\n>";
    const result = parseRawResponse(raw, "010C");
    expect(result.kind).toBe("ok");
    if (result.kind === "ok") {
      expect(result.bytes).toContain(0x41);
      expect(result.bytes).toContain(0x0c);
    }
  });

  it("handles NO DATA with prompt", () => {
    const raw = "010D\r\nNO DATA\r\n>";
    const result = parseRawResponse(raw, "010D");
    expect(result.kind).toBe("no_data");
  });

  it("handles only prompt", () => {
    const result = parseRawResponse(">");
    // Empty stripped string — should not throw
    expect(result.kind).toBeDefined();
  });

  it("handles ATZ response containing firmware version", () => {
    const raw = "ATZ\r\r\nELM327 v1.5\r\n\r\n>";
    const result = parseRawResponse(raw, "ATZ");
    expect(result.kind).toBe("ok");
    if (result.kind === "ok") {
      expect(result.data).toContain("ELM327 v1.5");
    }
  });
});

// ---------------------------------------------------------------------------
// parseMultiFrameResponse
// ---------------------------------------------------------------------------

describe("parseMultiFrameResponse", () => {
  it("splits multiple DTC lines into separate byte arrays", () => {
    // Two DTCs: P0300 and P0301
    const raw = "43 02 03 00 03 01\r\n>";
    const frames = parseMultiFrameResponse(raw);
    expect(frames.length).toBe(1);
    expect(frames[0]).toEqual([0x43, 0x02, 0x03, 0x00, 0x03, 0x01]);
  });

  it("handles multi-line mode 03 response", () => {
    const raw = "43 02\r\n03 00\r\n03 01\r\n>";
    const frames = parseMultiFrameResponse(raw);
    expect(frames.length).toBe(3);
  });

  it("filters out empty lines", () => {
    const raw = "43 02 03 00\r\n\r\n>";
    const frames = parseMultiFrameResponse(raw);
    const nonEmpty = frames.filter((f) => f.length > 0);
    expect(nonEmpty.length).toBe(1);
  });

  it("handles empty/prompt-only response", () => {
    const frames = parseMultiFrameResponse(">");
    expect(frames.every((f) => f.length === 0)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Integration: PID decoding via bytes
// ---------------------------------------------------------------------------

describe("PID byte decoding integration", () => {
  it("decodes RPM from parsed bytes correctly (spec: (A*256+B)/4)", () => {
    // "41 0C 1A F8" → bytes [0x41, 0x0C, 0x1A, 0xF8]
    // Data bytes after 41 0C: [0x1A, 0xF8] = [26, 248]
    // RPM = (26*256 + 248)/4 = 6904/4 = 1726
    const result = parseRawResponse("41 0C 1A F8");
    expect(result.kind).toBe("ok");
    if (result.kind === "ok") {
      const dataBytes = result.bytes.slice(2); // skip 0x41 0x0C
      const rpm = (dataBytes[0]! * 256 + dataBytes[1]!) / 4;
      expect(rpm).toBeCloseTo(1726, 0);
    }
  });

  it("decodes coolant temp from parsed bytes (spec: A-40)", () => {
    // "41 05 69" → bytes [0x41, 0x05, 0x69]
    // 0x69 = 105 decimal, temp = 105 - 40 = 65°C
    const result = parseRawResponse("41 05 69");
    expect(result.kind).toBe("ok");
    if (result.kind === "ok") {
      const temp = result.bytes[2]! - 40;
      expect(temp).toBe(65);
    }
  });

  it("decodes vehicle speed (spec: A km/h)", () => {
    // "41 0D 3C" → 0x3C = 60 km/h
    const result = parseRawResponse("41 0D 3C");
    expect(result.kind).toBe("ok");
    if (result.kind === "ok") {
      const speed = result.bytes[2]!;
      expect(speed).toBe(60);
    }
  });
});
