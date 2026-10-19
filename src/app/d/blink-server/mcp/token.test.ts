import { describe, expect, it } from "vitest";
import { generateToken, hashToken, tokenPrefix } from "./token";
import { computeExpiry, deriveStatus, isMissingTable } from "./shared";

describe("mcp token helpers", () => {
  it("generates the exact server format and is unique", () => {
    const a = generateToken();
    expect(a).toMatch(/^blk_mcp_[A-Za-z0-9_-]{43}$/);
    expect(generateToken()).not.toBe(a);
  });
  it("hashes to 64 lowercase hex chars, deterministically", () => {
    const t = generateToken();
    expect(hashToken(t)).toMatch(/^[0-9a-f]{64}$/);
    expect(hashToken(t)).toBe(hashToken(t));
    expect(hashToken("abc")).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
  });
  it("prefix is the first 12 chars", () => {
    const t = generateToken();
    expect(tokenPrefix(t)).toHaveLength(12);
    expect(t.startsWith(tokenPrefix(t))).toBe(true);
  });
  it("computes expiry", () => {
    const now = new Date("2026-01-01T00:00:00.000Z");
    expect(computeExpiry(null, now)).toBeNull();
    expect(computeExpiry(30, now)).toBe("2026-01-31T00:00:00.000Z");
  });
  it("derives status", () => {
    const now = new Date("2026-06-01T00:00:00.000Z");
    expect(deriveStatus({ revoked_at: "2026-05-01T00:00:00Z", expires_at: null }, now)).toBe("revoked");
    expect(deriveStatus({ revoked_at: "2026-05-01T00:00:00Z", expires_at: "2020-01-01T00:00:00Z" }, now)).toBe("revoked");
    expect(deriveStatus({ revoked_at: null, expires_at: "2026-05-01T00:00:00Z" }, now)).toBe("expired");
    expect(deriveStatus({ revoked_at: null, expires_at: "2026-07-01T00:00:00Z" }, now)).toBe("active");
    expect(deriveStatus({ revoked_at: null, expires_at: null }, now)).toBe("active");
  });
  it("detects missing table codes", () => {
    expect(isMissingTable({ code: "42P01" })).toBe(true);
    expect(isMissingTable({ code: "PGRST205" })).toBe(true);
    expect(isMissingTable({ code: "23505" })).toBe(false);
    expect(isMissingTable(null)).toBe(false);
  });
});
