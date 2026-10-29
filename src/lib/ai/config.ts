// Configuration for AI inference providers: local (LM Studio, Ollama) and remote (OpenRouter).
// These are all **server-only** knobs read from the dashboard env; nothing here is
// ever sent to the browser.
//
// **LM Studio (local)**
//   LMSTUDIO_BASE_URL   override the host (default http://localhost:1234/v1)
//   LMSTUDIO_MODEL      pin a model id; otherwise the first loaded model is used
//
// **OpenRouter (remote)**
//   OPENROUTER_BASE_URL override the host (default https://openrouter.ai/api/v1)
//   OPENROUTER_API_KEY  required for authentication
//   OPENROUTER_MODEL    pin a model id (e.g., anthropic/claude-3.5-sonnet)
//   OPENROUTER_FALLBACK_MODELS  comma-separated models OpenRouter tries when the
//                       chosen one's provider fails (rate limit, overload)
//
// **Common**
//   AI_TIMEOUT_MS       abort a generation after this many ms (default 120000)

// Normalize to the OpenAI-compatible base: strip trailing slashes and ensure a
// single `/v1` suffix. This tolerates the common footgun of setting the host
// without `/v1` (e.g. http://host:1234) — servers would otherwise reject the
// request with "Unexpected endpoint or method. (POST /chat/completions)".
function normalizeBaseUrl(raw: string): string {
  const trimmed = raw.replace(/\/+$/, "");
  return /\/v1$/.test(trimmed) ? trimmed : `${trimmed}/v1`;
}

export const AI_BASE_URL = normalizeBaseUrl(
  process.env.LMSTUDIO_BASE_URL?.trim() || "http://localhost:1234/v1"
);

// Empty string → auto-detect the loaded model via GET /v1/models (see client).
export const AI_MODEL = process.env.LMSTUDIO_MODEL?.trim() || "";

// OpenRouter configuration
export const OPENROUTER_BASE_URL = normalizeBaseUrl(
  process.env.OPENROUTER_BASE_URL?.trim() || "https://openrouter.ai/api/v1"
);

export const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY?.trim() || "";

export const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL?.trim() || "";

// The account only runs `:free` models, which are often rate-limited or
// overloaded upstream ("Provider returned error"). These two answered in ~1.5 s
// on 2026-10-29; free ids churn, so override them from the env.
export const OPENROUTER_FALLBACK_MODELS = (
  process.env.OPENROUTER_FALLBACK_MODELS?.trim() ||
  "nvidia/nemotron-3.5-lightning:free,nvidia/nemotron-3.5-super-vl:free"
)
  .split(",")
  .map((m) => m.trim())
  .filter(Boolean);

// Common timeout for all providers
export const AI_TIMEOUT_MS = Number(process.env.AI_TIMEOUT_MS) || 120_000;
