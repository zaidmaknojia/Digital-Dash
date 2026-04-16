/**
 * Tool: search_parts
 *
 * Queries the eBay Motors API for parts pricing and availability.
 * Falls back to SerpAPI-powered search if eBay API key is not configured.
 *
 * Requires EBAY_APP_ID or SERP_API_KEY in secure storage.
 */

import * as SecureStore from "expo-secure-store";
import { ToolDefinition } from "../types";

const EBAY_FINDING_API =
  "https://svcs.ebay.com/services/search/FindingService/v1";

export interface PartsSearchParams {
  part_name: string;
  vehicle: string;
  preference?: "oem" | "aftermarket" | "both";
}

export interface PartResult {
  name: string;
  price: string;
  seller: string;
  url: string;
  condition: string;
  source: "ebay" | "serp";
}

export async function searchParts(
  params: PartsSearchParams
): Promise<PartResult[]> {
  const ebayAppId = await SecureStore.getItemAsync("EBAY_APP_ID");

  if (ebayAppId) {
    return searchEbay(params, ebayAppId);
  }

  // Fallback: SerpAPI
  const serpKey = await SecureStore.getItemAsync("SERP_API_KEY");
  if (serpKey) {
    return searchPartsSerpAPI(params, serpKey);
  }

  return [
    {
      name: "API keys not configured",
      price: "N/A",
      seller: "system",
      url: "",
      condition: "N/A",
      source: "serp",
    },
  ];
}

// ---------------------------------------------------------------------------
// eBay Finding API
// ---------------------------------------------------------------------------

async function searchEbay(
  params: PartsSearchParams,
  appId: string
): Promise<PartResult[]> {
  const preference = params.preference ?? "both";
  const conditionFilter =
    preference === "oem"
      ? "&itemFilter(0).name=Condition&itemFilter(0).value=New"
      : "";

  const keywords = encodeURIComponent(
    `${params.vehicle} ${params.part_name} OBD2`
  );

  const url =
    `${EBAY_FINDING_API}` +
    `?OPERATION-NAME=findItemsByKeywords` +
    `&SERVICE-VERSION=1.13.0` +
    `&SECURITY-APPNAME=${appId}` +
    `&RESPONSE-DATA-FORMAT=JSON` +
    `&keywords=${keywords}` +
    `&categoryId=33743` + // eBay Motors → Parts & Accessories
    `&paginationInput.entriesPerPage=5` +
    conditionFilter;

  const res = await fetch(url);
  if (!res.ok) return [];

  const json = (await res.json()) as {
    findItemsByKeywordsResponse?: Array<{
      searchResult?: Array<{
        item?: Array<{
          title?: string[];
          sellingStatus?: Array<{ currentPrice?: Array<{ __value__?: string }> }>;
          sellerInfo?: Array<{ sellerUserName?: string[] }>;
          viewItemURL?: string[];
          condition?: Array<{ conditionDisplayName?: string[] }>;
        }>;
      }>;
    }>;
  };

  const items =
    json.findItemsByKeywordsResponse?.[0]?.searchResult?.[0]?.item ?? [];

  return items.map((item) => ({
    name: item.title?.[0] ?? params.part_name,
    price: item.sellingStatus?.[0]?.currentPrice?.[0]?.["__value__"]
      ? `$${item.sellingStatus[0].currentPrice[0]["__value__"]}`
      : "N/A",
    seller: item.sellerInfo?.[0]?.sellerUserName?.[0] ?? "Unknown",
    url: item.viewItemURL?.[0] ?? "",
    condition: item.condition?.[0]?.conditionDisplayName?.[0] ?? "Unknown",
    source: "ebay" as const,
  }));
}

// ---------------------------------------------------------------------------
// SerpAPI fallback
// ---------------------------------------------------------------------------

async function searchPartsSerpAPI(
  params: PartsSearchParams,
  apiKey: string
): Promise<PartResult[]> {
  const q = `${params.vehicle} ${params.part_name} buy parts price`;
  const url = new URL("https://serpapi.com/search.json");
  url.searchParams.set("q", q);
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("engine", "google_shopping");
  url.searchParams.set("num", "5");

  const res = await fetch(url.toString());
  if (!res.ok) return [];

  const json = (await res.json()) as {
    shopping_results?: Array<{
      title: string;
      price: string;
      source: string;
      link: string;
      condition?: string;
    }>;
  };

  return (json.shopping_results ?? []).map((r) => ({
    name: r.title,
    price: r.price,
    seller: r.source,
    url: r.link,
    condition: r.condition ?? "N/A",
    source: "serp" as const,
  }));
}

// ---------------------------------------------------------------------------
// Tool definition
// ---------------------------------------------------------------------------

export const searchPartsToolDef: ToolDefinition = {
  name: "search_parts",
  description:
    "Look up parts, pricing, and availability for a specific repair via eBay Motors or Google Shopping",
  parameters: {
    type: "object",
    properties: {
      part_name: {
        type: "string",
        description: "Name of the part to search for",
        required: true,
      },
      vehicle: {
        type: "string",
        description: 'Vehicle descriptor e.g. "2019 BMW 330i"',
        required: true,
      },
      preference: {
        type: "string",
        description: "Part preference: oem, aftermarket, or both",
        enum: ["oem", "aftermarket", "both"],
      },
    },
    required: ["part_name", "vehicle"],
  },
};
