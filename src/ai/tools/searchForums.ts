/**
 * Tool: search_forums
 *
 * Uses SerpAPI to search automotive forums for DTC symptoms and fixes.
 * Targets: Reddit r/MechanicAdvice, BimmerForums, Ford-Trucks, etc.
 *
 * Requires SERP_API_KEY in secure storage.
 */

import * as SecureStore from "expo-secure-store";
import { ToolDefinition } from "../types";

const SERP_API_BASE = "https://serpapi.com/search.json";

export interface ForumSearchParams {
  query: string;
  vehicle: string;
  dtc_codes?: string[];
}

export interface ForumResult {
  title: string;
  url: string;
  snippet: string;
  source: string;
}

export async function searchForums(
  params: ForumSearchParams
): Promise<ForumResult[]> {
  const apiKey = await SecureStore.getItemAsync("SERP_API_KEY");
  if (!apiKey) {
    return [
      {
        title: "API key not configured",
        url: "",
        snippet:
          "Configure a SerpAPI key in Settings → API Keys to enable forum search.",
        source: "system",
      },
    ];
  }

  const dtcPart = (params.dtc_codes ?? []).join(" ");
  const q = `${params.vehicle} ${dtcPart} ${params.query} site:reddit.com OR site:bimmerforums.com OR site:ford-trucks.com OR site:tacoma.world`;

  const url = new URL(SERP_API_BASE);
  url.searchParams.set("q", q);
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("engine", "google");
  url.searchParams.set("num", "8");

  const res = await fetch(url.toString());
  if (!res.ok) return [];

  const json = (await res.json()) as {
    organic_results?: Array<{
      title: string;
      link: string;
      snippet: string;
      displayed_link: string;
    }>;
  };

  return (json.organic_results ?? []).map((r) => ({
    title: r.title,
    url: r.link,
    snippet: r.snippet,
    source: r.displayed_link,
  }));
}

export const searchForumsToolDef: ToolDefinition = {
  name: "search_forums",
  description:
    "Search automotive forums (Reddit r/MechanicAdvice, BimmerForums, Ford-Trucks, etc.) for DTCs and symptoms specific to a vehicle",
  parameters: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "Search query describing the symptom or fault",
        required: true,
      },
      vehicle: {
        type: "string",
        description: 'Vehicle descriptor e.g. "2019 BMW 330i"',
        required: true,
      },
      dtc_codes: {
        type: "array",
        description: "Optional list of DTC codes to include in the search",
        items: { type: "string" },
      },
    },
    required: ["query", "vehicle"],
  },
};
