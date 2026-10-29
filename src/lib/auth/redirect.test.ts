import { describe, expect, it } from "vitest";
import { safeNext } from "./redirect";

describe("safeNext", () => {
  it("keeps same-site relative paths", () => {
    expect(safeNext("/orders/123?tab=route")).toBe("/orders/123?tab=route");
    expect(safeNext("/login/reset")).toBe("/login/reset");
  });

  it("falls back for missing, absolute, protocol-relative or auth-screen targets", () => {
    expect(safeNext(null)).toBe("/");
    expect(safeNext("")).toBe("/");
    expect(safeNext("https://evil.com")).toBe("/");
    expect(safeNext("//evil.com")).toBe("/");
    expect(safeNext("/\\evil.com")).toBe("/");
    expect(safeNext("/login")).toBe("/");
    expect(safeNext("/auth/confirm?x=1", "/inbox")).toBe("/inbox");
  });
});
