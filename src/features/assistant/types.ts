export type AssistantProvider = "openrouter" | "ollama" | "lmstudio";

export interface AssistantToolInfo {
  name: string;
  title: string;
}

export interface AssistantConfig {
  enabled: boolean;
  provider: string;
  model: string | null;
  tools: AssistantToolInfo[];
}

export interface AssistantThread {
  id: string;
  title: string | null;
  created_at: string;
  updated_at: string;
}

export interface ToolRun {
  /** Stable id for a live tool call; absent on persisted summaries. */
  id?: string;
  name: string;
  title: string;
  status: "running" | "done" | "error";
  rowCount?: number;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  tools: ToolRun[];
  streaming?: boolean;
  /** Set on an assistant turn that failed. */
  errorCode?: AssistantErrorCode;
}

export interface PersistedMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  tools: { name: string; title: string; ok: boolean; row_count: number }[] | null;
  created_at: string;
}

export type AssistantErrorCode =
  | "disabled"
  | "rate_limited"
  | "provider_error"
  | "timeout"
  | "not_found"
  | "unavailable";

export type StreamEvent =
  | { type: "tool"; id: string; name: string; title: string; status: "start" | "done" | "error"; rowCount?: number; ms?: number }
  | { type: "delta"; text: string }
  | { type: "done"; messageId: string }
  | { type: "error"; message: string; code: AssistantErrorCode };

export interface AssistantSettings {
  assistant_enabled: boolean;
  assistant_provider: AssistantProvider;
  assistant_model: string | null;
}
