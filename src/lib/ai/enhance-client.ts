// Client helper for the inline "enhance with AI" buttons. POSTs to an ai-enhance
// route and reads its NDJSON stream, surfacing ONLY the cleaned answer — a
// reasoning model's <think> chain-of-thought is stripped, so the field is never
// polluted with thinking. Returns the final cleaned text ("" if the model
// produced no visible answer, e.g. a reasoning model that only "thinks").
//
// Pass a `signal` (the caller owns an AbortController + total timeout) so a
// runaway/looping reasoning model can never hang the spinner forever.

import { stripReasoning } from "./parse";

function clean(s: string, isHtml: boolean): string {
  let c = stripReasoning(s);
  if (!isHtml) c = c.replace(/^["'\s]+|["'\s]+$/g, ""); // strip wrapping quotes
  return c.trim();
}

export interface EnhanceStreamOpts {
  url: string;
  body: Record<string, unknown>;
  /** Body is HTML (the news editor) — keep tags, don't strip quotes. */
  isHtml?: boolean;
  /** Include cookies in the request. */
  credentials?: "include" | "omit" | "same-origin";
  /** Called with the progressively cleaned answer as content streams in. */
  onLive: (text: string) => void;
  signal: AbortSignal;
}

export async function streamEnhance(opts: EnhanceStreamOpts): Promise<string> {
  const res = await fetch(opts.url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: opts.credentials ?? "include",
    body: JSON.stringify(opts.body),
    signal: opts.signal,
  });
  if (!res.ok || !res.body) {
    const detail = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(detail?.error ?? `Enhancement failed (${res.status}).`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let out = "";
  let streamError: string | null = null;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.trim()) continue;
      const msg = JSON.parse(line) as { type: string; text?: string; message?: string };
      // Only "content" forms the answer; "reasoning" (thinking) is ignored.
      if (msg.type === "content") {
        out += msg.text ?? "";
        const live = clean(out, !!opts.isHtml);
        if (live) opts.onLive(live);
      } else if (msg.type === "error") {
        streamError = msg.message ?? "Enhancement failed";
      }
    }
  }
  if (streamError) throw new Error(streamError);
  return clean(out, !!opts.isHtml);
}
