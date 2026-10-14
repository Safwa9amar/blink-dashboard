import { describe, expect, it } from "vitest";
import { categoryToArt, couponStatus } from "./status";
import { EMPTY_ISSUE, validateIssue } from "./issue";

const NOW = new Date("2026-10-14T12:00:00Z");
const open = { revoked_at: null, used_at: null, expires_at: null };

describe("couponStatus", () => {
  it("is active with no expiry", () => expect(couponStatus(open, NOW)).toBe("active"));
  it("expired when expires_at is past", () =>
    expect(couponStatus({ ...open, expires_at: "2026-10-13T00:00:00Z" }, NOW)).toBe("expired"));
  it("used beats expired", () =>
    expect(couponStatus({ ...open, used_at: "2026-10-01T00:00:00Z", expires_at: "2026-10-02T00:00:00Z" }, NOW)).toBe("used"));
  it("revoked beats everything", () =>
    expect(couponStatus({ revoked_at: "2026-10-10T00:00:00Z", used_at: "2026-10-01T00:00:00Z", expires_at: null }, NOW)).toBe("revoked"));
});

describe("categoryToArt", () => {
  it("maps categories to coupon art", () => {
    expect(categoryToArt("SUPERMARKET")).toBe("market");
    expect(categoryToArt("RIDES")).toBe("rides");
    expect(categoryToArt("WHATEVER")).toBe("others");
  });
});

describe("validateIssue", () => {
  const base = { ...EMPTY_ISSUE, userId: "u1", code: "ab12cd34" };
  it("accepts a from-promotion issue", () => {
    expect(validateIssue({ ...base, promotionId: "p1" }, NOW)).toEqual({});
  });
  it("requires a customer, a promotion and a valid code", () => {
    const e = validateIssue({ ...EMPTY_ISSUE, code: "x" }, NOW);
    expect(e.userId).toBe("customer_required");
    expect(e.promotionId).toBe("promotion_required");
    expect(e.code).toBe("code_format");
  });
  it("validates custom values and a future expiry", () => {
    const c = { ...base, mode: "custom" as const, title: "Gift", discount_value: "10", expires_at: "2026-11-01T00:00:00Z" };
    expect(validateIssue(c, NOW)).toEqual({});
    expect(validateIssue({ ...c, discount_value: "150" }, NOW).discount_value).toBe("percent_max");
    expect(validateIssue({ ...c, expires_at: "2026-10-01T00:00:00Z" }, NOW).expires_at).toBe("expiry_future");
    expect(validateIssue({ ...c, expires_at: "" }, NOW).expires_at).toBe("expiry_required");
  });
});
