// Shared types for the AI library (src/lib/ai).

export type ChatRole = "system" | "user" | "assistant";

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

// A JSON Schema handed to LM Studio's `response_format: json_schema` so the model
// is constrained to emit valid, parseable JSON. `name` labels the schema.
export interface JSONSchemaSpec {
  name: string;
  schema: Record<string, unknown>;
}

export interface ChatOptions {
  messages: ChatMessage[];
  /** OpenAI-compatible base URL (e.g. http://localhost:11434/v1). Defaults to env. */
  baseUrl?: string;
  /** Overrides the configured / auto-detected model id for this call. */
  model?: string;
  /** 0–1; lower is more deterministic. Defaults to 0.7. */
  temperature?: number;
  /** Token cap for the completion. Defaults to LM Studio's own (-1 = unlimited). */
  maxTokens?: number;
  /** Idle TTL (seconds): a JIT-loaded model is auto-unloaded after this idle time. */
  ttl?: number;
  /** When set, the model is constrained to this JSON Schema (structured output). */
  schema?: JSONSchemaSpec;
  /** Caller-supplied cancellation; composes with the configured timeout. */
  signal?: AbortSignal;
}

// A model as reported by LM Studio's native API (GET /api/v0/models) — richer
// than the OpenAI-compatible list: it includes load state and context length.
export interface LMModel {
  id: string;
  /** "llm" | "vlm" | "embeddings" */
  type?: string;
  /** "loaded" | "not-loaded" */
  state?: string;
  max_context_length?: number;
  loaded_context_length?: number;
  quantization?: string;
  arch?: string;
}

// All failures from the AI library surface as this, with a user-friendly message.
export class AIError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message);
    this.name = "AIError";
    if (options?.cause !== undefined) this.cause = options.cause;
  }
}
