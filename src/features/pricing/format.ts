import type { FareTier, Fee, FeeExample, FeeField, FeeValue, PricingKey, TFn } from "./types";

// ---- field definitions (driven by the server catalog: `fee.fields`) ---------------------

export type FieldUnit = "pct" | "da" | "km" | "x";

export interface FieldDef {
  /** Flat form-field name (react-hook-form safe, no dots). */
  name: string;
  /** Path into the value object. */
  path: string[];
  unit: FieldUnit;
  /** Display-unit bounds/step (percent for rates, DA, km, ×). */
  min: number;
  max: number;
  step: number;
  /** i18n key under `pricing.fields.*` (last path segment). */
  label: string;
  /** Group heading key under `pricing.vehicle.*` (fare tiers). */
  vehicle?: "bicycle" | "motorcycle";
}

/** 0.05 -> 5 (kills float noise like 0.07 * 100 = 7.000000000000001). */
export const rateToPct = (rate: number) => Number((rate * 100).toFixed(4));
/** 5 -> 0.05 (server rates are 4-decimal fractions). */
export const pctToRate = (pct: number) => Number((pct / 100).toFixed(4));

const UNIT_MAP: Record<FeeField["unit"], FieldUnit> = {
  da: "da",
  rate: "pct",
  km: "km",
  multiplier: "x",
};

/** Input definitions for a fee, from the server's field list (bounds, step, unit). */
export function fieldDefs(fee: Fee | undefined | null): FieldDef[] {
  return (fee?.fields ?? []).map((f) => {
    const path = f.path.split(".");
    const unit = UNIT_MAP[f.unit] ?? "da";
    const pct = unit === "pct";
    const head = path[0];
    return {
      name: path.join("_"),
      path,
      unit,
      min: pct ? rateToPct(f.min) : f.min,
      max: pct ? rateToPct(f.max) : f.max,
      step: pct ? Number((f.step * 100).toFixed(4)) : f.step,
      label: path[path.length - 1],
      vehicle: path.length > 1 && (head === "bicycle" || head === "motorcycle") ? head : undefined,
    };
  });
}

// ---- rate <-> percent, form <-> value ----------------------------------------------

function getPath(obj: unknown, path: string[]): number | undefined {
  let cur: unknown = obj;
  for (const p of path) {
    if (cur == null || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[p];
  }
  return typeof cur === "number" ? cur : undefined;
}

export type FeeForm = Record<string, string>;

export function valueToForm(fields: FieldDef[], value: FeeValue | null | undefined): FeeForm {
  const form: FeeForm = {};
  for (const f of fields) {
    const n = getPath(value, f.path);
    form[f.name] = n === undefined ? "" : String(f.unit === "pct" ? rateToPct(n) : n);
  }
  return form;
}

/** Form strings -> API value (rates back to fractions). Null when any field is not a number. */
export function formToValue(fields: FieldDef[], form: FeeForm): FeeValue | null {
  const out: Record<string, unknown> = {};
  if (!fields.length) return null;
  for (const f of fields) {
    const raw = (form[f.name] ?? "").trim().replace(",", ".");
    const n = Number(raw);
    if (raw === "" || !Number.isFinite(n)) return null;
    const stored = f.unit === "pct" ? pctToRate(n) : n;
    let cur = out;
    f.path.forEach((seg, i) => {
      if (i === f.path.length - 1) cur[seg] = stored;
      else cur = (cur[seg] ??= {}) as Record<string, unknown>;
    });
  }
  return out as FeeValue;
}

/** True when the form holds the same numbers as `value` (field by field). */
export function formMatchesValue(fields: FieldDef[], form: FeeForm, value: FeeValue | null | undefined): boolean {
  const cur = valueToForm(fields, value);
  return fields.every((f) => Number((form[f.name] ?? "").replace(",", ".")) === Number(cur[f.name]));
}

// ---- display -----------------------------------------------------------------------

export const num = (n: number) => (Number.isInteger(n) ? String(n) : String(Number(n.toFixed(2))));
export const formatPct = (rate: number) => `${num(rateToPct(rate))}%`;
export const formatDa = (n: number, t: TFn) => `${num(n)} ${t("units.da")}`;

function fareLine(vehicle: "bicycle" | "motorcycle", f: FareTier, t: TFn): string {
  return `${t(`vehicle.${vehicle}`)}: ${t("fmt.fare", {
    base: formatDa(f.base, t),
    perKm: formatDa(f.per_km, t),
    included: num(f.included_km),
    max: num(f.max_km),
  })}`;
}

/** Human-readable lines for a fee value (one per vehicle for fares). */
export function formatValueLines(key: PricingKey, value: FeeValue | null | undefined, t: TFn): string[] {
  if (!value) return ["—"];
  const v = value as unknown as Record<string, unknown> & Record<string, FareTier>;
  switch (key) {
    case "service_fee":
    case "rider_cancel_penalty":
      return [formatDa(v.amount as unknown as number, t)];
    case "courier_fare": {
      const lines: string[] = [];
      if (v.bicycle) lines.push(fareLine("bicycle", v.bicycle, t));
      if (v.motorcycle) lines.push(fareLine("motorcycle", v.motorcycle, t));
      lines.push(`${t("fields.extra_stop_fee")}: ${formatDa(v.extra_stop_fee as unknown as number, t)}`);
      return lines;
    }
    case "ride_fare":
      return v.motorcycle ? [fareLine("motorcycle", v.motorcycle, t)] : ["—"];
    case "fare_multiplier":
      return [`×${num(v.multiplier as unknown as number)}`];
    default:
      return [formatPct(v.rate as unknown as number)];
  }
}

/** Single-line version for dense tables. */
export function formatValueInline(key: PricingKey, value: FeeValue | null | undefined, t: TFn): string {
  return formatValueLines(key, value, t).join(" · ");
}

/** Short headline for list cells: "5%", "1.5 Da", "× 1.2", or the fare base prices. */
export function formatValueShort(key: PricingKey, value: FeeValue | null | undefined, t: TFn): string {
  if (!value) return "—";
  const v = value as unknown as Record<string, FareTier & number>;
  if (key === "courier_fare") return `${formatDa(v.bicycle.base, t)} / ${formatDa(v.motorcycle.base, t)}`;
  if (key === "ride_fare") return formatDa(v.motorcycle.base, t);
  return formatValueLines(key, value, t)[0];
}

// ---- server-computed examples ----------------------------------------------------

/**
 * One i18n sentence per fee for a server-built `FeeExample` ("5 km by moto → 330 Da").
 * Pure formatting: every number comes from the server.
 */
export function exampleSentence(key: PricingKey, ex: FeeExample | null | undefined, t: TFn): string | null {
  if (!ex) return null;
  const output = formatDa(ex.output, t);
  const input = "input" in ex ? formatDa(ex.input, t) : "";
  switch (ex.kind) {
    case "trip_km":
      return t(`examples.${key}`, { km: num(ex.km), vehicle: t(`vehicle_short.${ex.vehicle}`), output });
    case "multiplier":
      return t(`examples.${key}`, { km: num(ex.input), output });
    case "per_checkout":
    case "amount":
      return t(`examples.${key}`, { output });
    default:
      return t(`examples.${key}`, { input, output });
  }
}

/** Big headline for a fee card: "5%", "1.5 Da", "×1.00"; null for the courier tariff card. */
export function bigValue(key: PricingKey, value: FeeValue | null | undefined, t: TFn): string {
  if (!value) return "—";
  const v = value as unknown as Record<string, FareTier & number>;
  if (key === "fare_multiplier") return `×${Number(v.multiplier).toFixed(2)}`;
  if (key === "ride_fare") return formatDa(v.motorcycle.base, t);
  return formatValueLines(key, value, t)[0];
}

export function feeByKey(fees: Fee[]): Map<PricingKey, Fee> {
  return new Map(fees.map((f) => [f.key, f]));
}
