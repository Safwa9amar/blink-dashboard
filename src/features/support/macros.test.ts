import { describe, expect, it } from "vitest";
import { macrosFor, parseMacroInput, searchMacros } from "./macros";

const m = (o: object) => ({ title: "t", body: "b", locale: null, target_role: null, ...o });

describe("parseMacroInput", () => {
  it("trims and accepts any/any", () => {
    expect(parseMacroInput({ title: " Hi ", body: " yo ", locale: "", target_role: null })).toEqual({
      ok: true,
      value: { title: "Hi", body: "yo", locale: null, target_role: null },
    });
  });
  it("rejects bad fields", () => {
    expect(parseMacroInput({ title: "", body: "x" })).toEqual({ ok: false, error: "title" });
    expect(parseMacroInput({ title: "x", body: " " })).toEqual({ ok: false, error: "body" });
    expect(parseMacroInput({ title: "x", body: "y", locale: "de" })).toEqual({ ok: false, error: "locale" });
    expect(parseMacroInput({ title: "x", body: "y", target_role: "admin" })).toEqual({ ok: false, error: "role" });
  });
});

describe("macrosFor", () => {
  const list = [m({}), m({ locale: "fr" }), m({ target_role: "rider" }), m({ locale: "ar", target_role: "customer" })];
  it("filters by locale and role", () => {
    expect(macrosFor(list, { locale: "fr", role: "customer" })).toHaveLength(2);
    expect(macrosFor(list, { locale: "ar", role: "customer" })).toHaveLength(2);
    expect(macrosFor(list, { locale: "en", role: "rider" })).toHaveLength(2);
  });
  it("keeps all when the conversation is unknown", () => {
    expect(macrosFor(list, {})).toHaveLength(4);
  });
});

describe("searchMacros", () => {
  it("matches title or body case-insensitively", () => {
    const l = [m({ title: "Refund" }), m({ body: "Payout soon" })];
    expect(searchMacros(l, "refu")).toHaveLength(1);
    expect(searchMacros(l, "PAYOUT")).toHaveLength(1);
    expect(searchMacros(l, " ")).toHaveLength(2);
  });
});
