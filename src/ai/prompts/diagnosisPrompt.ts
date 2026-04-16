import { DiagnosisContext } from "../types";

/**
 * Build the user turn message that kicks off a diagnosis.
 * Includes all DTCs, relevant PID values, and optional user description.
 */
export function buildDiagnosisUserMessage(context: DiagnosisContext): string {
  const vehicleStr = `${context.vehicle.year} ${context.vehicle.make} ${context.vehicle.model}`;
  const lines: string[] = [];

  lines.push(`## Diagnostic Request — ${vehicleStr}`);
  lines.push("");

  // DTCs
  if (context.dtcs.length > 0) {
    lines.push("### Fault Codes");
    for (const dtc of context.dtcs) {
      const desc = dtc.description ? ` — ${dtc.description}` : "";
      lines.push(`- **${dtc.code}** (${dtc.type})${desc}`);
    }
    lines.push("");
  } else {
    lines.push("### Fault Codes\nNo fault codes present.\n");
  }

  // PID Snapshot — only include interesting values (non-zero or always-relevant)
  const relevantPIDs = filterRelevantPIDs(context.pidSnapshot);
  if (Object.keys(relevantPIDs).length > 0) {
    lines.push("### Live Sensor Data (at time of diagnosis)");
    for (const [name, value] of Object.entries(relevantPIDs)) {
      lines.push(`- ${formatPIDName(name)}: **${value}**`);
    }
    lines.push("");
  }

  // User description
  if (context.userDescription?.trim()) {
    lines.push("### Driver Notes");
    lines.push(context.userDescription.trim());
    lines.push("");
  }

  lines.push(
    "Please analyze the above and provide a comprehensive diagnosis with likely causes, recommended repairs, and cost estimates. Use your tools to search for TSBs, forum discussions, and parts pricing."
  );

  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ALWAYS_RELEVANT_PIDS = new Set([
  "RPM",
  "COOLANT_TEMP",
  "ENGINE_LOAD",
  "THROTTLE",
  "MAF_RATE",
  "FUEL_LEVEL",
  "CONTROL_MODULE_VOLTAGE",
  "OIL_TEMP",
  "INTAKE_TEMP",
]);

function filterRelevantPIDs(
  snapshot: Record<string, number>
): Record<string, number> {
  return Object.fromEntries(
    Object.entries(snapshot).filter(
      ([name, value]) => ALWAYS_RELEVANT_PIDS.has(name) || value !== 0
    )
  );
}

function formatPIDName(name: string): string {
  return name
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
