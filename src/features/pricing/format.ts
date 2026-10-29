import type { FareFormula, FareTier, Fee, FeeExample, FeeField, FeeValue, PricingKey, StoreDeliveryMode, TFn } from "./types";
import { fieldClass, legsOf } from "./vehicle-classes";

/** Resolves a vehicle class code to a display name (see `useClassName`). */
export type ClassNamer = (code: string) => string;

/** Name for a class when no catalog names are at hand: the two legacy classes are translated, others show their code. */
export const legacyClassName =
  (t: TFn): ClassNamer =>
  (code) =>
    code === "bicycle" || code === "motorcycle" ? t(`vehicle.${code}`) : code;

// ---- field definitions (driven by the server catalog: `fee.fields`) ---------------------

export type FieldUnit = "pct" | "da" | "km" | "x" | "kmh" | "min" | "bool" | "choice" | "tier";

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
  /** Vehicle class code of a fare-leg field (groups the editor by class). */
  classCode?: string;
  /** Allowed values for `choice` / `tier` fields (tier: the server's list, else the live tiers). */
  options?: string[];
}

/** Units rendered as a number input (everything else is a toggle or a select). */
export const isNumericUnit = (u: FieldUnit) => u !== "bool" && u !== "choice" && u !== "tier";

/** 0.05 -> 5 (kills float noise like 0.07 * 100 = 7.000000000000001). */
export const rateToPct = (rate: number) => Number((rate * 100).toFixed(4));
/** 5 -> 0.05 (server rates are 4-decimal fractions). */
export const pctToRate = (pct: number) => Number((pct / 100).toFixed(4));

const UNIT_MAP: Record<FeeField["unit"], FieldUnit> = {
  da: "da",
  rate: "pct",
  km: "km",
  multiplier: "x",
  kmh: "kmh",
  min: "min",
  bool: "bool",
  choice: "choice",
  tier: "tier",
};

/** Input definitions for a fee, from the server's field list (bounds, step, unit). */
export function fieldDefs(fee: Fee | undefined | null): FieldDef[] {
  return (fee?.fields ?? []).map((f) => {
    const path = f.path.split(".");
    const unit = UNIT_MAP[f.unit] ?? "da";
    const pct = unit === "pct";
    const classCode = fieldClass(path, f.class);
    return {
      name: path.join("_"),
      path,
      unit,
      min: pct ? rateToPct(f.min) : f.min,
      max: pct ? rateToPct(f.max) : f.max,
      step: pct ? Number((f.step * 100).toFixed(4)) : f.step,
      // Fare legs share one label set ("base"); other nested fields keep the full path ("speed_kmh_bicycle").
      label: classCode || path.length === 1 ? path[path.length - 1] : path.join("_"),
      ...(classCode ? { classCode } : {}),
      ...(f.options?.length ? { options: f.options } : {}),
    };
  });
}

// ---- rate <-> percent, form <-> value ----------------------------------------------

function getPath(obj: unknown, path: string[]): unknown {
  let cur: unknown = obj;
  for (const p of path) {
    if (cur == null || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[p];
  }
  return cur;
}

export type FeeForm = Record<string, string>;

export function valueToForm(fields: FieldDef[], value: FeeValue | null | undefined): FeeForm {
  const form: FeeForm = {};
  for (const f of fields) {
    const raw = getPath(value, f.path);
    if (!isNumericUnit(f.unit)) {
      form[f.name] = raw === undefined || raw === null ? "" : String(raw);
      continue;
    }
    // A row stored before a field existed (e.g. per_minute) shows 0 when 0 is allowed.
    const n = typeof raw === "number" ? raw : f.min <= 0 && f.max >= 0 && raw === undefined ? 0 : undefined;
    form[f.name] = n === undefined ? "" : String(f.unit === "pct" ? rateToPct(n) : n);
  }
  return form;
}

/** Form strings -> API value (rates back to fractions). Null when any field is not a number. */
export function formToValue(fields: FieldDef[], form: FeeForm): FeeValue | null {
  const out: Record<string, unknown> = {};
  if (!fields.length) return null;
  for (const f of fields) {
    const text = (form[f.name] ?? "").trim();
    let stored: unknown;
    if (f.unit === "bool") {
      if (text !== "true" && text !== "false") return null;
      stored = text === "true";
    } else if (!isNumericUnit(f.unit)) {
      if (text === "") return null;
      stored = text;
    } else {
      const raw = text.replace(",", ".");
      const n = Number(raw);
      if (raw === "" || !Number.isFinite(n)) return null;
      stored = f.unit === "pct" ? pctToRate(n) : n;
    }
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
  return fields.every((f) =>
    isNumericUnit(f.unit)
      ? Number((form[f.name] ?? "").replace(",", ".")) === Number(cur[f.name])
      : (form[f.name] ?? "") === cur[f.name],
  );
}

// ---- display -----------------------------------------------------------------------

export const num = (n: number) => (Number.isInteger(n) ? String(n) : String(Number(n.toFixed(2))));
export const formatPct = (rate: number) => `${num(rateToPct(rate))}%`;
export const formatDa = (n: number, t: TFn) => `${num(n)} ${t("units.da")}`;

function fareLine(name: string, f: FareTier, t: TFn): string {
  const perMin = f.per_minute ? ` ${t("fmt.per_minute", { perMin: formatDa(f.per_minute, t) })}` : "";
  return `${name}: ${t("fmt.fare", {
    base: formatDa(f.base, t),
    perKm: formatDa(f.per_km, t),
    included: num(f.included_km),
    max: num(f.max_km),
  })}${perMin}`;
}

const legLines = (value: unknown, t: TFn, name: ClassNamer) => legsOf(value).map(([code, leg]) => fareLine(name(code), leg, t));
const legBases = (value: unknown, t: TFn) => legsOf(value).map(([, leg]) => formatDa(leg.base, t));

function clampLine(v: { min_fee?: number; max_fee?: number }, t: TFn): string | null {
  const min = v.min_fee ?? 0;
  const max = v.max_fee ?? 0;
  if (!min && !max) return null;
  return t("fmt.store_clamp", { min: formatDa(min, t), max: max ? formatDa(max, t) : "∞" });
}

/** Human-readable lines for a fee value (one per vehicle class for fares). */
export function formatValueLines(key: PricingKey, value: FeeValue | null | undefined, t: TFn, names?: ClassNamer): string[] {
  if (!value) return ["—"];
  const name = names ?? legacyClassName(t);
  const v = value as unknown as Record<string, unknown>;
  switch (key) {
    case "service_fee":
    case "rider_cancel_penalty":
      return [formatDa(v.amount as number, t)];
    case "courier_fare": {
      const lines = legLines(value, t, name);
      lines.push(`${t("fields.extra_stop_fee")}: ${formatDa(v.extra_stop_fee as number, t)}`);
      return lines;
    }
    case "ride_fare": {
      const lines = legLines(value, t, name);
      return lines.length ? lines : ["—"];
    }
    case "store_delivery": {
      const mode = (v.mode as StoreDeliveryMode | undefined) ?? "merchant";
      const lines = [t(`fmt.store_mode.${mode}`)];
      if (mode === "distance") lines.push(...legLines(value, t, name));
      const clamp = clampLine(v, t);
      if (clamp) lines.push(clamp);
      return lines;
    }
    case "fare_multiplier":
      return [`×${num(v.multiplier as number)}`];
    case "fare_formula": {
      const f = value as FareFormula;
      return [
        t("fmt.formula", {
          road: num(f.road_factor),
          step: formatDa(f.rounding_step, t),
          mode: t(`choices.rounding_mode.${f.rounding_mode}`),
        }),
      ];
    }
    case "dropoff_surcharge": {
      const d = value as { amount: number; only_when_tier_changes: boolean };
      return [d.only_when_tier_changes ? t("fmt.surcharge_tier", { amount: formatDa(d.amount, t) }) : formatDa(d.amount, t)];
    }
    case "service_area":
      return [t((value as { enabled: boolean }).enabled ? "fmt.service_on" : "fmt.service_off")];
    case "zone_defaults":
      return [(value as { unzoned_tier: string }).unzoned_tier];
    default:
      return [formatPct(v.rate as number)];
  }
}

/** Single-line version for dense tables. */
export function formatValueInline(key: PricingKey, value: FeeValue | null | undefined, t: TFn, names?: ClassNamer): string {
  return formatValueLines(key, value, t, names).join(" · ");
}

/** Short headline for list cells: "5%", "1.5 Da", "× 1.2", or the fare base prices. */
export function formatValueShort(key: PricingKey, value: FeeValue | null | undefined, t: TFn, names?: ClassNamer): string {
  if (!value) return "—";
  if (key === "courier_fare" || key === "ride_fare") {
    const bases = legBases(value, t);
    return bases.length ? bases.join(" / ") : "—";
  }
  if (key === "store_delivery") {
    const v = value as { mode?: StoreDeliveryMode };
    if (v.mode !== "distance") return t("fmt.store_mode.merchant");
    const bases = legBases(value, t);
    return bases.length ? bases.join(" / ") : t("fmt.store_mode.distance");
  }
  return formatValueLines(key, value, t, names)[0];
}

// ---- server-computed examples ----------------------------------------------------

/**
 * One i18n sentence per fee for a server-built `FeeExample` ("5 km by moto → 330 Da").
 * Pure formatting: every number comes from the server.
 */
export function exampleSentence(key: PricingKey, ex: FeeExample | null | undefined, t: TFn, names?: ClassNamer): string | null {
  if (!ex) return null;
  const output = formatDa(ex.output, t);
  const input = "input" in ex ? formatDa(ex.input, t) : "";
  switch (ex.kind) {
    case "trip_km":
      return t(`examples.${key}`, { km: num(ex.km), vehicle: (names ?? legacyClassName(t))(ex.vehicle), output });
    case "multiplier":
      return t(`examples.${key}`, { km: num(ex.km), input, output });
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
  const v = value as unknown as Record<string, number>;
  if (key === "fare_multiplier") return `×${Number(v.multiplier).toFixed(2)}`;
  if (key === "fare_formula") return `×${num((value as FareFormula).road_factor)}`;
  if (key === "ride_fare" || key === "store_delivery") return formatValueShort(key, value, t);
  return formatValueLines(key, value, t)[0];
}

export function feeByKey(fees: Fee[]): Map<PricingKey, Fee> {
  return new Map(fees.map((f) => [f.key, f]));
}
