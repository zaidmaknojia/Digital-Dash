/**
 * Ollama HTTP API provider for Gemma 3 2B (or any model hosted via Ollama).
 *
 * Requires Ollama 0.3+ for native tool-calling support.
 * Endpoint: POST /api/chat  (streaming NDJSON)
 *
 * Docs: https://github.com/ollama/ollama/blob/main/docs/api.md
 */

import { LLMProvider, LLMChatParams } from "../LLMProvider";
import { LLMChunk, ChatMessage, ToolDefinition } from "../types";

interface OllamaMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  tool_calls?: OllamaToolCall[];
  tool_call_id?: string;
}

interface OllamaToolCall {
  id?: string;
  function: {
    name: string;
    arguments: Record<string, unknown>;
  };
}

interface OllamaStreamChunk {
  model: string;
  created_at: string;
  message: {
    role: string;
    content: string;
    tool_calls?: OllamaToolCall[];
  };
  done: boolean;
  done_reason?: string;
}

export class OllamaProvider implements LLMProvider {
  readonly name = "Ollama (local)";

  private baseUrl: string;
  private model: string;

  constructor(options: { baseUrl?: string; model?: string } = {}) {
    this.baseUrl = options.baseUrl ?? "http://localhost:11434";
    this.model = options.model ?? "gemma3:2b";
  }

  async *chat(params: LLMChatParams): AsyncGenerator<LLMChunk> {
    const messages = this.buildMessages(params);

    const body = {
      model: this.model,
      messages,
      tools: params.tools.map(this.convertTool),
      stream: true,
      options: {
        temperature: params.temperature ?? 0.3,
        num_predict: params.maxTokens ?? 2048,
      },
    };

    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } catch (err) {
      yield { kind: "end", stopReason: "error" };
      return;
    }

    if (!response.ok || !response.body) {
      yield { kind: "end", stopReason: "error" };
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    // Track accumulated tool calls (Ollama may split them across chunks)
    const pendingToolCalls = new Map<string, { name: string; args: string }>();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (!line.trim()) continue;

        let chunk: OllamaStreamChunk;
        try {
          chunk = JSON.parse(line) as OllamaStreamChunk;
        } catch {
          continue;
        }

        // Text content
        if (chunk.message.content) {
          yield { kind: "text", content: chunk.message.content };
        }

        // Tool calls
        if (chunk.message.tool_calls) {
          for (const tc of chunk.message.tool_calls) {
            const id =
              tc.id ?? `tool-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
            yield {
              kind: "tool_call",
              id,
              name: tc.function.name,
              arguments: JSON.stringify(tc.function.arguments),
            };
          }
        }

        if (chunk.done) {
          const stopReason = this.mapDoneReason(chunk.done_reason);
          yield { kind: "end", stopReason };
          return;
        }
      }
    }

    yield { kind: "end", stopReason: "end_turn" };
  }

  async healthCheck(): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/api/tags`, {
        signal: AbortSignal.timeout(3000),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private buildMessages(params: LLMChatParams): OllamaMessage[] {
    const msgs: OllamaMessage[] = [
      { role: "system", content: params.systemPrompt },
    ];

    for (const m of params.messages) {
      if (m.role === "tool" && Array.isArray(m.content)) {
        for (const tr of m.content) {
          msgs.push({
            role: "tool",
            content: tr.content,
            tool_call_id: tr.tool_use_id,
          });
        }
      } else {
        msgs.push({
          role: m.role as OllamaMessage["role"],
          content: typeof m.content === "string" ? m.content : JSON.stringify(m.content),
          tool_call_id: m.tool_call_id,
        });
      }
    }

    return msgs;
  }

  private convertTool(tool: ToolDefinition): object {
    return {
      type: "function",
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters,
      },
    };
  }

  private mapDoneReason(
    reason?: string
  ): "end_turn" | "tool_use" | "max_tokens" | "error" {
    switch (reason) {
      case "stop":
        return "end_turn";
      case "tool_calls":
        return "tool_use";
      case "length":
        return "max_tokens";
      default:
        return "end_turn";
    }
  }
}
