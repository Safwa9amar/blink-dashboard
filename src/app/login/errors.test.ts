import { describe, expect, it } from "vitest";
import { isCancelledPrompt, mapAuthError, urlErrorKey } from "./errors";

describe("mapAuthError", () => {
  it("maps known Supabase codes", () => {
    expect(mapAuthError({ code: "invalid_credentials", status: 400 })).toBe("invalid_credentials");
    expect(mapAuthError({ code: "email_not_confirmed" })).toBe("email_not_confirmed");
    expect(mapAuthError({ code: "over_request_rate_limit" })).toBe("rate_limited");
    expect(mapAuthError({ code: "over_email_send_rate_limit" })).toBe("rate_limited");
    expect(mapAuthError({ status: 429 })).toBe("rate_limited");
    expect(mapAuthError({ code: "otp_expired" })).toBe("code_invalid");
    expect(mapAuthError({ message: "Token has expired or is invalid" })).toBe("code_invalid");
    expect(mapAuthError({ code: "user_banned" })).toBe("suspended");
    expect(mapAuthError({ message: "User is banned" })).toBe("suspended");
    expect(mapAuthError({ code: "passkey_disabled", status: 404 })).toBe("passkey_disabled");
  });

  it("is quiet when the passkey prompt is cancelled", () => {
    expect(mapAuthError({ name: "NotAllowedError" })).toBeNull();
    expect(mapAuthError({ code: "ERROR_CEREMONY_ABORTED" })).toBeNull();
    expect(mapAuthError({ name: "WebAuthnError", cause: { name: "NotAllowedError" } })).toBeNull();
    expect(isCancelledPrompt({ name: "AbortError" })).toBe(true);
  });

  it("falls back to generic and never echoes server text", () => {
    expect(mapAuthError({ status: 0, message: "Failed to fetch" })).toBe("generic");
    expect(mapAuthError({ code: "something_new", message: "Boom" })).toBe("generic");
    expect(mapAuthError(null)).toBeNull();
  });
});

describe("urlErrorKey", () => {
  it("only allows the documented reasons", () => {
    expect(urlErrorKey("no_access")).toBe("no_access");
    expect(urlErrorKey("link_expired")).toBe("link_expired");
    expect(urlErrorKey("session_expired")).toBe("session_expired");
    expect(urlErrorKey("<script>")).toBeNull();
    expect(urlErrorKey(undefined)).toBeNull();
  });
});
