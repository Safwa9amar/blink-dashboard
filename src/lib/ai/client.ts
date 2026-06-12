// Minimal OpenAI-compatible client for local inference servers (LM Studio & Ollama).
//
// Server-only — import this from Server Actions / route handlers, never from a
// client component. Chat + streaming use the OpenAI-compatible `/v1` API, which
// both providers share, so they only differ by `baseUrl`. Model listing and
// load/unload use each provider's native endpoints (selected by `provider`).
// All failures surface as `AIError` with a message safe to show an operator.

import { AI_BASE_URL, AI_MODEL, AI_TIMEOUT_MS } from "./config";
import { AIError, type ChatOptions, type LMModel } from "./types";
import type { Provider } from "./providers";
import { parseDraftJSON } from "./parse";

interface ModelsResponse {
  data?: Array<{ id?: string }>;
}

// `content` is usually a string, but vision/multimodal models return an array of
// parts, and reasoning ("thinking") models may leave it empty and put their text
// in `reasoning_content`. extractText() + the reasoning fallback handle all three.
type ContentPart = { text?: string } | string;
interface ChatCompletionResponse {
  choices?: Array<{
    message?: { content?: string | ContentPart[] | null; reasoning_content?: string | null };
  }>;
  error?: { message?: string } | string;
}

function extractText(content: string | ContentPart[] | null | undefined): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content.map((p) => (typeof p === "string" ? p : p?.text ?? "")).join("");
  }
  return "";
}

// Normalize an OpenAI-compatible base URL: strip trailing slashes, ensure one
// `/v1`. Falls back to the env default (LM Studio). Tolerates a host given without
// `/v1` (a common footgun that makes the server reject /chat/completions).
function normBase(url?: string): string {
  const raw = (url?.trim() || AI_BASE_URL).replace(/\/+$/, "");
  return /\/v1$/.test(raw) ? raw : `${raw}/v1`;
}

// The provider's native API lives on the host root, NOT the `/v1` path.
function nativeBaseOf(base: string): string {
  return base.replace(/\/v1\/?$/, "");
}

// Resolves which model id to send when the caller didn't pin one: the env-pinned
// model (LM Studio default host only), else the first model the server lists.
async function resolveModel(base: string, signal?: AbortSignal): Promise<string> {
  if (AI_MODEL && base === AI_BASE_URL) return AI_MODEL;
  let res: Response;
  try {
    res = await fetch(`${base}/models`, { signal });
  } catch (cause) {
    throw connectionError(cause, base);
  }
  if (!res.ok) throw new AIError(`The AI server returned ${res.status} listing models.`);
  const json = (await res.json()) as ModelsResponse;
  const id = json.data?.find((m) => m.id)?.id;
  if (!id) throw new AIError("No model is available — load/pull one and try again.");
  return id;
}

interface ModelConnection {
  baseUrl?: string;
  provider?: Provider;
  signal?: AbortSignal;
}

// Lists available models with load state. LM Studio uses its rich native endpoint;
// Ollama uses /api/tags (+ /api/ps for which are currently loaded).
export async function listModels(conn: ModelConnection = {}): Promise<LMModel[]> {
  const base = normBase(conn.baseUrl);
  const root = nativeBaseOf(base);
  if (conn.provider === "ollama") return listOllamaModels(root, conn.signal);

  // LM Studio — rich list, falling back to the OpenAI list if the native API is off.
  try {
    const res = await fetch(`${root}/api/v0/models`, { signal: conn.signal });
    if (res.ok) {
      const json = (await res.json()) as { data?: LMModel[] };
      return json.data ?? [];
    }
  } catch (cause) {
    throw connectionError(cause, base);
  }
  const res = await fetch(`${base}/models`, { signal: conn.signal }).catch((c) => {
    throw connectionError(c, base);
  });
  const json = (await res.json()) as ModelsResponse;
  return (json.data ?? []).map((m) => ({ id: m.id ?? "" })).filter((m) => m.id);
}

async function listOllamaModels(root: string, signal?: AbortSignal): Promise<LMModel[]> {
  let tags: Response;
  try {
    tags = await fetch(`${root}/api/tags`, { signal });
  } catch (cause) {
    throw connectionError(cause, root);
  }
  if (!tags.ok) throw new AIError(`Ollama returned ${tags.status} listing models.`);
  const json = (await tags.json()) as {
    models?: Array<{ name?: string; model?: string; details?: { quantization_level?: string } }>;
  };
  // /api/ps tells us which models are currently loaded in memory.
  const loaded = new Set<string>();
  try {
    const ps = await fetch(`${root}/api/ps`, { signal });
    if (ps.ok) {
      const psJson = (await ps.json()) as { models?: Array<{ name?: string; model?: string }> };
      for (const m of psJson.models ?? []) loaded.add(m.name ?? m.model ?? "");
    }
  } catch {
    /* /api/ps is best-effort */
  }
  return (json.models ?? [])
    .map((m) => m.name ?? m.model ?? "")
    .filter(Boolean)
    .map((id) => ({ id, type: "llm", state: loaded.has(id) ? "loaded" : "not-loaded" }));
}

// Loads/preloads a model into memory. LM Studio loads with an optional context
// length; Ollama "loads" by warming it with an infinite keep-alive.
export async function loadModel(
  opts: { model: string; contextLength?: number } & ModelConnection
): Promise<void> {
  const base = normBase(opts.baseUrl);
  const root = nativeBaseOf(base);
  if (opts.provider === "ollama") {
    await nativePost(root, "/api/generate", { model: opts.model, keep_alive: -1 }, opts.signal);
    return;
  }
  const body: Record<string, unknown> = { model: opts.model };
  if (opts.contextLength && opts.contextLength > 0) body.context_length = opts.contextLength;
  await nativePost(root, "/api/v1/models/load", body, opts.signal);
}

// Unloads (stops) a model, freeing its memory. Ollama unloads via keep_alive: 0.
export async function unloadModel(
  opts: { model: string } & ModelConnection
): Promise<void> {
  const base = normBase(opts.baseUrl);
  const root = nativeBaseOf(base);
  if (opts.provider === "ollama") {
    await nativePost(root, "/api/generate", { model: opts.model, keep_alive: 0 }, opts.signal);
    return;
  }
  // LM Studio identifies the model to unload by `instance_id`, not `model`.
  await nativePost(root, "/api/v1/models/unload", { instance_id: opts.model }, opts.signal);
}

async function nativePost(
  root: string,
  path: string,
  body: unknown,
  signal?: AbortSignal
): Promise<unknown> {
  let res: Response;
  try {
    res = await fetch(`${root}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal,
    });
  } catch (cause) {
    throw connectionError(cause, root);
  }
  const json = (await res.json().catch(() => null)) as
    | { error?: { message?: string } | string }
    | null;
  if (!res.ok) {
    const detail = typeof json?.error === "string" ? json.error : json?.error?.message;
    throw new AIError(detail || `The AI server returned ${res.status}.`);
  }
  return json;
}

// Sends a chat completion and returns the assistant's text. Pass `schema` to
// constrain the model to valid JSON (see chatJSON, which also parses it).
export async function chat(opts: ChatOptions): Promise<string> {
  const { temperature = 0.7, maxTokens = -1 } = opts;
  const base = normBase(opts.baseUrl);

  // Compose the caller's signal (if any) with our own timeout.
  const timeout = new AbortController();
  const timer = setTimeout(() => timeout.abort(), AI_TIMEOUT_MS);
  const signal = opts.signal ? anySignal([opts.signal, timeout.signal]) : timeout.signal;

  try {
    const model = opts.model || (await resolveModel(base, signal));
    const body = buildChatBody(model, { ...opts, temperature, maxTokens }, false);

    let res: Response;
    try {
      res = await fetch(`${base}/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal,
      });
    } catch (cause) {
      throw connectionError(cause, base);
    }

    const json = (await res.json().catch(() => null)) as ChatCompletionResponse | null;
    if (!res.ok || !json) {
      const detail = typeof json?.error === "string" ? json.error : json?.error?.message;
      throw new AIError(detail || `The AI server returned ${res.status}.`);
    }
    const msg = json.choices?.[0]?.message;
    const content = extractText(msg?.content) || (msg?.reasoning_content ?? "");
    if (!content.trim()) {
      throw new AIError(
        "The model returned no text. If it's a reasoning model (e.g. Qwen3 'thinking'), pick an instruct model in Settings → AI."
      );
    }
    return content;
  } finally {
    clearTimeout(timer);
  }
}

// Like chat(), but parses the response as JSON.
export async function chatJSON<T>(opts: ChatOptions): Promise<T> {
  const text = await chat(opts);
  return parseDraftJSON<T>(text);
}

// Streams a chat completion, yielding incremental deltas as they arrive. Each
// yield carries `content` (visible answer) and/or `reasoning` (a thinking model's
// chain-of-thought, from `reasoning_content`). Consume with `for await`.
//
// IMPORTANT: do NOT pass a `schema` for reasoning models — LM Studio applies the
// JSON-schema grammar to the *reasoning* stream, trapping the JSON there and
// leaving `content` empty (lmstudio bug #1773). Prompt for JSON instead and parse
// the streamed content with parseDraftJSON().
export async function* chatStream(
  opts: ChatOptions
): AsyncGenerator<{ content?: string; reasoning?: string }> {
  const { temperature = 0.7, maxTokens = -1 } = opts;
  const base = normBase(opts.baseUrl);
  // INACTIVITY timeout (reset on every chunk) — not a total cap. A verbose
  // reasoning model can stream for minutes; we only abort if it stalls.
  const timeout = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const resetIdle = () => {
    clearTimeout(timer);
    timer = setTimeout(() => timeout.abort(), AI_TIMEOUT_MS);
  };
  resetIdle();
  const signal = opts.signal ? anySignal([opts.signal, timeout.signal]) : timeout.signal;

  try {
    const model = opts.model || (await resolveModel(base, signal));
    const body = buildChatBody(model, { ...opts, temperature, maxTokens }, true);

    let res: Response;
    try {
      res = await fetch(`${base}/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal,
      });
    } catch (cause) {
      throw connectionError(cause, base);
    }
    if (!res.ok || !res.body) {
      const json = (await res.json().catch(() => null)) as
        | { error?: { message?: string } | string }
        | null;
      const detail = typeof json?.error === "string" ? json.error : json?.error?.message;
      throw new AIError(detail || `The AI server returned ${res.status}.`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    while (true) {
      let chunk: ReadableStreamReadResult<Uint8Array>;
      try {
        chunk = await reader.read();
      } catch (cause) {
        throw connectionError(cause, base); // idle-timeout AbortError → friendly AIError
      }
      const { done, value } = chunk;
      if (done) break;
      resetIdle(); // tokens are flowing — push the idle deadline back
      buffer += decoder.decode(value, { stream: true });
      // SSE frames are newline-delimited `data: {…}` lines, ending with [DONE].
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) continue;
        const data = trimmed.slice(5).trim();
        if (data === "[DONE]") return;
        let json: {
          choices?: Array<{
            delta?: { content?: string | ContentPart[] | null; reasoning_content?: string | null };
          }>;
        };
        try {
          json = JSON.parse(data);
        } catch {
          continue; // keep-alive or a split frame — skip
        }
        const delta = json.choices?.[0]?.delta;
        if (!delta) continue;
        const content = extractText(delta.content);
        const reasoning = typeof delta.reasoning_content === "string" ? delta.reasoning_content : "";
        if (content || reasoning) {
          yield { content: content || undefined, reasoning: reasoning || undefined };
        }
      }
    }
  } finally {
    clearTimeout(timer);
  }
}

// ─── internals ───────────────────────────────────────────────────────

// Builds the OpenAI-compatible chat request body shared by chat() and chatStream().
function buildChatBody(
  model: string,
  opts: ChatOptions,
  stream: boolean
): Record<string, unknown> {
  const body: Record<string, unknown> = {
    model,
    messages: opts.messages,
    temperature: opts.temperature ?? 0.7,
    max_tokens: opts.maxTokens ?? -1,
    stream,
  };
  // LM Studio extension: auto-unload a JIT-loaded model after `ttl` idle seconds.
  if (opts.ttl && opts.ttl > 0) body.ttl = opts.ttl;
  if (opts.schema) {
    body.response_format = {
      type: "json_schema",
      json_schema: { name: opts.schema.name, strict: true, schema: opts.schema.schema },
    };
  }
  return body;
}

function connectionError(cause: unknown, base: string): AIError {
  if (cause instanceof DOMException && cause.name === "AbortError") {
    return new AIError("The AI request timed out — the model may be slow or stuck.", { cause });
  }
  return new AIError(
    `Couldn't reach the AI server at ${base}. Is the local server running?`,
    { cause }
  );
}

// AbortSignal.any isn't available on all runtimes — small manual polyfill.
function anySignal(signals: AbortSignal[]): AbortSignal {
  const controller = new AbortController();
  for (const s of signals) {
    if (s.aborted) {
      controller.abort(s.reason);
      break;
    }
    s.addEventListener("abort", () => controller.abort(s.reason), { once: true });
  }
  return controller.signal;
}
