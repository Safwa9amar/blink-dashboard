export function relativeTime(iso: string, locale: string, now = Date.now()): string {
  const ms = new Date(iso).getTime();
  if (Number.isNaN(ms)) return "";
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  const diff = (ms - now) / 1000;
  const abs = Math.abs(diff);
  if (abs < 60) return rtf.format(0, "second");
  if (abs < 3600) return rtf.format(Math.round(diff / 60), "minute");
  if (abs < 86400) return rtf.format(Math.round(diff / 3600), "hour");
  if (abs < 86400 * 30) return rtf.format(Math.round(diff / 86400), "day");
  return new Date(ms).toLocaleDateString(locale);
}
