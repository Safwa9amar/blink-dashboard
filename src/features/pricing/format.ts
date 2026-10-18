import type { FareTier, Fee, FeeValue, PricingKey, TFn } from "./types";

// ---- field definitions per fee key -------------------------------------------------

export type FieldUnit = "pct" | "da" | "km" | "x";

export interface FieldDef {
  /** Flat form-field name (react-hook-form safe, no dots). */
  name: string;
  /** Path into the value object. */
  path: string[];
  unit: FieldUnit;
  /** Display-unit bounds (percent for rates, DA, km, ×). */
  min: number;
  max: number;
  /** i18n key under `pricing.fields.*`. */
  label: string;
  /** Group heading key under `pricing.vehicle.*` (fare tiers). */
  vehicle?: "bicycle" | "motorcycle";
}

const tier = (vehicle: "bicycle" | "motorcycle"): FieldDef[] => [
  { name: `${vehicle}_base`, path: [vehicle, "base"], unit: "da", min: 0, max: 100000, label: "base", vehicle },
  { name: `${vehicle}_included_km`, path: [vehicle, "included_km"], unit: "km", min: 0, max: 100, label: "included_km", vehicle },
  { name: `${vehicle}_per_km`, path: [vehicle, "per_km"], unit: "da", min: 0, max: 10000, label: "per_km", vehicle },
  { name: `${vehicle}_max_km`, path: [vehicle, "max_km"], unit: "km", min: 1, max: 500, label: "max_km", vehicle },
];

const rate = (max: number): FieldDef[] => [
  { name: "rate", path: ["rate"], unit: "pct", min: 0, max: max * 100, label: "rate" },
];

export const KEY_FIELDS: Record<PricingKey, FieldDef[]> = {
  service_fee: [{ name: "amount", path: ["amount"], unit: "da", min: 0, max: 10000, label: "amount" }],
  courier_fare: [
    ...tier("bicycle"),
    ...tier("motorcycle"),
    { name: "extra_stop_fee", path: ["extra_stop_fee"], unit: "da", min: 0, max: 10000, label: "extra_stop_fee" },
  ],
  ride_fare: tier("motorcycle"),
  fare_multiplier: [{ name: "multiplier", path: ["multiplier"], unit: "x", min: 0.5, max: 2, label: "multiplier" }],
  rider_commission_rate: rate(0.5),
  merchant_commission_rate: rate(0.5),
  blink_cash_fee_rate: rate(0.1),
  agent_platform_share: rate(1),
  rider_cancel_penalty: [{ name: "amount", path: ["amount"], unit: "da", min: 0, max: 5000, label: "amount" }],
  stamp_duty_rate: rate(0.2),
  agent_tax_rate: rate(0.2),
  dues_payment_fee_rate: rate(0.05),
};

// ---- rate <-> percent, form <-> value ----------------------------------------------

/** 0.05 -> 5 (kills float noise like 0.07 * 100 = 7.000000000000001). */
export const rateToPct = (rate: number) => Number((rate * 100).toFixed(4));
/** 5 -> 0.05 */
export const pctToRate = (pct: number) => Number((pct / 100).toFixed(6));

function getPath(obj: unknown, path: string[]): number | undefined {
  let cur: unknown = obj;
  for (const p of path) {
    if (cur == null || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[p];
  }
  return typeof cur === "number" ? cur : undefined;
}

export type FeeForm = Record<string, string>;

export function valueToForm(key: PricingKey, value: FeeValue | null | undefined): FeeForm {
  const form: FeeForm = {};
  for (const f of KEY_FIELDS[key]) {
    const n = getPath(value, f.path);
    form[f.name] = n === undefined ? "" : String(f.unit === "pct" ? rateToPct(n) : n);
  }
  return form;
}

/** Form strings -> API value (rates back to fractions). Null when any field is not a number. */
export function formToValue(key: PricingKey, form: FeeForm): FeeValue | null {
  const out: Record<string, unknown> = {};
  for (const f of KEY_FIELDS[key]) {
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
      return [`× ${num(v.multiplier as unknown as number)}`];
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

// ---- fare math for the live example ------------------------------------------------

const ROUND_STEP = 10;

/** base + per-km beyond the included distance (capped at max_km), rounded to 10 DA. */
export function fareFor(tierCfg: FareTier, km: number, multiplier = 1): number {
  const billable = Math.max(0, Math.min(km, tierCfg.max_km) - tierCfg.included_km);
  const raw = (tierCfg.base + billable * tierCfg.per_km) * multiplier;
  return Math.round(raw / ROUND_STEP) * ROUND_STEP;
}

export const SAMPLE_KM = 5;
export const SAMPLE_AMOUNT = 1000;

export type EffectiveMap = Partial<Record<PricingKey, FeeValue>>;

/**
 * "moto 5 km: 330 → 360 Da" — recomputes a sample from the effective values at a scope
 * (`current`) against the same values with `key` replaced by `next`. Null when the fee has
 * no meaningful sample (the caller then shows nothing extra).
 */
export function exampleLine(key: PricingKey, next: FeeValue, current: EffectiveMap, t: TFn): string | null {
  const cur = (k: PricingKey) => current[k];
  const mult = (m?: FeeValue) => (m as FeeValueMultiplier | undefined)?.multiplier ?? 1;
  const motoFare = (courier: FeeValue | undefined, m: FeeValue | undefined) => {
    const c = courier as { motorcycle?: FareTier } | undefined;
    return c?.motorcycle ? fareFor(c.motorcycle, SAMPLE_KM, mult(m)) : null;
  };
  const line = (label: string, a: string, b: string) => `${label}: ${a} → ${b}`;

  if (key === "courier_fare") {
    const a = motoFare(cur("courier_fare"), cur("fare_multiplier"));
    const b = motoFare(next, cur("fare_multiplier"));
    if (a == null || b == null) return null;
    return line(t("example.courier_moto", { km: SAMPLE_KM }), formatDa(a, t), formatDa(b, t));
  }
  if (key === "ride_fare") {
    const r = (v?: FeeValue) => (v as { motorcycle?: FareTier } | undefined)?.motorcycle;
    const ra = r(cur("ride_fare"));
    const rb = r(next);
    if (!ra || !rb) return null;
    return line(
      t("example.ride_moto", { km: SAMPLE_KM }),
      formatDa(fareFor(ra, SAMPLE_KM, mult(cur("fare_multiplier"))), t),
      formatDa(fareFor(rb, SAMPLE_KM, mult(cur("fare_multiplier"))), t)
    );
  }
  if (key === "fare_multiplier") {
    const a = motoFare(cur("courier_fare"), cur("fare_multiplier"));
    const b = motoFare(cur("courier_fare"), next);
    if (a == null || b == null) return null;
    return line(t("example.courier_moto", { km: SAMPLE_KM }), formatDa(a, t), formatDa(b, t));
  }
  if (key === "blink_cash_fee_rate") {
    const r = (v?: FeeValue) => (v as { rate?: number } | undefined)?.rate ?? 0;
    return line(
      t("example.cash_fee", { amount: formatDa(SAMPLE_AMOUNT, t) }),
      formatDa(SAMPLE_AMOUNT * r(cur(key)), t),
      formatDa(SAMPLE_AMOUNT * r(next), t)
    );
  }
  if (key === "rider_commission_rate" || key === "merchant_commission_rate") {
    const r = (v?: FeeValue) => (v as { rate?: number } | undefined)?.rate ?? 0;
    return line(
      t("example.commission", { amount: formatDa(SAMPLE_AMOUNT, t) }),
      formatDa(SAMPLE_AMOUNT * r(cur(key)), t),
      formatDa(SAMPLE_AMOUNT * r(next), t)
    );
  }
  return null;
}

type FeeValueMultiplier = { multiplier: number };

export function feeByKey(fees: Fee[]): Map<PricingKey, Fee> {
  return new Map(fees.map((f) => [f.key, f]));
}
