import { describe, expect, it } from "vitest";
import { renderAuthEmail } from "./auth-templates";

const LINK = "https://blink-dz.vercel.app/auth/confirm?token_hash=abc&type=recovery";

describe("renderAuthEmail", () => {
  it("renders the reset email with button, code and link", () => {
    const m = renderAuthEmail({ type: "recovery", lang: "en", code: "123456", link: LINK });
    expect(m.subject).toBe("Reset your Blink password");
    expect(m.html).toContain(`href="${LINK.replace(/&/g, "&amp;")}"`);
    expect(m.html).toContain("123456");
    expect(m.text).toContain(`Reset password: ${LINK}`);
    expect(m.text).toContain("Or use this code: 123456");
  });

  it("lays Arabic out right-to-left", () => {
    const m = renderAuthEmail({ type: "magiclink", lang: "ar", code: "123456", link: LINK });
    expect(m.html).toContain('dir="rtl"');
    expect(m.subject).toBe("رمز تسجيل الدخول إلى Blink");
  });

  it("drops a code that isn't 4-8 digits and escapes the link", () => {
    const m = renderAuthEmail({ type: "recovery", lang: "fr", code: "<b>1</b>", link: 'https://x.test/"><script>' });
    expect(m.html).not.toContain("<b>1</b>");
    expect(m.html).not.toContain("<script>");
    expect(m.text).not.toContain("Ou utilisez ce code");
  });
});
