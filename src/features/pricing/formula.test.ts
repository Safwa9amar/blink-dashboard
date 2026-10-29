import { describe, expect, it } from "vitest";
import { PIPELINE, paramValue, resolvePipeline } from "./formula";
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
