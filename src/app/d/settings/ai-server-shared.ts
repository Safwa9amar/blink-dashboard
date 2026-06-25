// Client-safe AI Server settings types + constants. This module has NO server-only
// imports (no `createAdminClient` / `next/headers` / react `cache`) so it can be
// imported by the client panel (`ai-server-settings.tsx`) without dragging the
// service-role data layer into the browser bundle. The server-only reader lives in
// `ai-server-data.ts`, which imports its types/constants from here.
//
// Kept in sync with the server Drizzle schema (`ai_settings` + `ai_provider_configs`)
// by hand.

export type Provider = "openrouter" | "ollama" | "lmstudio";

export const PROVIDERS: Provider[] = ["openrouter", "ollama", "lmstudio"];

// Bot-level / "which provider is active" config (the `ai_settings` singleton).
export interface AiActiveSettings {
  provider: Provider; // the ACTIVE provider the bot uses
  bot_enabled: boolean;
  system_prompt_extra: string | null;
}

// One provider's config (a row in `ai_provider_configs`), client-facing. The raw
// `api_key` is masked away into the two derived flags below.
export interface AiProviderConfig {
  provider: Provider;
  model: string | null;
  temperature: number;
  max_tokens: number;
  reasoning: boolean;
  base_url: string | null; // ollama / lmstudio endpoint (null = server env default)
  // Credential, masked / non-secret.
  api_key_set: boolean;
  api_key_last4: string | null;
}

// The full client-facing settings bundle.
export interface AiServerSettings {
  active: AiActiveSettings;
  providers: Record<Provider, AiProviderConfig>;
}

// Bot-level defaults when the singleton row is missing (seed-safe).
export const AI_ACTIVE_DEFAULTS: AiActiveSettings = {
  provider: "openrouter",
  bot_enabled: true,
  system_prompt_extra: null,
};

// Per-provider defaults when a provider's row is missing. Matches the column
// defaults in the server Drizzle schema.
export function defaultProviderConfig(provider: Provider): AiProviderConfig {
  return {
    provider,
    model: null,
    temperature: 0.3,
    max_tokens: 600,
    reasoning: false,
    base_url: null,
    api_key_set: false,
    api_key_last4: null,
  };
}
