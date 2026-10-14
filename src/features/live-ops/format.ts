// Client-side formatting helpers. `now` is null until the page has mounted, so relative
// times render as "—" on the server and first client paint (no hydration mismatch).
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- accepts the typed next-intl translator
export type Tr = { has: (k: any) => boolean; (k: any, v?: any): string };

export function agoLabel(t: Tr, iso: string | null | undefined, now: number | null): string {
  if (!iso || now == null) return "—";
  const s = Math.max(0, Math.floor((now - new Date(iso).getTime()) / 1000));
  if (s < 10) return t("just_now");
  if (s < 60) return t("ago_s", { n: s });
  if (s < 3600) return t("ago_m", { n: Math.floor(s / 60) });
  return t("ago_h", { n: Math.floor(s / 3600) });
}

/** Translated label for a code (status / type / vehicle), falling back to the raw value. */
export function codeLabel(t: Tr, group: string, code: string | null | undefined): string {
  if (!code) return "";
  const key = `${group}.${code}`;
  return t.has(key) ? t(key) : code;
}
