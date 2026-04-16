/**
 * AIService — orchestrates the agentic tool-call loop for vehicle diagnosis.
 *
 * Architecture:
 *  1. Build initial user message from DiagnosisContext
 *  2. Stream LLM response
 *  3. If LLM requests tool calls, execute them and feed results back
 *  4. Loop until end_turn or max iterations
 *  5. Parse final JSON response into DiagnosisResult
 */

import { LLMProvider } from "./LLMProvider";
import { OllamaProvider } from "./providers/OllamaProvider";
import {
  DiagnosisContext,
  DiagnosisResult,
  ChatMessage,
  ToolCall,
  ToolDefinition,
  LLMChunk,
} from "./types";
import { buildSystemPrompt } from "./prompts/systemPrompt";
import { buildDiagnosisUserMessage } from "./prompts/diagnosisPrompt";
import { searchTSB, searchTSBToolDef, TSBResult } from "./tools/searchTSB";
import {
  searchForums,
  searchForumsToolDef,
  ForumResult,
} from "./tools/searchForums";
import {
  searchParts,
  searchPartsToolDef,
  PartResult,
} from "./tools/searchParts";
import {
  estimateCost,
  estimateCostToolDef,
  CostEstimate,
} from "./tools/estimateCost";

const MAX_TOOL_ITERATIONS = 8;

const TOOLS: ToolDefinition[] = [
  searchTSBToolDef,
  searchForumsToolDef,
  searchPartsToolDef,
  estimateCostToolDef,
];

const FALLBACK_RESULT: DiagnosisResult = {
  summary: "Diagnosis could not be completed.",
  severity: "monitor",
  likely_causes: [],
  recommended_fixes: [],
  tsbs: [],
  disclaimer:
    "This is an automated AI diagnosis. Always consult a qualified mechanic for safety-critical repairs.",
};

export class AIService {
  private provider: LLMProvider;

  constructor(provider?: LLMProvider) {
    this.provider = provider ?? new OllamaProvider();
  }

  setProvider(provider: LLMProvider): void {
    this.provider = provider;
  }

  /**
   * Run a full agentic diagnosis.
   * @param context  Vehicle + DTC + PID data
   * @param onProgress  Optional callback for streaming text updates to the UI
   */
  async diagnose(
    context: DiagnosisContext,
    onProgress?: (text: string) => void
  ): Promise<DiagnosisResult> {
    const systemPrompt = buildSystemPrompt(context);
    const userMessage = buildDiagnosisUserMessage(context);

    const messages: ChatMessage[] = [
      { role: "user", content: userMessage },
    ];

    let iterations = 0;
    let finalText = "";

    while (iterations < MAX_TOOL_ITERATIONS) {
      iterations++;
      let textAccum = "";
      const pendingToolCalls: ToolCall[] = [];
      let stopReason: "end_turn" | "tool_use" | "max_tokens" | "error" = "end_turn";

      const stream = this.provider.chat({
        systemPrompt,
        messages,
        tools: TOOLS,
        temperature: 0.3,
        maxTokens: 4096,
      });

      for await (const chunk of stream) {
        if (chunk.kind === "text") {
          textAccum += chunk.content;
          onProgress?.(chunk.content);
        } else if (chunk.kind === "tool_call") {
          let args: Record<string, unknown> = {};
          try {
            args = JSON.parse(chunk.arguments) as Record<string, unknown>;
          } catch {
            args = {};
          }
          pendingToolCalls.push({
            id: chunk.id,
            name: chunk.name,
            arguments: args,
          });
        } else if (chunk.kind === "end") {
          stopReason = chunk.stopReason;
        }
      }

      if (stopReason === "end_turn" || stopReason === "max_tokens") {
        finalText = textAccum;
        break;
      }

      if (stopReason === "tool_use" && pendingToolCalls.length > 0) {
        // Push assistant message
        messages.push({
          role: "assistant",
          content: textAccum || "Calling tools...",
        });

        // Execute all tool calls in parallel
        const toolResults = await this.executeToolCalls(pendingToolCalls);

        // Push tool results as a user message
        messages.push({
          role: "tool",
          content: toolResults.map((r) => ({
            type: "tool_result" as const,
            tool_use_id: r.tool_call_id,
            content: r.content,
          })),
        });

        continue;
      }

      // Error or unexpected stop
      break;
    }

    return this.parseResult(finalText);
  }

  // ---------------------------------------------------------------------------
  // Tool execution
  // ---------------------------------------------------------------------------

  private async executeToolCalls(
    calls: ToolCall[]
  ): Promise<Array<{ tool_call_id: string; content: string }>> {
    const results = await Promise.allSettled(
      calls.map((call) => this.executeToolCall(call))
    );

    return results.map((r, i) => ({
      tool_call_id: calls[i]!.id,
      content:
        r.status === "fulfilled"
          ? r.value
          : `Tool error: ${r.reason instanceof Error ? r.reason.message : String(r.reason)}`,
    }));
  }

  private async executeToolCall(call: ToolCall): Promise<string> {
    switch (call.name) {
      case "search_tsb": {
        const params = call.arguments as {
          vehicle: string;
          dtc_codes: string[];
          symptom?: string;
        };
        const results: TSBResult[] = await searchTSB(params);
        return JSON.stringify(results, null, 2);
      }

      case "search_forums": {
        const params = call.arguments as {
          query: string;
          vehicle: string;
          dtc_codes?: string[];
        };
        const results: ForumResult[] = await searchForums(params);
        return JSON.stringify(results, null, 2);
      }

      case "search_parts": {
        const params = call.arguments as {
          part_name: string;
          vehicle: string;
          preference?: "oem" | "aftermarket" | "both";
        };
        const results: PartResult[] = await searchParts(params);
        return JSON.stringify(results, null, 2);
      }

      case "estimate_repair_cost": {
        const params = call.arguments as {
          repair_type: string;
          vehicle: string;
          zip_code?: string;
        };
        const results: CostEstimate[] = await estimateCost(params);
        return JSON.stringify(results, null, 2);
      }

      default:
        return JSON.stringify({ error: `Unknown tool: ${call.name}` });
    }
  }

  // ---------------------------------------------------------------------------
  // Result parsing
  // ---------------------------------------------------------------------------

  private parseResult(text: string): DiagnosisResult {
    // Try to extract a JSON block from the response
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/) ??
      text.match(/(\{[\s\S]*\})/);

    if (!jsonMatch) {
      // If no JSON found, build a minimal result from the text
      return {
        ...FALLBACK_RESULT,
        summary: text.slice(0, 500) || FALLBACK_RESULT.summary,
      };
    }

    try {
      const parsed = JSON.parse(jsonMatch[1]!) as Partial<DiagnosisResult>;
      return {
        summary: parsed.summary ?? FALLBACK_RESULT.summary,
        severity: parsed.severity ?? "monitor",
        likely_causes: parsed.likely_causes ?? [],
        recommended_fixes: parsed.recommended_fixes ?? [],
        tsbs: parsed.tsbs ?? [],
        disclaimer:
          parsed.disclaimer ??
          "Always consult a qualified mechanic before performing repairs.",
      };
    } catch {
      return { ...FALLBACK_RESULT, summary: text.slice(0, 500) };
    }
  }
}

export const aiService = new AIService();
