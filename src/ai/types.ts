// ---------------------------------------------------------------------------
// Chat primitives
// ---------------------------------------------------------------------------

export interface ChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string | ToolResultContent[];
  tool_call_id?: string;
}

export interface ToolResultContent {
  type: "tool_result";
  tool_use_id: string;
  content: string;
}

// ---------------------------------------------------------------------------
// Tool definitions (sent to the LLM)
// ---------------------------------------------------------------------------

export interface ToolParameterSchema {
  type: string;
  description?: string;
  required?: boolean;
  enum?: string[];
  items?: { type: string };
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: "object";
    properties: Record<string, ToolParameterSchema>;
    required?: string[];
  };
}

// ---------------------------------------------------------------------------
// LLM streaming chunks
// ---------------------------------------------------------------------------

export type LLMChunk =
  | { kind: "text"; content: string }
  | { kind: "tool_call"; id: string; name: string; arguments: string }
  | { kind: "end"; stopReason: "end_turn" | "tool_use" | "max_tokens" | "error" };

// ---------------------------------------------------------------------------
// Diagnosis context — input to AIService.diagnose()
// ---------------------------------------------------------------------------

export interface DiagnosisContext {
  vehicle: {
    vin?: string;
    year: number;
    make: string;
    model: string;
    engine?: string;
    mileage?: number;
  };
  dtcs: {
    code: string;
    type: "stored" | "pending" | "permanent";
    description?: string;
  }[];
  pidSnapshot: Record<string, number>;
  userDescription?: string;
}

// ---------------------------------------------------------------------------
// Diagnosis result — output from AIService.diagnose()
// ---------------------------------------------------------------------------

export interface LikelyCause {
  cause: string;
  confidence: "high" | "medium" | "low";
  source_urls: string[];
}

export interface RecommendedFix {
  fix: string;
  diy_difficulty: "easy" | "moderate" | "hard" | "professional_only";
  estimated_cost_usd: { min: number; max: number };
  parts: {
    name: string;
    part_number?: string;
    price_range?: string;
  }[];
}

export interface TSBEntry {
  id: string;
  title: string;
  url: string;
}

export interface DiagnosisResult {
  summary: string;
  severity: "critical" | "moderate" | "low" | "monitor";
  likely_causes: LikelyCause[];
  recommended_fixes: RecommendedFix[];
  tsbs: TSBEntry[];
  disclaimer: string;
}

// ---------------------------------------------------------------------------
// Tool call execution types
// ---------------------------------------------------------------------------

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

export interface ToolResult {
  tool_call_id: string;
  content: string;
}
