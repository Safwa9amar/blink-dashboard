/** Minutes with one decimal below 10, whole above; null renders as an em dash. */
export function fmtMin(m: number | null): string | null {
  if (m == null) return null;
  return m < 10 ? String(Math.round(m * 10) / 10) : String(Math.round(m));
}

export function fmtPct(rate: number | null, locale: string): string {
  if (rate == null) return "—";
  return `${(rate * 100).toLocaleString(locale, { maximumFractionDigits: 0 })}%`;
}
