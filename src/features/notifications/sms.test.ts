import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { IntlMessageFormat } from "intl-messageformat";
import { SMS_MAX_CHARS, smsPreview, smsSegments } from "./sms";

// Same cases as blink-server src/lib/sms-text.test.ts: the composer preview must
// match what the server actually texts.
const title = { en: "Weekend promo", fr: "Promo du week-end", ar: "عرض نهاية الأسبوع" };
const msg = { en: "30% off all rides", fr: "-30% sur toutes les courses", ar: "" };

describe("smsPreview", () => {
  it("uses the chosen language", () => {
    expect(smsPreview(title, msg, "fr")).toBe("Blink: Promo du week-end\n-30% sur toutes les courses");
  });
  it("sends a title-only language as the title alone", () => {
    expect(smsPreview(title, msg, "ar")).toBe("Blink: عرض نهاية الأسبوع");
  });
  it("falls back to the first filled language when the chosen one is empty", () => {
    expect(smsPreview({ ...title, fr: "" }, { ...msg, fr: "" }, "fr")).toBe("Blink: Weekend promo\n30% off all rides");
  });
  it("caps very long texts", () => {
    const out = smsPreview({ en: "T", fr: "", ar: "" }, { en: "x".repeat(2000), fr: "", ar: "" }, "en");
    expect(out).toHaveLength(SMS_MAX_CHARS);
    expect(out.endsWith("…")).toBe(true);
  });
});

describe("smsSegments", () => {
  it("GSM-7 (French accents in the basic set) vs Unicode (Arabic, ê)", () => {
    expect(smsSegments("a".repeat(160))).toBe(1);
    expect(smsSegments("a".repeat(161))).toBe(2);
    expect(smsSegments("Promo é è à ù")).toBe(1);
    expect(smsSegments("ع".repeat(71))).toBe(2);
    expect(smsSegments("ê" + "a".repeat(70))).toBe(2);
    expect(smsSegments("€".repeat(81))).toBe(2);
  });
});

describe("SMS copy", () => {
  const ARGS = { chars: 42, parts: 2, max: 500, count: 812, detail: "timeout", recipients: 1200, reason: "x", queued: 50, failed: 3 };
  it.each(["en", "fr", "ar"])("formats in %s", (l) => {
    const c = JSON.parse(readFileSync(join(process.cwd(), `src/features/notifications/locales/${l}.json`), "utf8")).notif.c;
    for (const k of ["sms_lang", "sms_hint", "sms_count", "sms_not_configured", "sms_over_limit", "sms_no_phones", "sms_failed", "sms_partial", "sms_refused", "done"]) {
      expect(typeof c[k], `${l} notif.c.${k}`).toBe("string");
      expect(String(new IntlMessageFormat(c[k], l).format(ARGS)), `${l} ${k}`).not.toMatch(/[{}]/);
    }
  });
});
