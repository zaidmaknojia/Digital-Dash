/**
 * On-device LLM provider stub.
 *
 * Full implementation would bridge to llama.cpp via a React Native native module.
 * Grammar-constrained generation (--grammar) must be used for tool calling since
 * llama.cpp does not have native tool-call support — parse JSON manually.
 *
 * This stub throws to indicate it is not yet implemented.
 */

import { LLMProvider, LLMChatParams } from "../LLMProvider";
import { LLMChunk } from "../types";

export class OnDeviceProvider implements LLMProvider {
  readonly name = "On-device (llama.cpp)";

  // eslint-disable-next-line require-yield
  async *chat(_params: LLMChatParams): AsyncGenerator<LLMChunk> {
    throw new Error(
      "OnDeviceProvider is not yet implemented. Use OllamaProvider for now."
    );
    yield { kind: "end", stopReason: "error" }; // unreachable — satisfies TS generator return type
  }

  async healthCheck(): Promise<boolean> {
    return false;
  }
}
