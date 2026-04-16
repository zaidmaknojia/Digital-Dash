/**
 * Tool: search_tsb
 *
 * Queries the NHTSA API for:
 *   1. Technical Service Bulletins (complaints endpoint — closest public API)
 *   2. Recalls
 *
 * NHTSA API docs:
 *   https://api.nhtsa.gov/complaints/complaintsByVehicle
 *   https://api.nhtsa.gov/recalls/recallsByVehicle
 */

import { ToolDefinition } from "../types";

const NHTSA_BASE = "https://api.nhtsa.gov";

export interface TSBSearchParams {
  vehicle: string;        // e.g. "2019 BMW 330i"
  dtc_codes: string[];
  symptom?: string;
}

export interface TSBResult {
  id: string;
  title: string;
  url: string;
  type: "recall" | "complaint";
  date?: string;
  description?: string;
}

export async function searchTSB(params: TSBSearchParams): Promise<TSBResult[]> {
  const parsed = parseVehicleString(params.vehicle);
  if (!parsed) {
    return [];
  }

  const { make, model, year } = parsed;

  const [recallResults, complaintResults] = await Promise.allSettled([
    fetchRecalls(make, model, year),
    fetchComplaints(make, model, year),
  ]);

  const results: TSBResult[] = [];

  if (recallResults.status === "fulfilled") {
    results.push(...recallResults.value);
  }

  if (complaintResults.status === "fulfilled") {
    // Filter complaints by DTC codes / symptom if provided
    const filtered = filterByRelevance(
      complaintResults.value,
      params.dtc_codes,
      params.symptom
    );
    results.push(...filtered.slice(0, 5));
  }

  return results;
}

// ---------------------------------------------------------------------------
// NHTSA API helpers
// ---------------------------------------------------------------------------

async function fetchRecalls(
  make: string,
  model: string,
  year: number
): Promise<TSBResult[]> {
  const url = `${NHTSA_BASE}/recalls/recallsByVehicle?make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}&modelYear=${year}`;

  const res = await fetch(url);
  if (!res.ok) return [];

  const json = (await res.json()) as {
    results?: Array<{
      NHTSACampaignNumber: string;
      Component: string;
      Summary: string;
      ReportReceivedDate: string;
    }>;
  };

  return (json.results ?? []).map((r) => ({
    id: r.NHTSACampaignNumber,
    title: r.Component,
    url: `https://www.nhtsa.gov/vehicle-safety/recalls#${r.NHTSACampaignNumber}`,
    type: "recall" as const,
    date: r.ReportReceivedDate,
    description: r.Summary,
  }));
}

async function fetchComplaints(
  make: string,
  model: string,
  year: number
): Promise<TSBResult[]> {
  const url = `${NHTSA_BASE}/complaints/complaintsByVehicle?make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}&modelYear=${year}`;

  const res = await fetch(url);
  if (!res.ok) return [];

  const json = (await res.json()) as {
    results?: Array<{
      odiNumber: number;
      components: string;
      summary: string;
      dateOfIncident: string;
    }>;
  };

  return (json.results ?? []).map((r) => ({
    id: String(r.odiNumber),
    title: r.components,
    url: `https://api.nhtsa.gov/complaints/complaintsByVehicle?make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}&modelYear=${year}`,
    type: "complaint" as const,
    date: r.dateOfIncident ? String(r.dateOfIncident) : undefined,
    description: r.summary,
  }));
}

function filterByRelevance(
  results: TSBResult[],
  dtcCodes: string[],
  symptom?: string
): TSBResult[] {
  if (dtcCodes.length === 0 && !symptom) return results;

  const keywords = [
    ...dtcCodes.map((c) => c.toLowerCase()),
    ...(symptom ? symptom.toLowerCase().split(/\s+/) : []),
  ];

  return results.filter((r) => {
    const text = `${r.title} ${r.description ?? ""}`.toLowerCase();
    return keywords.some((kw) => text.includes(kw));
  });
}

// ---------------------------------------------------------------------------
// Vehicle string parser
// ---------------------------------------------------------------------------

function parseVehicleString(
  vehicle: string
): { year: number; make: string; model: string } | null {
  // Expect format: "YYYY Make Model" e.g. "2019 BMW 330i"
  const match = vehicle.match(/^(\d{4})\s+(\S+)\s+(.+)$/);
  if (!match) return null;
  const [, yearStr, make, model] = match;
  if (!yearStr || !make || !model) return null;
  const year = parseInt(yearStr, 10);
  if (isNaN(year)) return null;
  return { year, make, model };
}

// ---------------------------------------------------------------------------
// Tool definition (used by AIService)
// ---------------------------------------------------------------------------

export const searchTSBToolDef: ToolDefinition = {
  name: "search_tsb",
  description:
    "Search for Technical Service Bulletins and recalls via the NHTSA API. Returns relevant safety campaigns and consumer complaints for the vehicle.",
  parameters: {
    type: "object",
    properties: {
      vehicle: {
        type: "string",
        description: 'Vehicle descriptor in "YEAR MAKE MODEL" format, e.g. "2019 BMW 330i"',
        required: true,
      },
      dtc_codes: {
        type: "array",
        description: "List of DTC codes to correlate with TSBs",
        items: { type: "string" },
        required: true,
      },
      symptom: {
        type: "string",
        description: "Optional symptom description to narrow results",
      },
    },
    required: ["vehicle", "dtc_codes"],
  },
};
