import type { AssistantProvider, AssistantSettings } from "./types";

export const ASSISTANT_PROVIDERS: readonly AssistantProvider[] = ["openrouter", "ollama", "lmstudio"];
export const ASSISTANT_SETTINGS_DEFAULTS: AssistantSettings = {
  assistant_enabled: true,
  assistant_provider: "openrouter",
  assistant_model: null,
};
export const ASSISTANT_DEFAULT_MODEL = "anthropic/claude-haiku-5.5";

const MODEL_RE = /^[\w.:/@+\-]+$/;

export type SanitizeResult = { ok: true; value: AssistantSettings } | { ok: false; error: "provider" | "model" };

/** Validates untrusted settings input. Blank model → null (server default). */
export function sanitizeAssistantSettings(input: unknown): SanitizeResult {
  const o = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  const provider = o.assistant_provider;
  if (typeof provider !== "string" || !ASSISTANT_PROVIDERS.includes(provider as AssistantProvider)) {
    return { ok: false, error: "provider" };
  }
  let model: string | null = null;
  if (typeof o.assistant_model === "string") {
    const m = o.assistant_model.trim();
    if (m) {
      if (m.length > 200 || !MODEL_RE.test(m)) return { ok: false, error: "model" };
      model = m;
    }
  } else if (o.assistant_model != null) {
    return { ok: false, error: "model" };
  }
  return {
    ok: true,
    value: { assistant_enabled: o.assistant_enabled !== false, assistant_provider: provider as AssistantProvider, assistant_model: model },
  };
}

/** Reads the assistant columns off an `ai_settings` row, tolerating missing/invalid values. */
export function settingsFromRow(row: unknown): AssistantSettings {
  const o = (row && typeof row === "object" ? row : {}) as Record<string, unknown>;
  const provider = ASSISTANT_PROVIDERS.includes(o.assistant_provider as AssistantProvider)
    ? (o.assistant_provider as AssistantProvider)
    : ASSISTANT_SETTINGS_DEFAULTS.assistant_provider;
  return {
    assistant_enabled: typeof o.assistant_enabled === "boolean" ? o.assistant_enabled : true,
    assistant_provider: provider,
    assistant_model: typeof o.assistant_model === "string" && o.assistant_model.trim() ? o.assistant_model : null,
  };
}
