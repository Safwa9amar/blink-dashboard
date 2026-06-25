import { cache } from "react";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  PROVIDERS,
  AI_ACTIVE_DEFAULTS,
  defaultProviderConfig,
  type Provider,
  type AiActiveSettings,
  type AiProviderConfig,
  type AiServerSettings,
} from "./ai-server-shared";

// Settings → AI Server (server-only data layer). The support bot (blink-server)
// reads TWO tables:
//
//   • `ai_settings` (singleton)        — which provider is ACTIVE + bot-level config
//                                        (bot_enabled, system_prompt_extra).
//   • `ai_provider_configs` (1 row/provider) — per-provider model / sampling /
//                                        reasoning + that provider's credential
//                                        (openrouter → api_key, ollama/lmstudio → base_url).
//
// The raw provider API keys are NEVER returned to the client — each is masked into
// `api_key_set` + `api_key_last4`. Base URLs are safe to return as-is. The shared
// types/constants/defaults live in `ai-server-shared.ts` (client-safe); this file
// adds the service-role read and must NOT be imported from a client component.
//
// Re-export the shared types so existing server-side importers (the action) can keep
// pulling them from here.
export type { Provider, AiActiveSettings, AiProviderConfig, AiServerSettings };
export { PROVIDERS, AI_ACTIVE_DEFAULTS, defaultProviderConfig };

// Reads the latest `ai_settings` row + all `ai_provider_configs` rows via the
// service-role admin client (global config, not per-user → bypasses RLS, mirrors
// data.ts / kb-data.ts). Missing rows fall back to defaults. The raw `api_key`s
// are read here ONLY to derive the masked state — they are never surfaced.
export const getAiServerSettings = cache(
  async (): Promise<{ settings: AiServerSettings; error: string | null }> => {
    const supabase = await createAdminClient();

    const [activeRes, configsRes] = await Promise.all([
      supabase
        .from("ai_settings")
        .select("provider, bot_enabled, system_prompt_extra")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("ai_provider_configs")
        .select("provider, model, temperature, max_tokens, reasoning, api_key, base_url"),
    ]);

    const fallback: AiServerSettings = {
      active: AI_ACTIVE_DEFAULTS,
      providers: {
        openrouter: defaultProviderConfig("openrouter"),
        ollama: defaultProviderConfig("ollama"),
        lmstudio: defaultProviderConfig("lmstudio"),
      },
    };

    if (activeRes.error) return { settings: fallback, error: activeRes.error.message };
    if (configsRes.error) return { settings: fallback, error: configsRes.error.message };

    const activeRow = activeRes.data as Partial<AiActiveSettings> | null;
    const active: AiActiveSettings = activeRow
      ? {
          provider: (activeRow.provider as Provider) ?? AI_ACTIVE_DEFAULTS.provider,
          bot_enabled: activeRow.bot_enabled ?? AI_ACTIVE_DEFAULTS.bot_enabled,
          system_prompt_extra: activeRow.system_prompt_extra ?? null,
        }
      : AI_ACTIVE_DEFAULTS;

    type ProviderRow = Partial<AiProviderConfig> & {
      provider?: Provider;
      api_key?: string | null;
    };
    const rows = (configsRes.data ?? []) as ProviderRow[];
    const byProvider = new Map<Provider, ProviderRow>();
    for (const r of rows) {
      if (r.provider) byProvider.set(r.provider, r);
    }

    const providers = {} as Record<Provider, AiProviderConfig>;
    for (const provider of PROVIDERS) {
      const row = byProvider.get(provider);
      if (!row) {
        providers[provider] = defaultProviderConfig(provider);
        continue;
      }
      const key = row.api_key ?? null;
      const d = defaultProviderConfig(provider);
      providers[provider] = {
        provider,
        model: row.model ?? null,
        temperature: row.temperature ?? d.temperature,
        max_tokens: row.max_tokens ?? d.max_tokens,
        reasoning: row.reasoning ?? d.reasoning,
        base_url: row.base_url ?? null,
        // Mask the secret — never return the raw key to the client.
        api_key_set: !!key,
        api_key_last4: key ? key.slice(-4) : null,
      };
    }

    return { settings: { active, providers }, error: null };
  }
);
