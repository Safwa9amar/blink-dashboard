// Supported inference providers: local (LM Studio, Ollama) and remote (OpenRouter).
// Local providers expose an OpenAI-compatible API at `<host>/v1` with native
// model listing/loading. OpenRouter is a remote API requiring an API key.

export type Provider = "lmstudio" | "ollama" | "openrouter";

export const PROVIDERS: Record<Provider, { label: string; defaultBaseUrl: string }> = {
  lmstudio: { label: "LM Studio", defaultBaseUrl: "http://localhost:1234/v1" },
  ollama: { label: "Ollama", defaultBaseUrl: "http://localhost:11434/v1" },
  openrouter: { label: "OpenRouter", defaultBaseUrl: "https://openrouter.ai/api/v1" },
};

export const PROVIDER_LIST: Provider[] = ["lmstudio", "ollama", "openrouter"];

export function isProvider(v: unknown): v is Provider {
  return v === "lmstudio" || v === "ollama" || v === "openrouter";
}
