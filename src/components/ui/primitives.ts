// Shared, non-visual UI primitives — semantic color variants, class fragments and
// trilingual helpers used across the dashboard component kit.

export type Variant = "primary" | "success" | "info" | "warning" | "danger" | "default";

// ---- button class fragments (used by Button + Toolbar) ----
export const btnBase =
  "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold border transition-colors cursor-pointer";
export const btnSecondary = `${btnBase} border-border bg-card text-text hover:bg-card-hover`;
export const btnPrimary = `${btnBase} border-primary bg-primary text-white hover:bg-primary-hover`;

// ---- form field ----
export const fInput =
  "w-full bg-background border border-border rounded-[10px] px-3.5 py-[11px] text-text text-sm outline-none focus:border-primary";

// ---- trilingual helpers ----
export type Lang = "en" | "fr" | "ar";
export const LANGS: [Lang, string][] = [
  ["en", "English"],
  ["fr", "Français"],
  ["ar", "العربية"],
];
export const emptyLang = (): Record<Lang, string> => ({ en: "", fr: "", ar: "" });
export const dirFor = (lang: Lang) => (lang === "ar" ? "rtl" : "ltr");

// Toggle an item in a multi-select list where one entry ("All") is exclusive.
export function toggleInList(list: string[], item: string, allKey = "All"): string[] {
  if (item === allKey) return [allKey];
  const next = list.includes(item)
    ? list.filter((x) => x !== item)
    : [...list.filter((x) => x !== allKey), item];
  return next.length ? next : [allKey];
}
