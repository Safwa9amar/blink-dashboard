import { describe, expect, it } from "vitest";
import { bounceSignedIn, safeNext } from "./redirect";

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

describe("bounceSignedIn", () => {
  it("bounces signed-in page loads off the sign-in screens", () => {
    expect(bounceSignedIn("GET", "/login")).toBe(true);
    expect(bounceSignedIn("GET", "/login/forgot/")).toBe(true);
    expect(bounceSignedIn("HEAD", "/login")).toBe(true);
  });

  it("never bounces the sign-in form's server actions or the other auth screens", () => {
    expect(bounceSignedIn("POST", "/login")).toBe(false);
    expect(bounceSignedIn("GET", "/login/mfa")).toBe(false);
    expect(bounceSignedIn("GET", "/login/reset")).toBe(false);
    expect(bounceSignedIn("GET", "/auth/confirm")).toBe(false);
  });
});
