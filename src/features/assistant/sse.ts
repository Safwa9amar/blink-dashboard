import type { AssistantErrorCode, StreamEvent } from "./types";

export interface RawSseEvent {
  event: string;
  data: string;
}

/**
 * Incremental Server-Sent-Events parser. Feed it decoded text chunks of any size
 * (a chunk may end mid-line); it calls `onEvent` for every complete event.
 * Supports CRLF/LF/CR line ends, comment lines, and multi-line `data:`.
 */
export function createSseParser(onEvent: (e: RawSseEvent) => void) {
  let buffer = "";
  let event = "";
  let data: string[] = [];

  const dispatch = () => {
    if (data.length > 0) onEvent({ event: event || "message", data: data.join("\n") });
    event = "";
    data = [];
  };

  const handleLine = (line: string) => {
    if (line === "") return dispatch();
    if (line.startsWith(":")) return;
    const i = line.indexOf(":");
    const field = i === -1 ? line : line.slice(0, i);
    let value = i === -1 ? "" : line.slice(i + 1);
    if (value.startsWith(" ")) value = value.slice(1);
    if (field === "event") event = value;
    else if (field === "data") data.push(value);
  };

  return {
    push(chunk: string) {
      buffer += chunk;
      // A trailing "\r" may be the first half of "\r\n": hold it back.
      const hold = buffer.endsWith("\r") ? "\r" : "";
      const text = hold ? buffer.slice(0, -1) : buffer;
      const parts = text.split(/\r\n|\n|\r/);
      buffer = (parts.pop() ?? "") + hold;
      for (const line of parts) handleLine(line);
    },
    /** Call at end of stream: flushes a final unterminated line/event. */
    flush() {
      if (buffer) handleLine(buffer.replace(/\r$/, ""));
      buffer = "";
      dispatch();
    },
  };
}

const CODES: readonly string[] = ["disabled", "rate_limited", "provider_error", "timeout", "not_found"];

/** Maps a raw SSE event to a typed stream event; unknown / malformed events → null. */
export function toStreamEvent(raw: RawSseEvent): StreamEvent | null {
  let json: unknown;
  try {
    json = JSON.parse(raw.data);
  } catch {
    return null;
  }
  if (!json || typeof json !== "object") return null;
  const o = json as Record<string, unknown>;
  switch (raw.event) {
    case "delta":
      return typeof o.text === "string" ? { type: "delta", text: o.text } : null;
    case "done":
      return { type: "done", messageId: typeof o.message_id === "string" ? o.message_id : "" };
    case "error":
      return {
        type: "error",
        message: typeof o.message === "string" ? o.message : "",
        code: (CODES.includes(o.code as string) ? o.code : "provider_error") as AssistantErrorCode,
      };
    case "tool": {
      const status = o.status;
      if (typeof o.id !== "string" || typeof o.name !== "string") return null;
      if (status !== "start" && status !== "done" && status !== "error") return null;
      return {
        type: "tool",
        id: o.id,
        name: o.name,
        title: typeof o.title === "string" ? o.title : o.name,
        status,
        rowCount: typeof o.row_count === "number" ? o.row_count : undefined,
        ms: typeof o.ms === "number" ? o.ms : undefined,
      };
    }
    default:
      return null;
  }
}
