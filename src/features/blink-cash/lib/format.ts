// Display formatting shared by the Blink Cash pages. Fixed zone + fixed locale tags so a
// server render and the browser hydrate the same text.

const tag = (locale: string) => (locale === "en" ? "en-GB" : locale);

/** "16/10/2026, 14:05" in Algiers time. */
export function formatDateTime(iso: string | null | undefined, locale: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(tag(locale), {
    timeZone: "Africa/Algiers",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Signed amount for statements: "+1,500 DA" / "−300 DA". */
export function signedDA(n: number): string {
  const abs = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(Math.abs(n));
  return `${n < 0 ? "−" : "+"}${abs} DA`;
}

/** Only http(s) links are rendered as anchors (receipt URLs come from riders). */
export function safeHttpUrl(u: string | null | undefined): string | null {
  if (!u) return null;
  try {
    const url = new URL(u);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}

/** First 8 characters of an id — what the ledger shows. */
export const shortId = (id: string) => id.slice(0, 8);
