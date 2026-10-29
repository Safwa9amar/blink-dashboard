import { describe, expect, it } from "vitest";
import { classEnableRisk, detectRisks, fieldHelpKey, variesBy } from "./help";
import ar from "./locales/ar.json";
import en from "./locales/en.json";
import fr from "./locales/fr.json";
import { PRICING_KEYS, type Scopes } from "./types";

const scopes = (s: Partial<Scopes>): Scopes => ({ service: null, wilaya: false, merchant: false, agent: false, ...s });

describe("variesBy", () => {
  it("reads the scopes in reading order and adds dates", () => {
    expect(variesBy({ scopes: scopes({ service: ["courier", "ride"], wilaya: true, zone: true, tier: true }) })).toEqual([
      "zone",
      "tier",
      "wilaya",
      "service",
      "dates",
    ]);
  });
  it("lists partners", () => {
    expect(variesBy({ scopes: scopes({ wilaya: true, merchant: true }) })).toEqual(["wilaya", "merchant", "dates"]);
    expect(variesBy({ scopes: scopes({ wilaya: true, agent: true }) })).toEqual(["wilaya", "agent", "dates"]);
  });
  it("is empty when nothing can vary", () => {
    expect(variesBy({ scopes: scopes({}) })).toEqual([]);
    expect(variesBy({ scopes: scopes({ service: [] }) })).toEqual([]);
  });
  it("adds vehicle classes when the fields are per class", () => {
    const fields = [
      { path: "extra_stop_fee" },
      { path: "motorcycle.base" },
      { path: "motorcycle.per_km" },
    ];
    expect(variesBy({ scopes: scopes({ wilaya: true }), fields })).toEqual(["wilaya", "vehicle_class", "dates"]);
    expect(variesBy({ scopes: scopes({ wilaya: true }), fields: [{ path: "x.base", class: "x" }] })).toContain("vehicle_class");
    expect(variesBy({ scopes: scopes({ wilaya: true }), fields: [{ path: "amount" }] })).not.toContain("vehicle_class");
  });
});

describe("fieldHelpKey", () => {
  it("uses the last segment so per-class legs share help", () => {
    expect(fieldHelpKey(["per_km"])).toBe("per_km");
    expect(fieldHelpKey(["motorcycle", "per_km"])).toBe("per_km");
    expect(fieldHelpKey(["motorcycle_comfort", "base"])).toBe("base");
  });
  it("shares one help for both speeds", () => {
    expect(fieldHelpKey(["speed_kmh", "bicycle"])).toBe("speed_kmh");
    expect(fieldHelpKey(["speed_kmh", "motorcycle"])).toBe("speed_kmh");
  });
});

describe("detectRisks", () => {
  const wide = { narrowed: false, dated: false };
  const narrow = { narrowed: true, dated: false };
  it("flags turning the service area off, but not on", () => {
    expect(detectRisks({ key: "service_area", candidate: { enabled: false }, current: { enabled: true }, scope: narrow })).toEqual(["service_area_off"]);
    expect(detectRisks({ key: "service_area", candidate: { enabled: true }, current: { enabled: false }, scope: narrow })).toEqual([]);
  });
  it("flags multipliers above 1.5 and below 0.8 only", () => {
    const m = (multiplier: number) => detectRisks({ key: "fare_multiplier", candidate: { multiplier }, scope: narrow });
    expect(m(1.6)).toEqual(["multiplier_high"]);
    expect(m(1.5)).toEqual([]);
    expect(m(0.8)).toEqual([]);
    expect(m(0.7)).toEqual(["multiplier_low"]);
  });
  it("flags switching marketplace delivery to distance mode", () => {
    const v = (mode: "merchant" | "distance") => ({ mode, min_fee: 0, max_fee: 0 });
    expect(detectRisks({ key: "store_delivery", candidate: v("distance"), current: v("merchant"), scope: narrow })).toEqual(["distance_mode"]);
    expect(detectRisks({ key: "store_delivery", candidate: v("distance"), current: v("distance"), scope: narrow })).toEqual([]);
    expect(detectRisks({ key: "store_delivery", candidate: v("merchant"), current: v("distance"), scope: narrow })).toEqual([]);
  });
  it("flags an undated change that hits all of Algeria", () => {
    expect(detectRisks({ key: "service_fee", candidate: { amount: 2 }, scope: wide })).toEqual(["all_algeria"]);
    expect(detectRisks({ key: "service_fee", candidate: { amount: 2 }, scope: { narrowed: false, dated: true } })).toEqual([]);
    expect(detectRisks({ key: "service_fee", candidate: { amount: 2 }, scope: narrow })).toEqual([]);
  });
  it("stacks risks and stays quiet when nothing changed", () => {
    expect(detectRisks({ key: "fare_multiplier", candidate: { multiplier: 2 }, scope: wide })).toEqual(["multiplier_high", "all_algeria"]);
    expect(detectRisks({ key: "fare_multiplier", candidate: { multiplier: 2 }, scope: wide, changed: false })).toEqual([]);
    expect(detectRisks({ key: "fare_multiplier", candidate: null, scope: wide })).toEqual([]);
  });
});

describe("classEnableRisk", () => {
  it("flags enabling Moto Comfort", () => {
    expect(classEnableRisk({ code: "motorcycle_comfort", wasEnabled: false, enabled: true })).toEqual(["class_app_update"]);
    expect(classEnableRisk({ code: "motorcycle_comfort", wasEnabled: true, enabled: true })).toEqual([]);
    expect(classEnableRisk({ code: "bicycle", wasEnabled: false, enabled: true })).toEqual([]);
  });
});

// ---- locale integrity -------------------------------------------------------------------

const flat = (o: unknown, p = ""): Record<string, string> =>
  Object.entries(o as Record<string, unknown>).reduce<Record<string, string>>(
    (acc, [k, v]) => (v && typeof v === "object" ? { ...acc, ...flat(v, `${p}${k}.`) } : { ...acc, [`${p}${k}`]: String(v) }),
    {},
  );
const L = { en: flat(en), fr: flat(fr), ar: flat(ar) };

describe("pricing locales", () => {
  it("have identical key sets", () => {
    const keys = Object.keys(L.en).sort();
    expect(Object.keys(L.fr).sort()).toEqual(keys);
    expect(Object.keys(L.ar).sort()).toEqual(keys);
  });
  it("explain every fee", () => {
    for (const l of ["en", "fr", "ar"] as const) {
      for (const key of PRICING_KEYS) {
        for (const part of ["name", "desc", "what", "applies_to", "example"]) {
          expect(L[l][`pricing.fees.${key}.${part}`], `${l} ${key}.${part}`).toBeTruthy();
        }
        // Each fee says who pays or who earns.
        expect(!!L[l][`pricing.fees.${key}.who_pays`] || !!L[l][`pricing.fees.${key}.who_earns`] || key === "service_area" || key === "zone_defaults", `${l} ${key} who`).toBe(true);
      }
    }
  });
  it("help every input", () => {
    const inputs = [
      "base", "included_km", "per_km", "per_minute", "max_km", "road_factor", "rounding_step", "rounding_mode", "min_fare", "max_fare",
      "min_ride_km", "speed_kmh", "stop_minutes", "boarding_minutes", "extra_stop_fee", "amount", "rate", "multiplier",
      "only_when_tier_changes", "enabled", "unzoned_tier", "mode", "min_fee", "max_fee",
    ];
    for (const l of ["en", "fr", "ar"] as const) {
      for (const k of inputs) expect(L[l][`pricing.fieldHelp.${k}`], `${l} ${k}`).toBeTruthy();
      for (const o of ["up", "nearest", "down"]) expect(L[l][`pricing.choices_help.rounding_mode.${o}`]).toBeTruthy();
      for (const o of ["merchant", "distance"]) expect(L[l][`pricing.choices_help.mode.${o}`]).toBeTruthy();
    }
  });
  it("keep the same placeholders and tags in every language", () => {
    const sig = (s: string) => (s.match(/\{[a-z_]+|<\/?[a-z]+>/gi) ?? []).map((x) => x.replace(/^\{/, "{")).sort().join(",");
    for (const [k, v] of Object.entries(L.en)) {
      if (!k.startsWith("pricing.")) continue;
      // plural bodies differ per language: compare only top-level placeholders and tags
      if (v.includes("plural")) continue;
      expect(sig(L.fr[k]), `fr ${k}`).toBe(sig(v));
      expect(sig(L.ar[k]), `ar ${k}`).toBe(sig(v));
    }
  });
});
