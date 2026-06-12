// Supported local-inference providers. Both expose an OpenAI-compatible API at
// `<host>/v1`, so chat + streaming are identical across them — only model listing
// and load/unload use provider-specific native endpoints (see client.ts).

export type Provider = "lmstudio" | "ollama";

export const PROVIDERS: Record<Provider, { label: string; defaultBaseUrl: string }> = {
  lmstudio: { label: "LM Studio", defaultBaseUrl: "http://localhost:1234/v1" },
  ollama: { label: "Ollama", defaultBaseUrl: "http://localhost:11434/v1" },
};

export const PROVIDER_LIST: Provider[] = ["lmstudio", "ollama"];

export function isProvider(v: unknown): v is Provider {
  return v === "lmstudio" || v === "ollama";
}
