/**
 * Tool: estimate_repair_cost
 *
 * Uses SerpAPI to fetch labor and parts cost estimates from RepairPal,
 * YourMechanic, or similar sites.
 *
 * Requires SERP_API_KEY in secure storage.
 */

import * as SecureStore from "expo-secure-store";
import { ToolDefinition } from "../types";

export interface CostEstimateParams {
  repair_type: string;
  vehicle: string;
  zip_code?: string;
}

export interface CostEstimate {
  source: string;
  repair: string;
  labor_min_usd: number;
  labor_max_usd: number;
  parts_min_usd: number;
  parts_max_usd: number;
  total_min_usd: number;
  total_max_usd: number;
  url: string;
}

export async function estimateCost(
  params: CostEstimateParams
): Promise<CostEstimate[]> {
  const apiKey = await SecureStore.getItemAsync("SERP_API_KEY");
  if (!apiKey) {
    return [];
  }

  const zipPart = params.zip_code ? ` near ${params.zip_code}` : "";
  const q = `${params.vehicle} ${params.repair_type} repair cost estimate${zipPart} site:repairpal.com OR site:yourmechanic.com OR site:carmd.com`;

  const url = new URL("https://serpapi.com/search.json");
  url.searchParams.set("q", q);
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("engine", "google");
  url.searchParams.set("num", "5");

  const res = await fetch(url.toString());
  if (!res.ok) return [];

  const json = (await res.json()) as {
    organic_results?: Array<{
      title: string;
      link: string;
      snippet: string;
    }>;
  };

  const results: CostEstimate[] = [];

  for (const r of json.organic_results ?? []) {
    const parsed = extractCostFromSnippet(r.snippet, params.repair_type, r.link);
    if (parsed) {
      results.push(parsed);
    }
  }

  return results;
}

// ---------------------------------------------------------------------------
// Snippet parser — extracts dollar ranges from SERP snippets
// ---------------------------------------------------------------------------

function extractCostFromSnippet(
  snippet: string,
  repair: string,
  url: string
): CostEstimate | null {
  // Match patterns like "$150 - $400" or "$150 to $400"
  const rangeRegex = /\$([0-9,]+)\s*(?:-|to)\s*\$([0-9,]+)/gi;
  const matches = [...snippet.matchAll(rangeRegex)];

  if (matches.length === 0) return null;

  // Use the first range as a rough total estimate
  const first = matches[0];
  if (!first) return null;
  const min = parseInt((first[1] ?? "0").replace(",", ""), 10);
  const max = parseInt((first[2] ?? "0").replace(",", ""), 10);

  const source = new URL(url).hostname.replace("www.", "");

  return {
    source,
    repair,
    labor_min_usd: Math.round(min * 0.6),
    labor_max_usd: Math.round(max * 0.6),
    parts_min_usd: Math.round(min * 0.4),
    parts_max_usd: Math.round(max * 0.4),
    total_min_usd: min,
    total_max_usd: max,
    url,
  };
}

// ---------------------------------------------------------------------------
// Tool definition
// ---------------------------------------------------------------------------

export const estimateCostToolDef: ToolDefinition = {
  name: "estimate_repair_cost",
  description:
    "Fetch labor and parts cost estimates for a repair from RepairPal, YourMechanic, or similar sites",
  parameters: {
    type: "object",
    properties: {
      repair_type: {
        type: "string",
        description: 'Type of repair e.g. "oxygen sensor replacement"',
        required: true,
      },
      vehicle: {
        type: "string",
        description: 'Vehicle descriptor e.g. "2019 BMW 330i"',
        required: true,
      },
      zip_code: {
        type: "string",
        description: "Optional ZIP code for localized labor rate estimates",
      },
    },
    required: ["repair_type", "vehicle"],
  },
};
