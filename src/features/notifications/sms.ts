// The SMS channel's text, as blink-server builds it (src/lib/sms-text.ts there —
// keep the two in step): "Blink: <title>\n<message>" in one language, capped at
// 480 characters, and how many SMS parts that costs per recipient.
import type { Lang } from "@/components/ui";

export const SMS_MAX_CHARS = 480;

/** Text for `lang`; an empty language falls back to the first filled one (en → fr → ar). */
export function smsPreview(title: Record<Lang, string>, msg: Record<Lang, string>, lang: Lang): string {
  const own = (title[lang] ?? "").trim() || (msg[lang] ?? "").trim();
  const t = own ? (title[lang] ?? "").trim() : (title.en || title.fr || title.ar || "").trim();
  const m = own ? (msg[lang] ?? "").trim() : (msg.en || msg.fr || msg.ar || "").trim();
  const text = [t && `Blink: ${t}`, m].filter(Boolean).join("\n") || "Blink";
  return text.length > SMS_MAX_CHARS ? `${text.slice(0, SMS_MAX_CHARS - 1).trimEnd()}…` : text;
}

// GSM 03.38 basic set (+ the extension table, 2 characters each).
const GSM_BASIC =
  "@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !\"#¤%&'()*+,-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà";
const GSM_EXT = "^{}\\[~]|€\f";

/** SMS parts for one text (GSM-7: 160 / 153 per part; Unicode, e.g. Arabic: 70 / 67). */
export function smsSegments(text: string): number {
  let units = 0;
  for (const ch of text) {
    if (GSM_BASIC.includes(ch)) units += 1;
    else if (GSM_EXT.includes(ch)) units += 2;
    else {
      const len = [...text].length;
      return len <= 70 ? 1 : Math.ceil(len / 67);
    }
  }
  return units <= 160 ? 1 : Math.ceil(units / 153);
}
