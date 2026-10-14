import { describe, expect, it } from "vitest";
import { promotionAvailability, type AvailabilityInput } from "./availability";

const NOW = new Date("2026-10-14T12:00:00Z");
const base: AvailabilityInput = {
  archived_at: null,
  is_active: true,
  starts_at: null,
  ends_at: null,
  max_coupons: null,
  discount_budget: null,
};
const none = { issued: 0, discount_given: 0 };

describe("promotionAvailability", () => {
  it("is live with no constraints", () => {
    expect(promotionAvailability(base, none, NOW)).toBe("live");
  });
  it("archived wins over everything", () => {
    const p = { ...base, archived_at: "2026-10-01T00:00:00Z", is_active: false, ends_at: "2026-01-01T00:00:00Z" };
    expect(promotionAvailability(p, none, NOW)).toBe("archived");
  });
  it("paused beats scheduled / ended / sold out", () => {
    const p = { ...base, is_active: false, starts_at: "2027-01-01T00:00:00Z", max_coupons: 1 };
    expect(promotionAvailability(p, { issued: 5, discount_given: 0 }, NOW)).toBe("paused");
  });
  it("scheduled when it starts in the future", () => {
    expect(promotionAvailability({ ...base, starts_at: "2026-10-15T00:00:00Z" }, none, NOW)).toBe("scheduled");
  });
  it("ended when ends_at is past", () => {
    expect(promotionAvailability({ ...base, ends_at: "2026-10-13T00:00:00Z" }, none, NOW)).toBe("ended");
  });
  it("ended beats sold_out", () => {
    const p = { ...base, ends_at: "2026-10-13T00:00:00Z", max_coupons: 1 };
    expect(promotionAvailability(p, { issued: 1, discount_given: 0 }, NOW)).toBe("ended");
  });
  it("sold_out at exactly max_coupons", () => {
    expect(promotionAvailability({ ...base, max_coupons: 10 }, { issued: 10, discount_given: 0 }, NOW)).toBe("sold_out");
    expect(promotionAvailability({ ...base, max_coupons: 10 }, { issued: 9, discount_given: 0 }, NOW)).toBe("live");
  });
  it("sold_out beats budget_spent", () => {
    const p = { ...base, max_coupons: 1, discount_budget: 100 };
    expect(promotionAvailability(p, { issued: 1, discount_given: 100 }, NOW)).toBe("sold_out");
  });
  it("budget_spent once the discount reaches the budget", () => {
    const p = { ...base, discount_budget: 1000 };
    expect(promotionAvailability(p, { issued: 3, discount_given: 1000 }, NOW)).toBe("budget_spent");
    expect(promotionAvailability(p, { issued: 3, discount_given: 999.99 }, NOW)).toBe("live");
  });
  it("treats a start in the past and an end in the future as live", () => {
    const p = { ...base, starts_at: "2026-10-01T00:00:00Z", ends_at: "2026-11-01T00:00:00Z" };
    expect(promotionAvailability(p, none, NOW)).toBe("live");
  });
});
