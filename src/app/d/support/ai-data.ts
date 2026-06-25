import { cache } from "react";
import { createAdminClient } from "@/lib/supabase/admin";

// Shape of the `ai_settings` singleton row (mirrors the blink-server Drizzle
// schema src/db/schema/ai-settings.ts). API KEYS ARE NOT STORED HERE — they live
// in the server environment. Kept in sync with the server schema by hand.
export interface AiSettings {
  provider: "openrouter" | "ollama" | "lmstudio";
  model: string | null;
  temperature: number;
  max_tokens: number;
  reasoning: boolean;
  bot_enabled: boolean;
  system_prompt_extra: string | null;
}

// Defaults used when no row exists yet (seed-safe — the table may be empty on a
// fresh DB). Matches the column defaults in the Drizzle schema.
export const AI_SETTINGS_DEFAULTS: AiSettings = {
  provider: "openrouter",
  model: null,
  temperature: 0.3,
  max_tokens: 600,
  reasoning: false,
  bot_enabled: true,
  system_prompt_extra: null,
};

// Reads the latest `ai_settings` row via the service-role admin client (this
// config is global, not per-user, so it bypasses RLS — mirrors data.ts / kb-data.ts).
// Returns the defaults if the table is empty.
export const getAiSettings = cache(
  async (): Promise<{ settings: AiSettings; error: string | null }> => {
    const supabase = await createAdminClient();
    const { data, error } = await supabase
      .from("ai_settings")
      .select("provider, model, temperature, max_tokens, reasoning, bot_enabled, system_prompt_extra")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) return { settings: AI_SETTINGS_DEFAULTS, error: error.message };
    if (!data) return { settings: AI_SETTINGS_DEFAULTS, error: null };

    const row = data as Partial<AiSettings>;
    return {
      settings: {
        provider: (row.provider as AiSettings["provider"]) ?? AI_SETTINGS_DEFAULTS.provider,
        model: row.model ?? null,
        temperature: row.temperature ?? AI_SETTINGS_DEFAULTS.temperature,
        max_tokens: row.max_tokens ?? AI_SETTINGS_DEFAULTS.max_tokens,
        reasoning: row.reasoning ?? AI_SETTINGS_DEFAULTS.reasoning,
        bot_enabled: row.bot_enabled ?? AI_SETTINGS_DEFAULTS.bot_enabled,
        system_prompt_extra: row.system_prompt_extra ?? null,
      },
      error: null,
    };
  }
);
