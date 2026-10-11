// Client-side display helpers for ⌘K hits and RecordPeek: enum translation and Algiers-time dates.
type Translator = { (key: string): string; has(key: string): boolean };

/** Translate a raw DB enum via `search.enums.<group>.<value>`; falls back to the raw value (underscores spaced). */
export function enumLabel(t: unknown, group: "status" | "type" | "role", value: string | undefined): string {
  if (!value) return "";
  const tr = t as Translator;
  const key = `enums.${group}.${value}`;
  return tr.has(key) ? tr(key) : value.replace(/_/g, " ");
}

/** An ISO timestamp in the viewer's locale on Algiers' clock; "—" when missing or invalid. */
export function formatWhen(iso: string, locale: string): string {
  if (!iso || Number.isNaN(Date.parse(iso))) return "—";
  return new Date(iso).toLocaleString(locale, { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Algiers" });
}
