import { describe, expect, it } from "vitest";
import {
  algiersDayStart,
  blinkMoved,
  buildPriceChangesQuery,
  parseFilters,
  percentChange,
  priceDirection,
  toPriceChange,
  toPriceChangePage,
} from "./price-changes";

const row = {
  id: "c1",
  product_id: "p1",
  product_title: "Coca 1L",
  store_id: "s1",
  store_name: "Store One",
  old_price: 100,
  new_price: 80,
  old_blink_price: null,
  new_blink_price: 90,
  source: "staff",
  changed_at: "2026-10-15T10:00:00Z",
  changed_by: { id: "u1", name: "Amine" },
};

describe("toPriceChange", () => {
  it("maps snake_case to the view row", () => {
    const c = toPriceChange(row);
    expect(c).toMatchObject({ productTitle: "Coca 1L", storeName: "Store One", oldPrice: 100, newPrice: 80 });
    expect(c.oldBlinkPrice).toBeNull();
    expect(c.changedBy).toEqual({ id: "u1", name: "Amine" });
  });
  it("handles nulls and unknown sources", () => {
    const c = toPriceChange({ ...row, old_price: null, product_title: null, changed_by: null, source: "weird" });
    expect(c.oldPrice).toBeNull();
    expect(c.productTitle).toBe("—");
    expect(c.changedBy).toBeNull();
    expect(c.source).toBe("system");
  });
});

describe("toPriceChangePage", () => {
  it("derives total_pages", () => {
    const p = toPriceChangePage({ changes: [row], pagination: { page: 2, limit: 50, total: 101 } });
    expect(p).toMatchObject({ page: 2, limit: 50, total: 101, totalPages: 3 });
    expect(p.changes).toHaveLength(1);
  });
  it("tolerates an empty body", () => {
    expect(toPriceChangePage(null)).toMatchObject({ total: 0, totalPages: 1, changes: [] });
  });
});

describe("price move", () => {
  it("computes % and direction", () => {
    expect(percentChange(100, 80)).toBe(-20);
    expect(percentChange(null, 80)).toBeNull();
    expect(percentChange(0, 80)).toBeNull();
    expect(priceDirection(100, 80)).toBe("down");
    expect(priceDirection(80, 100)).toBe("up");
    expect(priceDirection(80, 80)).toBe("same");
    expect(priceDirection(null, 80)).toBe("none");
  });
  it("flags a Blink reference move only with an earlier value", () => {
    expect(blinkMoved({ oldBlinkPrice: 90, newBlinkPrice: 95 })).toBe(true);
    expect(blinkMoved({ oldBlinkPrice: 90, newBlinkPrice: 90 })).toBe(false);
    expect(blinkMoved({ oldBlinkPrice: null, newBlinkPrice: 90 })).toBe(false);
  });
});

describe("filters", () => {
  it("drops invalid params", () => {
    expect(parseFilters({ page: "-2", source: "nope", store: "a b!", from: "15/10/2026", to: "2026-13-45" })).toEqual({
      page: 1,
      storeId: undefined,
      source: undefined,
      from: undefined,
      to: undefined,
    });
  });
  it("keeps valid params", () => {
    expect(parseFilters({ page: "3", source: "staff", store: "abc-123", from: "2026-10-01", to: "2026-10-15" })).toEqual({
      page: 3,
      storeId: "abc-123",
      source: "staff",
      from: "2026-10-01",
      to: "2026-10-15",
    });
  });
  it("converts Algiers days to ISO (to is exclusive: next day)", () => {
    expect(algiersDayStart("2026-10-15")).toBe("2026-10-14T23:00:00.000Z");
    expect(algiersDayStart("2026-10-15", 1)).toBe("2026-10-15T23:00:00.000Z");
  });
  it("builds the server query", () => {
    const q = new URLSearchParams(
      buildPriceChangesQuery({ page: 2, source: "staff", storeId: "s1", productId: "p1", from: "2026-10-01", to: "2026-10-15" })
    );
    expect(q.get("page")).toBe("2");
    expect(q.get("limit")).toBe("50");
    expect(q.get("product_id")).toBe("p1");
    expect(q.get("store_id")).toBe("s1");
    expect(q.get("source")).toBe("staff");
    expect(q.get("from")).toBe("2026-09-30T23:00:00.000Z");
    expect(q.get("to")).toBe("2026-10-15T23:00:00.000Z");
  });
});
