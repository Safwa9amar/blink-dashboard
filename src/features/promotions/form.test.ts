import { describe, expect, it } from "vitest";
import { DEFAULT_FORM, formToWrite, validatePromotionForm, type PromotionFormValues } from "./form";
import { pct, progress } from "./format";

const ok: PromotionFormValues = { ...DEFAULT_FORM, title: "30% off rides", discount_value: "30" };

describe("validatePromotionForm", () => {
  it("accepts a valid promo", () => {
    expect(validatePromotionForm(ok)).toEqual({});
  });
  it("requires a title", () => {
    expect(validatePromotionForm({ ...ok, title: "  " }).title).toBe("title_required");
  });
  it("requires value > 0 unless free delivery", () => {
    expect(validatePromotionForm({ ...ok, discount_value: "0" }).discount_value).toBe("value_positive");
    expect(validatePromotionForm({ ...ok, discount_type: "free_delivery", discount_value: "0" })).toEqual({});
  });
  it("caps percent at 100", () => {
    expect(validatePromotionForm({ ...ok, discount_value: "101" }).discount_value).toBe("percent_max");
    expect(validatePromotionForm({ ...ok, discount_type: "fixed", discount_value: "101" })).toEqual({});
  });
  it("requires ends after starts", () => {
    const e = validatePromotionForm({ ...ok, starts_at: "2026-10-20T10:00", ends_at: "2026-10-19T10:00" });
    expect(e.ends_at).toBe("ends_after_starts");
  });
  it("caps must be positive", () => {
    expect(validatePromotionForm({ ...ok, max_coupons: "0" }).max_coupons).toBe("cap_positive");
    expect(validatePromotionForm({ ...ok, discount_budget: "-5" }).discount_budget).toBe("cap_positive");
    expect(validatePromotionForm({ ...ok, max_coupons: "100", discount_budget: "5000" })).toEqual({});
  });
  it("copy action needs a code", () => {
    expect(validatePromotionForm({ ...ok, action: "copy" }).code).toBe("code_required_copy");
    expect(validatePromotionForm({ ...ok, action: "copy", code: "bk50" })).toEqual({});
  });
});

describe("formToWrite", () => {
  it("maps blanks to null and uppercases the code", () => {
    const w = formToWrite({ ...ok, code: " bk50 ", max_coupons: "", discount_budget: "2500" });
    expect(w.code).toBe("BK50");
    expect(w.max_coupons).toBeNull();
    expect(w.discount_budget).toBe(2500);
    expect(w.starts_at).toBeNull();
  });
  it("zeroes the value for free delivery", () => {
    expect(formToWrite({ ...ok, discount_type: "free_delivery", discount_value: "50" }).discount_value).toBe(0);
  });
});

describe("format helpers", () => {
  it("pct handles zero denominators", () => {
    expect(pct(1, 0)).toBe("—");
    expect(pct(21, 250)).toBe("8.4%");
  });
  it("progress clamps and handles no cap", () => {
    expect(progress(5, null)).toBeNull();
    expect(progress(150, 100)).toBe(100);
    expect(progress(25, 100)).toBe(25);
  });
});
