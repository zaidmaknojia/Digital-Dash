import { ChatMessage, LLMChunk, ToolDefinition } from "./types";

export interface LLMChatParams {
  systemPrompt: string;
  messages: ChatMessage[];
  tools: ToolDefinition[];
  temperature?: number;
  maxTokens?: number;
}

/**
 * Abstract LLM provider interface.
 * Implement this for Ollama, on-device llama.cpp, or any cloud API.
 */
export interface LLMProvider {
  /**
   * Send a chat request and stream back chunks.
   * The generator must yield at minimum one `end` chunk.
   */
  chat(params: LLMChatParams): AsyncGenerator<LLMChunk>;

  /** Human-readable provider name (shown in settings). */
  readonly name: string;

  /** Check whether the provider is reachable / available. */
  healthCheck(): Promise<boolean>;
}
