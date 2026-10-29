import { formatValueShort } from "./format";
import type { Override, TFn } from "./types";
import { WILAYA_OPTIONS } from "./wilayas";

export const intlLocale = (locale: string) => (locale === "ar" ? "ar-DZ-u-nu-latn" : locale);

/** "21 Oct" in Algeria time. */
export const fmtDay = (iso: string, locale: string) =>
  new Date(iso).toLocaleDateString(intlLocale(locale), { timeZone: "Africa/Algiers", day: "numeric", month: "short" });

/** "21 Oct 2026" in Algeria time. */
export const fmtDayYear = (iso: string, locale: string) =>
  new Date(iso).toLocaleDateString(intlLocale(locale), {
    timeZone: "Africa/Algiers",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

export const fmtTime = (iso: string, locale: string) =>
  new Date(iso).toLocaleTimeString(intlLocale(locale), { timeZone: "Africa/Algiers", hour: "2-digit", minute: "2-digit" });

export const wilayaName = (code: string, locale: string) => {
  const w = WILAYA_OPTIONS.find((x) => x.code === code);
  return w ? (locale === "ar" ? w.name_ar : w.name) : code;
};

/** Resolvers for zone / tier names (the override rows only carry ids and codes). */
export type ScopeNames = { zone?: (id: string) => string; tier?: (code: string) => string };

/** "Alger" / "Chez Ali" / "Courier" — the shortest honest name of an override's scope. */
export function scopeShort(
  o: Pick<Override, "service" | "wilaya_code" | "merchant_id" | "agent_id" | "partner_name" | "zone_id" | "tier">,
  locale: string,
  t: TFn,
  names?: ScopeNames,
): string {
  // Place first, then who, then what: "Rural · Tizi Ouzou · Courier".
  const parts = [
    o.zone_id && (names?.zone?.(o.zone_id) ?? t("scope.zone_generic")),
    o.tier && (names?.tier?.(o.tier) ?? o.tier),
    o.wilaya_code && wilayaName(o.wilaya_code, locale),
    (o.merchant_id || o.agent_id) && (o.partner_name || t("partner.generic")),
    o.service && t(`services.${o.service}`),
  ].filter(Boolean) as string[];
  return parts.length ? parts.join(" · ") : t("scope.everywhere");
}

/** "Alger ×1.2 until 21 Oct" — the one-line form of a single override on a fee card. */
export function overrideShort(o: Override, locale: string, t: TFn, names?: ScopeNames): string {
  const value = formatValueShort(o.key, o.value, t);
  const until = o.ends_at ? ` ${t("overrides.until", { date: fmtDay(o.ends_at, locale) })}` : "";
  return `${scopeShort(o, locale, t, names)} ${value}${until}`;
}
