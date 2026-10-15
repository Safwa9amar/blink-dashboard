import { describe, expect, it } from "vitest";
import {
  aggregateDemand,
  algiersParts,
  areaLabel,
  bandOf,
  computeAreaGroups,
  computeAreas,
  computeHeat,
  computeHours,
  computeKpis,
  computeStores,
  median,
  rangeStartISO,
} from "./aggregate";
import type { DemandOrder, DemandStore } from "./types";

const order = (o: Partial<DemandOrder>): DemandOrder => ({
  id: Math.random().toString(36).slice(2),
  type: "merchant",
  status: "delivered",
  created_at: "2026-10-14T10:00:00Z",
  rider_assigned_at: null,
  delivered_at: null,
  store_id: null,
  store_name: null,
  pickup_lat: null,
  pickup_lng: null,
  ...o,
});

describe("median", () => {
  it("handles empty, odd and even", () => {
    expect(median([])).toBeNull();
    expect(median([5, 1, 3])).toBe(3);
    expect(median([4, 1, 3, 2])).toBe(2.5);
  });
});

describe("algiers time", () => {
  it("shifts UTC to UTC+1 and rolls the weekday over midnight", () => {
    // 2026-10-14 is a Wednesday; 23:30Z is 00:30 Thursday in Algiers.
    expect(algiersParts("2026-10-14T10:00:00Z")).toEqual({ hour: 11, weekday: 4 });
    expect(algiersParts("2026-10-14T23:30:00Z")).toEqual({ hour: 0, weekday: 5 });
  });
  it("maps Saturday to 0 and Friday to 6", () => {
    expect(algiersParts("2026-10-17T12:00:00Z")?.weekday).toBe(0);
    expect(algiersParts("2026-10-16T12:00:00Z")?.weekday).toBe(6);
  });
  it("bands hours", () => {
    expect([0, 5, 6, 9, 10, 13, 14, 17, 18, 21, 22, 23].map(bandOf)).toEqual([0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5]);
  });
  it("starts ranges at Algiers midnight", () => {
    const now = new Date("2026-10-14T10:00:00Z");
    expect(rangeStartISO("today", now)).toBe("2026-10-13T23:00:00.000Z");
    expect(rangeStartISO("7d", now)).toBe("2026-10-07T23:00:00.000Z");
  });
});

describe("kpis", () => {
  it("computes completion, unmet and medians", () => {
    const orders = [
      order({ status: "delivered", rider_assigned_at: "2026-10-14T10:04:00Z", delivered_at: "2026-10-14T10:30:00Z" }),
      order({ status: "delivered", rider_assigned_at: "2026-10-14T10:10:00Z", delivered_at: "2026-10-14T10:50:00Z" }),
      order({ status: "canceled" }),
      order({ status: "merchant_rejected", rider_assigned_at: "2026-10-14T10:02:00Z" }),
      order({ status: "searching" }),
    ];
    const k = computeKpis(orders);
    expect(k.orders).toBe(5);
    expect(k.finished).toBe(4);
    expect(k.completionRate).toBeCloseTo(0.5);
    expect(k.unmet).toBe(1);
    expect(k.unmetRate).toBeCloseTo(0.2);
    expect(k.medianWait).toBe(4); // waits 4, 10, 2
    expect(k.medianDelivery).toBe(40); // 30, 50
  });
  it("is null-safe when empty", () => {
    const k = computeKpis([]);
    expect(k.completionRate).toBeNull();
    expect(k.unmetRate).toBeNull();
    expect(k.medianWait).toBeNull();
  });
});

describe("hours and heat", () => {
  it("buckets by Algiers hour with status split and median wait", () => {
    const hours = computeHours([
      order({ created_at: "2026-10-14T10:05:00Z", rider_assigned_at: "2026-10-14T10:09:00Z" }),
      order({ created_at: "2026-10-14T10:20:00Z", status: "canceled" }),
      order({ created_at: "2026-10-14T10:40:00Z", status: "on_the_way" }),
    ]);
    expect(hours).toHaveLength(24);
    expect(hours[11]).toMatchObject({ delivered: 1, failed: 1, active: 1, total: 3, medianWait: 4 });
    expect(hours[10].total).toBe(0);
  });
  it("counts weekday x band", () => {
    const h = computeHeat([order({ created_at: "2026-10-14T10:00:00Z" }), order({ created_at: "2026-10-14T10:30:00Z" })]);
    expect(h.cells[4][2]).toBe(2); // Wednesday, 10-14
    expect(h.max).toBe(2);
  });
});

describe("areas", () => {
  const stores: DemandStore[] = [
    { id: "s1", name: "Pizza", city: "Bab Ezzouar", latitude: 36.72, longitude: 3.18 },
    { id: "s2", name: "Grill", city: "Hydra", latitude: 36.74, longitude: 3.04 },
  ];
  it("labels by nearest store city, else coordinates", () => {
    expect(areaLabel(36.725, 3.175, stores)).toBe("Bab Ezzouar");
    expect(areaLabel(36.7, 3.1, [])).toBe("36.700, 3.100");
  });
  it("groups pickups into cells, falls back to store location, counts riders", () => {
    const orders = [
      order({ pickup_lat: 36.7201, pickup_lng: 3.1801, store_id: "s1", status: "canceled" }),
      order({ pickup_lat: 36.7205, pickup_lng: 3.1795, store_id: "s1" }),
      order({ store_id: "s2" }), // no pickup coords -> store coords
      order({}), // nowhere -> skipped
    ];
    const areas = computeAreas(orders, stores, [{ id: "r1", lat: 36.721, lng: 3.18 }]);
    expect(areas).toHaveLength(2);
    expect(areas[0]).toMatchObject({ label: "Bab Ezzouar", orders: 2, unmet: 1, ridersNow: 1 });
    expect(areas[0].unmetRate).toBeCloseTo(0.5);
    expect(areas[0].topStores).toEqual([{ name: "Pizza", orders: 2 }]);
    expect(areas[1]).toMatchObject({ label: "Hydra", orders: 1, ridersNow: 0 });
  });
});

describe("area groups and stores", () => {
  const stores: DemandStore[] = [{ id: "s2", name: "Grill", city: "Hydra", latitude: 36.74, longitude: 3.04 }];
  it("merges cells that share a label into one Top areas row", () => {
    const orders = [
      order({ pickup_lat: 36.74, pickup_lng: 3.04, rider_assigned_at: "2026-10-14T10:02:00Z" }),
      order({ pickup_lat: 36.76, pickup_lng: 3.07, rider_assigned_at: "2026-10-14T10:04:00Z" }), // another cell, nearest city Hydra
    ];
    expect(computeAreas(orders, stores, [])).toHaveLength(2);
    const groups = computeAreaGroups(orders, stores, [{ id: "r1", lat: 36.761, lng: 3.071 }]);
    expect(groups).toHaveLength(1);
    expect(groups[0]).toMatchObject({ label: "Hydra", orders: 2, ridersNow: 1, medianWait: 3 });
  });
  it("keeps courier and ride placeholders out of top stores", () => {
    const orders = [
      order({ store_id: "s2", store_name: "Grill" }),
      order({ type: "courier", store_name: "Courier" }),
      order({ type: "ride", store_name: "Ride" }),
    ];
    expect(computeStores(orders, stores).map((s) => s.name)).toEqual(["Grill"]);
  });
});

describe("aggregateDemand", () => {
  it("returns a full snapshot and counts store completion", () => {
    const s = aggregateDemand({
      range: "7d",
      orders: [
        order({ store_name: "X" }),
        order({ status: "canceled", store_name: "X" }),
        order({ type: "ride", store_name: "Ride" }),
      ],
      stores: [],
      riders: [],
    });
    expect(s.mix).toEqual(expect.arrayContaining([{ type: "merchant", count: 2 }, { type: "ride", count: 1 }]));
    expect(s.stores[0]).toMatchObject({ name: "X", orders: 2, completionRate: 0.5 });
  });
});
