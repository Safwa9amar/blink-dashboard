import { createSseParser, toStreamEvent } from "./sse";
import type { AssistantErrorCode, StreamEvent } from "./types";

export class AssistantStreamError extends Error {
  constructor(
    public code: AssistantErrorCode,
    message?: string
  ) {
    super(message ?? code);
  }
}

function codeForStatus(status: number): AssistantErrorCode {
  if (status === 403) return "disabled";
  if (status === 404) return "unavailable";
  if (status === 429) return "rate_limited";
  if (status === 408 || status === 504) return "timeout";
  return "provider_error";
}

/**
 * POSTs a chat message straight to blink-server and streams the SSE reply.
 * Fails over to the next base only when fetch itself rejects (no bytes arrived).
 * Rejects with AssistantStreamError; an aborted request rejects with the AbortError.
 */
export async function streamAssistantChat(opts: {
  bases: readonly string[];
  token: string;
  threadId: string;
  message: string;
  locale: string;
  signal: AbortSignal;
  onEvent: (e: StreamEvent) => void;
}): Promise<void> {
  const { bases, token, threadId, message, locale, signal, onEvent } = opts;
  let res: Response | null = null;
  for (const base of bases) {
    try {
      res = await fetch(`${base}/assistant/threads/${encodeURIComponent(threadId)}/chat`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", Accept: "text/event-stream" },
        body: JSON.stringify({ message, locale }),
        signal,
      });
      break;
    } catch (e) {
      if (signal.aborted) throw e;
    }
  }
  if (!res) throw new AssistantStreamError("unavailable");
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { code?: string } | null;
    const code = (["disabled", "rate_limited", "timeout", "not_found"] as const).find((c) => c === body?.code);
    throw new AssistantStreamError(code ?? codeForStatus(res.status));
  }
  if (!res.body) throw new AssistantStreamError("provider_error");

  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
  const parser = createSseParser((raw) => {
    const ev = toStreamEvent(raw);
    if (ev) onEvent(ev);
  });
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      parser.push(value);
    }
    parser.flush();
  } catch (e) {
    if (signal.aborted) throw e;
    throw new AssistantStreamError("provider_error");
  }
}
