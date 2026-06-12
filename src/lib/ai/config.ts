// Configuration for the local LM Studio inference server.
//
// LM Studio (https://lmstudio.ai) exposes an OpenAI-compatible REST API — by
// default at http://localhost:1234/v1. These are all **server-only** knobs read
// from the dashboard env; nothing here is ever sent to the browser.
//
//   LMSTUDIO_BASE_URL   override the host (default http://localhost:1234/v1)
//   LMSTUDIO_MODEL      pin a model id; otherwise the first loaded model is used
//   LMSTUDIO_TIMEOUT_MS abort a generation after this many ms (default 120000)
//
// Because LM Studio runs on the developer's machine, this only works where the
// Next.js server can reach that host (local `npm run dev`). In a remote deploy,
// point LMSTUDIO_BASE_URL at a reachable OpenAI-compatible endpoint.

// Normalize to the OpenAI-compatible base: strip trailing slashes and ensure a
// single `/v1` suffix. This tolerates the common footgun of setting the host
// without `/v1` (e.g. http://host:1234) — LM Studio would otherwise reject the
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

export const AI_TIMEOUT_MS = Number(process.env.LMSTUDIO_TIMEOUT_MS) || 120_000;
