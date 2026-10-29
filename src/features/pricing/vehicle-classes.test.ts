import { describe, expect, it } from "vitest";
import {
  classCodesForService,
  classNameOrNull,
  classesForRider,
  classesForService,
  feeClassCodes,
  fieldClass,
  isAppPendingClass,
  legsOf,
  liveClasses,
  mergeLegs,
  pickVehicle,
} from "./vehicle-classes";
import type { Fee, VehicleClass } from "./types";

const cls = (code: string, p: Partial<VehicleClass> = {}): VehicleClass => ({
  code,
  names: { en: code.toUpperCase(), fr: `${code}-fr`, ar: `${code}-ar` },
  base_vehicle: "motorcycle",
  services: ["ride", "courier", "store"],
  exclusive: false,
  enabled: true,
  sort_order: 10,
  note: null,
  archived_at: null,
  ...p,
});

const classes = [
  cls("motorcycle_comfort", { services: ["ride"], exclusive: true, enabled: false, sort_order: 30 }),
  cls("bicycle", { base_vehicle: "bicycle", services: ["courier", "store"], sort_order: 10 }),
  cls("motorcycle", { sort_order: 20 }),
  cls("old", { archived_at: "2026-01-01", sort_order: 5 }),
];

describe("class lists", () => {
  it("drops archived classes and sorts by sort_order", () => {
    expect(liveClasses(classes).map((c) => c.code)).toEqual(["bicycle", "motorcycle", "motorcycle_comfort"]);
  });
  it("keeps only classes serving the service", () => {
    expect(classesForService(classes, "ride").map((c) => c.code)).toEqual(["motorcycle", "motorcycle_comfort"]);
    expect(classesForService(classes, "store").map((c) => c.code)).toEqual(["bicycle", "motorcycle"]);
  });
  it("falls back to bicycle / motorcycle when the server sends no classes", () => {
    expect(classCodesForService([], "ride")).toEqual(["motorcycle"]);
    expect(classCodesForService([], "courier")).toEqual(["motorcycle", "bicycle"]);
    expect(classCodesForService(classes, "ride")).toEqual(["motorcycle", "motorcycle_comfort"]);
  });
  it("names a class per locale, null when unknown", () => {
    expect(classNameOrNull(classes, "bicycle", "fr")).toBe("bicycle-fr");
    expect(classNameOrNull(classes, "bicycle", "ar")).toBe("bicycle-ar");
    expect(classNameOrNull(classes, "bicycle", "en")).toBe("BICYCLE");
    expect(classNameOrNull(classes, "ghost", "en")).toBeNull();
  });
});

describe("rider class picker", () => {
  it("offers only classes of the rider's base vehicle", () => {
    expect(classesForRider(classes, "motorcycle").map((c) => c.code)).toEqual(["motorcycle", "motorcycle_comfort"]);
    expect(classesForRider(classes, "bicycle").map((c) => c.code)).toEqual(["bicycle"]);
    expect(classesForRider(classes, null)).toEqual([]);
  });
  it("flags the seeded Comfort class while it is off", () => {
    expect(isAppPendingClass(classes[0])).toBe(true);
    expect(isAppPendingClass({ code: "motorcycle_comfort", enabled: true })).toBe(false);
    expect(isAppPendingClass(classes[2])).toBe(false);
  });
});

describe("fare legs", () => {
  it("reads a class from the server field or a leg path", () => {
    expect(fieldClass(["x", "base"], "x")).toBe("x");
    expect(fieldClass(["motorcycle_comfort", "per_km"])).toBe("motorcycle_comfort");
    expect(fieldClass(["speed_kmh", "bicycle"])).toBeUndefined();
    expect(fieldClass(["extra_stop_fee"])).toBeUndefined();
  });
  it("lists the legs of a value, ignoring scalars", () => {
    const v = { extra_stop_fee: 50, mode: "distance", bicycle: { base: 140 }, motorcycle_comfort: { base: 300 } };
    expect(legsOf(v).map(([c]) => c)).toEqual(["bicycle", "motorcycle_comfort"]);
    expect(legsOf(null)).toEqual([]);
  });
  it("merges a partial override over the default legs", () => {
    const base = { extra_stop_fee: 50, bicycle: { base: 1, per_km: 2 }, motorcycle: { base: 3, per_km: 4 } };
    const over = { extra_stop_fee: 60, motorcycle: { base: 9 } };
    expect(mergeLegs(base, over as never)).toEqual({
      extra_stop_fee: 60,
      bicycle: { base: 1, per_km: 2 },
      motorcycle: { base: 9, per_km: 4 },
    });
  });
  it("collects the classes of a fee from its fields, in order", () => {
    const fee = {
      fields: [
        { path: "extra_stop_fee", unit: "da" },
        { path: "bicycle.base", unit: "da", class: "bicycle" },
        { path: "bicycle.per_km", unit: "da", class: "bicycle" },
        { path: "motorcycle.base", unit: "da" },
      ],
    } as unknown as Fee;
    expect(feeClassCodes(fee)).toEqual(["bicycle", "motorcycle"]);
    expect(feeClassCodes(null)).toEqual([]);
  });
});

describe("pickVehicle", () => {
  it("keeps an offered class and otherwise falls to the first", () => {
    expect(pickVehicle(["motorcycle", "motorcycle_comfort"], "motorcycle_comfort")).toBe("motorcycle_comfort");
    expect(pickVehicle(["motorcycle"], "bicycle")).toBe("motorcycle");
    expect(pickVehicle(["motorcycle"], "")).toBe("motorcycle");
    expect(pickVehicle([], "bicycle")).toBe("");
  });
});
