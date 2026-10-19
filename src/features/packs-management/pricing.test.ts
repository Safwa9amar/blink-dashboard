import { describe, expect, it } from "vitest";
import { effectiveDiscount, freeUnits, pricePack, type PricedLine } from "./pricing";
import { toPack } from "./rows";
import type { PackProductRow } from "./types";

const line = (unitPrice: number, quantity: number, promo?: [number, number]): PricedLine => ({
  unitPrice,
  quantity,
  qtyPromo: !!promo,
  buyQty: promo?.[0] ?? 0,
  getQty: promo?.[1] ?? 0,
});

describe("freeUnits", () => {
  it("gives floor(quantity / buy) × get when the promo is on", () => {
    expect(freeUnits(line(100, 5, [2, 1]))).toBe(2);
    expect(freeUnits(line(100, 6, [3, 2]))).toBe(4);
    expect(freeUnits(line(100, 1, [2, 1]))).toBe(0);
  });
  it("gives nothing when the promo is off or incomplete", () => {
    expect(freeUnits({ quantity: 10, qtyPromo: false, buyQty: 2, getQty: 1 })).toBe(0);
    expect(freeUnits(line(100, 10, [0, 1]))).toBe(0);
    expect(freeUnits(line(100, 10, [2, 0]))).toBe(0);
  });
});

describe("effectiveDiscount", () => {
  it("is the percent only when switched on and positive", () => {
    expect(effectiveDiscount(true, 15)).toBe(15);
    expect(effectiveDiscount(false, 15)).toBe(0);
    expect(effectiveDiscount(true, 0)).toBe(0);
  });
});

describe("pricePack", () => {
  it("sums live prices × quantity and takes the rounded % off", () => {
    const p = pricePack([line(250, 2), line(99.99, 1)], true, 15);
    expect(p.originalPrice).toBe(599.99);
    expect(p.discountPercent).toBe(15);
    expect(p.savings).toBe(90); // round(89.9985)
    expect(p.price).toBe(509.99);
    expect(p.itemCount).toBe(3);
    expect(p.freeCount).toBe(0);
  });
  it("ignores the percent while the discount is off", () => {
    const p = pricePack([line(300, 1)], false, 50);
    expect(p).toMatchObject({ originalPrice: 300, discountPercent: 0, savings: 0, price: 300 });
  });
  it("never charges free units", () => {
    const p = pricePack([line(100, 4, [2, 1])], false, 0);
    expect(p.originalPrice).toBe(400);
    expect(p.freeCount).toBe(2);
    expect(p.itemCount).toBe(4);
  });
  it("prices an empty pack at 0", () => {
    expect(pricePack([], true, 20)).toEqual({
      originalPrice: 0,
      discountPercent: 20,
      savings: 0,
      price: 0,
      itemCount: 0,
      freeCount: 0,
    });
  });
});

describe("toPack (shares pricePack)", () => {
  const STORE = "11111111-1111-4111-8111-111111111111";
  const P1 = "22222222-2222-4222-8222-222222222222";
  const P2 = "33333333-3333-4333-8333-333333333333";
  const products = new Map<string, PackProductRow>([
    [P1, { id: P1, store_id: STORE, title: "Milk", price: "120", is_available: true, review_status: "approved" }],
    [P2, { id: P2, store_id: STORE, title: "Bread", price: 30, is_available: false, review_status: "approved" }],
  ]);
  const row = {
    id: "p",
    store_id: STORE,
    name: "Breakfast",
    items: [
      { product_id: P1, quantity: 3, qty_promo_enabled: true, buy_qty: 2, get_qty: 1 },
      { product_id: P2, quantity: 2, qty_promo_enabled: false, buy_qty: 2, get_qty: 1 },
    ],
    discount_enabled: false,
    discount_percent: 25,
    free_delivery: true,
    status: "active",
    created_at: "2026-10-01T00:00:00Z",
    updated_at: "2026-10-02T00:00:00.123456+00:00",
    store: { id: STORE, name: "Shop", delivery_fee: "200" },
  };

  it("prices with the same rules and keeps the stored discount settings", () => {
    const pack = toPack(row, products);
    expect(pack.originalPrice).toBe(420);
    expect(pack.discountPercent).toBe(0);
    expect(pack.discountEnabled).toBe(false);
    expect(pack.discountPercentRaw).toBe(25);
    expect(pack.price).toBe(420);
    expect(pack.freeCount).toBe(1);
    expect(pack.items[1].issue).toBe("unavailable");
    expect(pack.sellable).toBe(false);
    expect(pack.updatedAt).toBe("2026-10-02T00:00:00.123456+00:00");
  });
});
