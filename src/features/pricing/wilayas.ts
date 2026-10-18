import { wilayas } from "algeria-locations";

export interface WilayaOption {
  code: string;
  name: string;
  name_ar: string;
}

/** The 58 wilayas, codes "1"…"58" (no zero padding — same codes as the mobile app). */
export const WILAYA_OPTIONS: WilayaOption[] = (wilayas as { code: string | number; name: string; name_ar: string }[]).map(
  (w) => ({ code: String(w.code), name: w.name, name_ar: w.name_ar })
);

const BY_CODE = new Map(WILAYA_OPTIONS.map((w) => [w.code, w]));

export function wilayaLabel(code: string | null | undefined, locale: string): string {
  if (!code) return "";
  const w = BY_CODE.get(code);
  if (!w) return code;
  return `${code} · ${locale === "ar" ? w.name_ar : w.name}`;
}
