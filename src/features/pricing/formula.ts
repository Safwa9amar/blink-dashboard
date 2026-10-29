import type { ClassService, Fee, PricingKey } from "./types";
import { fieldClass } from "./vehicle-classes";

// The fixed 6-step fare pipeline (spec: zone-pricing-design "The fare formula"). Each step lists
// the fee fields it reads so the dashboard can show the live value and link to the editor.
// The dashboard never computes a fare: these are display refs only.

export type ParamRef = {
  fee: PricingKey;
  /** Dotted path into the fee value. */
  path: string;
  /** i18n key under `pricing.formula.params.*`. */
  label: string;
  unit: "x" | "da" | "km" | "kmh" | "min" | "text" | "bool";
  /** Vehicle class of a fare-leg param (label = the leg field, e.g. "base"). */
  classCode?: string;
  /** The service this param belongs to, for grouping in the raw-price step. */
  service?: ClassService;
};

export type PipelineStep = { id: "km" | "time" | "raw" | "scale" | "clamp" | "round"; params: ParamRef[] };

const p = (fee: PricingKey, path: string, label: string, unit: ParamRef["unit"]): ParamRef => ({ fee, path, label, unit });

export const PIPELINE: PipelineStep[] = [
  { id: "km", params: [p("fare_formula", "road_factor", "road_factor", "x")] },
  {
    id: "time",
    params: [
      p("fare_formula", "speed_kmh.bicycle", "speed_bicycle", "kmh"),
      p("fare_formula", "speed_kmh.motorcycle", "speed_motorcycle", "kmh"),
    ],
  },
  {
    id: "raw",
    params: [
      p("courier_fare", "motorcycle.base", "courier_moto_base", "da"),
      p("courier_fare", "motorcycle.included_km", "courier_moto_included", "km"),
      p("courier_fare", "motorcycle.per_km", "courier_moto_per_km", "da"),
      p("courier_fare", "motorcycle.per_minute", "courier_moto_per_minute", "da"),
      p("courier_fare", "bicycle.base", "courier_bike_base", "da"),
      p("courier_fare", "bicycle.per_km", "courier_bike_per_km", "da"),
      p("courier_fare", "extra_stop_fee", "extra_stop_fee", "da"),
      p("ride_fare", "motorcycle.base", "ride_base", "da"),
      p("ride_fare", "motorcycle.per_km", "ride_per_km", "da"),
      p("ride_fare", "motorcycle.per_minute", "ride_per_minute", "da"),
      p("dropoff_surcharge", "amount", "dropoff_surcharge", "da"),
      { ...p("store_delivery", "mode", "mode", "text"), service: "store" },
    ],
  },
  { id: "scale", params: [p("fare_multiplier", "multiplier", "multiplier", "x")] },
  {
    id: "clamp",
    params: [
      p("fare_formula", "min_fare", "min_fare", "da"),
      p("fare_formula", "max_fare", "max_fare", "da"),
      { ...p("store_delivery", "min_fee", "min_fee", "da"), service: "store" },
      { ...p("store_delivery", "max_fee", "max_fee", "da"), service: "store" },
    ],
  },
  {
    id: "round",
    params: [p("fare_formula", "rounding_step", "rounding_step", "da"), p("fare_formula", "rounding_mode", "rounding_mode", "text")],
  },
];

export type ResolvedParam = ParamRef & { value: string | number | boolean | null };

/** The live default of one param, from the catalog (null when the fee or field is missing). */
export function paramValue(fees: Fee[], ref: ParamRef): string | number | boolean | null {
  let cur: unknown = fees.find((f) => f.key === ref.fee)?.value;
  for (const seg of ref.path.split(".")) {
    if (cur == null || typeof cur !== "object") return null;
    cur = (cur as Record<string, unknown>)[seg];
  }
  return typeof cur === "number" || typeof cur === "string" || typeof cur === "boolean" ? cur : null;
}

const LEG_FEES: { fee: PricingKey; service: ClassService }[] = [
  { fee: "courier_fare", service: "courier" },
  { fee: "ride_fare", service: "ride" },
  { fee: "store_delivery", service: "store" },
];
/** Leg fields shown per class in the raw-price step. */
const SHOWN_LEG_FIELDS = ["base", "included_km", "per_km", "per_minute"];
const LEG_UNIT: Record<string, ParamRef["unit"]> = { base: "da", included_km: "km", per_km: "da", per_minute: "da" };

/**
 * The raw-price params. Fare legs come from the catalog fields, so every vehicle class the server
 * lists (Comfort included) shows up; an old catalog without class info keeps the static moto / bike refs.
 */
export function rawParams(fees: Fee[]): ParamRef[] {
  const raw = PIPELINE.find((s) => s.id === "raw")!.params;
  const isLeg = (r: ParamRef) => r.path.includes(".") && (r.fee === "courier_fare" || r.fee === "ride_fare");
  const staticLegs = raw.filter(isLeg);
  const others = raw.filter((r) => !isLeg(r));
  const legs: ParamRef[] = [];
  for (const { fee: key, service } of LEG_FEES) {
    const refs: ParamRef[] = [];
    for (const f of fees.find((x) => x.key === key)?.fields ?? []) {
      const path = f.path.split(".");
      const code = fieldClass(path, f.class);
      const leaf = path[path.length - 1];
      if (code && SHOWN_LEG_FIELDS.includes(leaf)) refs.push({ fee: key, path: f.path, label: leaf, unit: LEG_UNIT[leaf], classCode: code, service });
    }
    // An old catalog without class info keeps the static moto / bike refs for this fee.
    legs.push(...(refs.length ? refs : staticLegs.filter((r) => r.fee === key)));
  }
  return [...legs, ...others];
}

export function resolvePipeline(fees: Fee[]): { id: PipelineStep["id"]; params: ResolvedParam[] }[] {
  return PIPELINE.map((s) => {
    const params = s.id === "raw" ? rawParams(fees) : s.params;
    return { id: s.id, params: params.map((r) => ({ ...r, value: paramValue(fees, r) })) };
  });
}
