import { describe, expect, it } from "vitest";
import { fieldDefs, formMatchesValue, formToValue, formatValueInline, formatValueShort, isNumericUnit, valueToForm } from "./format";
import type { Fee, TFn } from "./types";

const formulaFee = {
  key: "fare_formula",
  fields: [
    { path: "road_factor", unit: "multiplier", min: 1, max: 3, step: 0.01 },
    { path: "rounding_mode", unit: "choice", min: 0, max: 0, step: 1, options: ["up", "nearest", "down"] },
    { path: "speed_kmh.bicycle", unit: "kmh", min: 5, max: 120, step: 1 },
    { path: "stop_minutes", unit: "min", min: 0, max: 60, step: 1 },
  ],
} as unknown as Fee;

const surchargeFee = {
  key: "dropoff_surcharge",
  fields: [
    { path: "amount", unit: "da", min: 0, max: 5000, step: 1 },
    { path: "only_when_tier_changes", unit: "bool", min: 0, max: 0, step: 1 },
  ],
} as unknown as Fee;

const zoneFee = { key: "zone_defaults", fields: [{ path: "unzoned_tier", unit: "tier", min: 0, max: 0, step: 1 }] } as unknown as Fee;
const legFee = { key: "courier_fare", fields: [{ path: "bicycle.per_minute", unit: "da", min: 0, max: 1000, step: 1 }] } as unknown as Fee;

describe("fieldDefs for the new units", () => {
  it("maps kmh / min / bool / choice / tier and keeps options", () => {
    const defs = fieldDefs(formulaFee);
    expect(defs.map((d) => d.unit)).toEqual(["x", "choice", "kmh", "min"]);
    expect(defs[1].options).toEqual(["up", "nearest", "down"]);
    expect(isNumericUnit("kmh")).toBe(true);
    expect(isNumericUnit("bool")).toBe(false);
    expect(fieldDefs(zoneFee)[0].unit).toBe("tier");
  });
  it("labels nested non-fare paths by their full path, fare legs by the leaf", () => {
    expect(fieldDefs(formulaFee)[2].label).toBe("speed_kmh_bicycle");
    expect(fieldDefs(legFee)[0]).toMatchObject({ label: "per_minute", classCode: "bicycle" });
  });
});

describe("formToValue / valueToForm round trip", () => {
  it("converts bool, choice and nested kmh fields", () => {
    const defs = fieldDefs(formulaFee);
    const form = { road_factor: "1.3", rounding_mode: "nearest", speed_kmh_bicycle: "14", stop_minutes: "3" };
    expect(formToValue(defs, form)).toEqual({ road_factor: 1.3, rounding_mode: "nearest", speed_kmh: { bicycle: 14 }, stop_minutes: 3 });
    const s = fieldDefs(surchargeFee);
    expect(formToValue(s, { amount: "100", only_when_tier_changes: "true" })).toEqual({ amount: 100, only_when_tier_changes: true });
    expect(formToValue(s, { amount: "100", only_when_tier_changes: "false" })).toEqual({ amount: 100, only_when_tier_changes: false });
  });
  it("rejects missing / invalid input", () => {
    const s = fieldDefs(surchargeFee);
    expect(formToValue(s, { amount: "100", only_when_tier_changes: "" })).toBeNull();
    expect(formToValue(s, { amount: "abc", only_when_tier_changes: "true" })).toBeNull();
    expect(formToValue(fieldDefs(zoneFee), { unzoned_tier: "" })).toBeNull();
    expect(formToValue(fieldDefs(zoneFee), { unzoned_tier: "rural" })).toEqual({ unzoned_tier: "rural" });
  });
  it("loads values into the form as strings", () => {
    const s = fieldDefs(surchargeFee);
    expect(valueToForm(s, { amount: 100, only_when_tier_changes: true } as never)).toEqual({ amount: "100", only_when_tier_changes: "true" });
  });
  it("treats a leg stored without per_minute as 0", () => {
    expect(valueToForm(fieldDefs(legFee), { bicycle: { base: 1 } } as never)).toEqual({ bicycle_per_minute: "0" });
  });
  it("compares non-numeric fields as text", () => {
    const s = fieldDefs(surchargeFee);
    const value = { amount: 100, only_when_tier_changes: true } as never;
    expect(formMatchesValue(s, { amount: "100", only_when_tier_changes: "true" }, value)).toBe(true);
    expect(formMatchesValue(s, { amount: "100", only_when_tier_changes: "false" }, value)).toBe(false);
  });
});

describe("formatValueInline for the new keys", () => {
  const t: TFn = (k, v) => `${k}${v ? JSON.stringify(v) : ""}`;
  it("describes surcharge, service area and the unzoned tier", () => {
    expect(formatValueInline("service_area", { enabled: false } as never, t)).toBe("fmt.service_off");
    expect(formatValueInline("zone_defaults", { unzoned_tier: "rural" } as never, t)).toBe("rural");
    expect(formatValueInline("dropoff_surcharge", { amount: 50, only_when_tier_changes: true } as never, t)).toContain("fmt.surcharge_tier");
  });
});

describe("vehicle classes in field defs", () => {
  const classFee = {
    key: "ride_fare",
    fields: [
      { path: "motorcycle_comfort.base", unit: "da", min: 0, max: 5000, step: 1, class: "motorcycle_comfort" },
      { path: "motorcycle_comfort.per_km", unit: "da", min: 0, max: 500, step: 1, class: "motorcycle_comfort" },
      { path: "motorcycle.base", unit: "da", min: 0, max: 5000, step: 1, class: "motorcycle" },
    ],
  } as unknown as Fee;
  it("tags fields with the class the server names and labels them by leaf", () => {
    const defs = fieldDefs(classFee);
    expect(defs.map((d) => d.classCode)).toEqual(["motorcycle_comfort", "motorcycle_comfort", "motorcycle"]);
    expect(defs[0]).toMatchObject({ label: "base", name: "motorcycle_comfort_base" });
  });
  it("derives the class from a leg path on an old catalog (no `class`)", () => {
    const defs = fieldDefs({ key: "ride_fare", fields: [{ path: "motorcycle.base", unit: "da", min: 0, max: 1, step: 1 }] } as unknown as Fee);
    expect(defs[0].classCode).toBe("motorcycle");
  });
  it("round-trips a value with a staff-defined class", () => {
    const defs = fieldDefs(classFee);
    const form = valueToForm(defs, { motorcycle_comfort: { base: 300, per_km: 50 }, motorcycle: { base: 250 } } as never);
    expect(form).toEqual({ motorcycle_comfort_base: "300", motorcycle_comfort_per_km: "50", motorcycle_base: "250" });
    expect(formToValue(defs, form)).toEqual({ motorcycle_comfort: { base: 300, per_km: 50 }, motorcycle: { base: 250 } });
  });
});

describe("store_delivery formatting", () => {
  const t: TFn = (k, v) => `${k}${v ? JSON.stringify(v) : ""}`;
  const leg = (base: number) => ({ base, included_km: 3, per_km: 40, per_minute: 0, max_km: 40 });
  it("shows the mode, the legs only in distance mode and the clamp", () => {
    const merchant = { mode: "merchant", min_fee: 0, max_fee: 0, bicycle: leg(140) } as never;
    expect(formatValueInline("store_delivery", merchant, t)).toBe("fmt.store_mode.merchant");
    const distance = { mode: "distance", min_fee: 100, max_fee: 500, bicycle: leg(140), motorcycle: leg(250) } as never;
    const lines = formatValueInline("store_delivery", distance, t, (c) => c.toUpperCase());
    expect(lines).toContain("fmt.store_mode.distance");
    expect(lines).toContain("BICYCLE");
    expect(lines).toContain("MOTORCYCLE");
    expect(lines).toContain("fmt.store_clamp");
  });
  it("short form lists each class base, or the mode", () => {
    const distance = { mode: "distance", min_fee: 0, max_fee: 0, bicycle: leg(140), motorcycle: leg(250) } as never;
    expect(formatValueShort("store_delivery", distance, t)).toBe("140 units.da / 250 units.da");
    expect(formatValueShort("store_delivery", { mode: "merchant" } as never, t)).toBe("fmt.store_mode.merchant");
  });
  it("lists every class of a ride fare, including Comfort", () => {
    const ride = { motorcycle: leg(250), motorcycle_comfort: leg(300) } as never;
    expect(formatValueShort("ride_fare", ride, t)).toBe("250 units.da / 300 units.da");
  });
});
