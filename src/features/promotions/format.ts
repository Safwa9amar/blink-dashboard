// Pure display helpers shared by the promotions and coupons views.
import type { DiscountType } from "./types";

/** "1,250" — grouping only; the caller appends the localized currency label. */
export function fmtNum(n: number | null | undefined, locale?: string): string {
  return Number(n ?? 0).toLocaleString(locale, { maximumFractionDigits: 2 });
}

/** Rate as a percentage string ("8.4%"), or "—" when the denominator is 0. */
export function pct(numerator: number, denominator: number): string {
  if (!denominator) return "—";
  return `${Math.round((numerator / denominator) * 1000) / 10}%`;
}

/** Short discount label: "30%", "500" (fixed, unit added by caller), "" for free delivery. */
export function discountValueLabel(type: DiscountType, value: number): string {
  if (type === "percent") return `${fmtNum(value)}%`;
  if (type === "fixed") return fmtNum(value);
  return "";
}

/** Share of `max` used, clamped 0..100, or null when there is no cap. */
export function progress(value: number, max: number | null): number | null {
  if (max == null || max <= 0) return null;
  return Math.max(0, Math.min(100, (value / max) * 100));
}

export function genCode(len = 8): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < len; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return out;
}
