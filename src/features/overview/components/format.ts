export function money(n: number, locale: string): string {
  return `${Math.round(n).toLocaleString(locale)} DZD`;
}

export function humanize(s: string): string {
  return s.replace(/_/g, " ");
}

/** "3 minutes ago" in the viewer's language. */
export function relativeTime(iso: string, locale: string): string {
  const diff = (new Date(iso).getTime() - Date.now()) / 1000;
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  const abs = Math.abs(diff);
  if (abs < 60) return rtf.format(Math.round(diff), "second");
  if (abs < 3600) return rtf.format(Math.round(diff / 60), "minute");
  if (abs < 86400) return rtf.format(Math.round(diff / 3600), "hour");
  return rtf.format(Math.round(diff / 86400), "day");
}
