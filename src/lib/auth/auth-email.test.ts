import { describe, expect, it } from "vitest";
import { confirmLink, toAuthLang } from "./auth-email";

describe("confirmLink", () => {
  it("points a recovery token at /auth/confirm, forwarding to the reset form", () => {
    const url = new URL(confirmLink("https://blink-dz.vercel.app", "recovery", "fr", "abc123"));
    expect(url.origin + url.pathname).toBe("https://blink-dz.vercel.app/auth/confirm");
    expect(url.searchParams.get("token_hash")).toBe("abc123");
    expect(url.searchParams.get("type")).toBe("recovery");
    expect(url.searchParams.get("next")).toBe("/login/reset");
    expect(url.searchParams.get("lang")).toBe("fr");
  });

  it("sends a sign-in link home", () => {
    const url = new URL(confirmLink("http://localhost:3000", "magiclink", "en", "t"));
    expect(url.searchParams.get("type")).toBe("magiclink");
    expect(url.searchParams.get("next")).toBe("/");
  });

  it("without a token it is a plain redirect target (Supabase mailer fallback)", () => {
    const url = new URL(confirmLink("https://blink-dz.vercel.app", "recovery", "ar"));
    expect(url.searchParams.has("token_hash")).toBe(false);
    expect(url.searchParams.has("type")).toBe(false);
    expect(url.searchParams.get("next")).toBe("/login/reset");
  });
});

describe("toAuthLang", () => {
  it("keeps the dashboard locales and defaults the rest to English", () => {
    expect(toAuthLang("fr")).toBe("fr");
    expect(toAuthLang("ar")).toBe("ar");
    expect(toAuthLang("de")).toBe("en");
    expect(toAuthLang("")).toBe("en");
  });
});
