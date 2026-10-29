import type { FeeField, FeeValue, PricingKey, Scopes } from "./types";
import { fieldClass, isAppPendingClass } from "./vehicle-classes";

// Pure helpers behind the explanations: what a fee varies by, which help line an input gets,
// and which edits deserve a confirmation. No UI, no i18n here (components translate the codes).

/** What can change a fee's price, in the order a person reads it (place first, then who, then when). */
export type VariesBy = "zone" | "tier" | "wilaya" | "merchant" | "agent" | "service" | "vehicle_class" | "dates";

/**
 * Derived from the catalog, never hard-coded per fee: the fee's `scopes` give the places / partners /
 * services, its fields give the vehicle classes, and any scope at all means an override can be dated.
 */
export function variesBy(fee: { scopes: Scopes; fields?: Pick<FeeField, "path" | "class">[] }): VariesBy[] {
  const s = fee.scopes;
  const out: VariesBy[] = [];
  if (s.zone) out.push("zone");
  if (s.tier) out.push("tier");
  if (s.wilaya) out.push("wilaya");
  if (s.merchant) out.push("merchant");
  if (s.agent) out.push("agent");
  if (s.service?.length) out.push("service");
  if ((fee.fields ?? []).some((f) => !!fieldClass(f.path.split("."), f.class))) out.push("vehicle_class");
  if (out.length) out.push("dates");
  return out;
}

/**
 * Help-text key of an input: its last path segment, so `ride.base` and `bicycle.base` share "base".
 * The two speeds (`speed_kmh.bicycle|motorcycle`) share "speed_kmh".
 */
export function fieldHelpKey(path: string[]): string {
  if (path.length > 1 && path[0] === "speed_kmh") return "speed_kmh";
  return path[path.length - 1] ?? "";
}

// ---- risky changes -------------------------------------------------------------------

export type RiskCode = "service_area_off" | "multiplier_high" | "multiplier_low" | "distance_mode" | "class_app_update" | "all_algeria";

export const MULTIPLIER_HIGH = 1.5;
export const MULTIPLIER_LOW = 0.8;

/** Where a change applies, as far as risk is concerned. */
export type RiskScope = {
  /** A zone, tier, wilaya, merchant or agent narrows the change to part of Algeria. */
  narrowed: boolean;
  /** Has a start or end date, so it stops by itself. */
  dated: boolean;
};

const asRec = (v: unknown) => (v && typeof v === "object" ? (v as Record<string, unknown>) : {});

/**
 * Plain-language warnings to confirm before saving. `current` is the value in effect before the
 * edit (null for a brand new price); nothing is flagged when the value did not change.
 */
export function detectRisks(input: {
  key: PricingKey;
  candidate: FeeValue | null | undefined;
  current?: FeeValue | null;
  scope: RiskScope;
  changed?: boolean;
}): RiskCode[] {
  const { key, candidate, current, scope } = input;
  if (!candidate || input.changed === false) return [];
  const next = asRec(candidate);
  const prev = asRec(current);
  const out: RiskCode[] = [];
  if (key === "service_area" && next.enabled === false && prev.enabled !== false) out.push("service_area_off");
  if (key === "fare_multiplier" && typeof next.multiplier === "number") {
    if (next.multiplier > MULTIPLIER_HIGH) out.push("multiplier_high");
    else if (next.multiplier < MULTIPLIER_LOW) out.push("multiplier_low");
  }
  if (key === "store_delivery" && next.mode === "distance" && prev.mode !== "distance") out.push("distance_mode");
  if (!scope.narrowed && !scope.dated) out.push("all_algeria");
  return out;
}

/** Enabling a class the live app cannot show yet (Moto Comfort). */
export function classEnableRisk(input: { code: string; wasEnabled: boolean; enabled: boolean }): RiskCode[] {
  return !input.wasEnabled && input.enabled && isAppPendingClass({ code: input.code, enabled: false }) ? ["class_app_update"] : [];
}
