import { describe, expect, it } from "vitest";
import { createSseParser, toStreamEvent, type RawSseEvent } from "./sse";

function collect(chunks: string[]) {
  const out: RawSseEvent[] = [];
  const p = createSseParser((e) => out.push(e));
  chunks.forEach((c) => p.push(c));
  p.flush();
  return out;
}

const STREAM = 'event: delta\ndata: {"text":"Hi"}\n\nevent: done\ndata: {"message_id":"m1"}\n\n';

describe("createSseParser", () => {
  it("parses whole events", () => {
    expect(collect([STREAM])).toEqual([
      { event: "delta", data: '{"text":"Hi"}' },
      { event: "done", data: '{"message_id":"m1"}' },
    ]);
  });

  it("is chunk-boundary independent (every split point)", () => {
    const expected = collect([STREAM]);
    for (let i = 1; i < STREAM.length; i++) {
      expect(collect([STREAM.slice(0, i), STREAM.slice(i)])).toEqual(expected);
    }
  });

  it("handles byte-by-byte delivery and CRLF", () => {
    const crlf = STREAM.replace(/\n/g, "\r\n");
    expect(collect([...crlf])).toEqual(collect([STREAM]));
  });

  it("joins multi-line data with newlines", () => {
    expect(collect(["event: delta\ndata: line1\ndata: line2\n\n"])).toEqual([{ event: "delta", data: "line1\nline2" }]);
  });

  it("ignores comments and defaults the event name", () => {
    expect(collect([": ping\n\ndata: x\n\n"])).toEqual([{ event: "message", data: "x" }]);
  });

  it("flushes an unterminated final event", () => {
    expect(collect(["event: done\ndata: {}"])).toEqual([{ event: "done", data: "{}" }]);
  });
});

describe("toStreamEvent", () => {
  it("maps known events", () => {
    expect(toStreamEvent({ event: "delta", data: '{"text":"a"}' })).toEqual({ type: "delta", text: "a" });
    expect(toStreamEvent({ event: "done", data: '{"message_id":"m"}' })).toEqual({ type: "done", messageId: "m" });
    expect(toStreamEvent({ event: "error", data: '{"message":"x","code":"rate_limited"}' })).toEqual({
      type: "error",
      message: "x",
      code: "rate_limited",
    });
    expect(toStreamEvent({ event: "tool", data: '{"id":"1","name":"n","title":"T","status":"done","row_count":3}' })).toMatchObject({
      type: "tool",
      status: "done",
      rowCount: 3,
    });
  });

  it("ignores unknown events and bad payloads", () => {
    expect(toStreamEvent({ event: "ping", data: "{}" })).toBeNull();
    expect(toStreamEvent({ event: "delta", data: "not json" })).toBeNull();
    expect(toStreamEvent({ event: "tool", data: '{"id":"1","name":"n","status":"weird"}' })).toBeNull();
  });

  it("falls back to provider_error for unknown codes", () => {
    expect(toStreamEvent({ event: "error", data: '{"message":"x","code":"zzz"}' })).toMatchObject({ code: "provider_error" });
  });
});
