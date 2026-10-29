import { describe, expect, it } from "vitest";
import { PIPELINE, paramValue, rawParams, resolvePipeline } from "./formula";
import type { Fee } from "./types";

const fees = [
  { key: "fare_formula", value: { road_factor: 1.3, rounding_step: 10, rounding_mode: "up", speed_kmh: { bicycle: 14, motorcycle: 28 } } },
  { key: "courier_fare", value: { motorcycle: { base: 200, per_km: 30 }, extra_stop_fee: 50 } },
] as unknown as Fee[];

describe("pipeline", () => {
  it("has the six steps of the spec, in order", () => {
    expect(PIPELINE.map((s) => s.id)).toEqual(["km", "time", "raw", "scale", "clamp", "round"]);
  });
  it("reads live values by dotted path", () => {
    expect(paramValue(fees, { fee: "fare_formula", path: "road_factor", label: "x", unit: "x" })).toBe(1.3);
    expect(paramValue(fees, { fee: "fare_formula", path: "speed_kmh.motorcycle", label: "x", unit: "kmh" })).toBe(28);
    expect(paramValue(fees, { fee: "fare_formula", path: "rounding_mode", label: "x", unit: "text" })).toBe("up");
  });
  it("is null for a missing fee or field (e.g. per_minute on an old row)", () => {
    expect(paramValue(fees, { fee: "courier_fare", path: "motorcycle.per_minute", label: "x", unit: "da" })).toBeNull();
    expect(paramValue(fees, { fee: "ride_fare", path: "motorcycle.base", label: "x", unit: "da" })).toBeNull();
  });
  it("resolves every step", () => {
    const r = resolvePipeline(fees);
    expect(r).toHaveLength(6);
    expect(r[0].params[0].value).toBe(1.3);
    expect(r[2].params.find((p) => p.label === "extra_stop_fee")?.value).toBe(50);
  });
});

describe("raw price params with vehicle classes", () => {
  const f = (path: string, cls?: string) => ({ path, unit: "da", min: 0, max: 1, step: 1, ...(cls ? { class: cls } : {}) });
  const classFees = [
    { key: "courier_fare", value: { extra_stop_fee: 50, bicycle: { base: 140 } }, fields: [f("extra_stop_fee"), f("bicycle.base", "bicycle"), f("bicycle.max_km", "bicycle")] },
    {
      key: "ride_fare",
      value: { motorcycle_comfort: { base: 300, per_km: 50 } },
      fields: [f("motorcycle_comfort.base", "motorcycle_comfort"), f("motorcycle_comfort.per_km", "motorcycle_comfort")],
    },
    { key: "store_delivery", value: { mode: "merchant" }, fields: [f("mode")] },
  ] as unknown as Fee[];
  it("generates one param per class leg field from the catalog, grouped by service", () => {
    const refs = rawParams(classFees).filter((r) => r.classCode);
    expect(refs.map((r) => `${r.service}:${r.classCode}:${r.label}`)).toEqual([
      "courier:bicycle:base",
      "ride:motorcycle_comfort:base",
      "ride:motorcycle_comfort:per_km",
    ]);
    expect(resolvePipeline(classFees)[2].params.find((p) => p.classCode === "motorcycle_comfort" && p.label === "base")?.value).toBe(300);
  });
  it("keeps the static moto / bike refs on a catalog without class info", () => {
    const old = [{ key: "courier_fare", value: { motorcycle: { base: 200 }, extra_stop_fee: 50 }, fields: [] }] as unknown as Fee[];
    expect(rawParams(old).some((r) => r.path === "motorcycle.base" && r.fee === "courier_fare")).toBe(true);
    expect(rawParams(old).some((r) => r.classCode)).toBe(false);
  });
  it("shows the marketplace mode and clamp params", () => {
    expect(rawParams(classFees).some((r) => r.fee === "store_delivery" && r.path === "mode")).toBe(true);
    expect(PIPELINE.find((s) => s.id === "clamp")!.params.map((p) => p.path)).toContain("max_fee");
  });
});
