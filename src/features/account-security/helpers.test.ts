import { describe, expect, it } from "vitest";
import {
  isCompleteCode,
  isPasskeyDisabled,
  isUserCancel,
  mfaErrorKey,
  normalizeCode,
  staleUnverifiedTotp,
  verifiedTotp,
} from "./helpers";

describe("mfaErrorKey", () => {
  it("maps known codes", () => {
    expect(mfaErrorKey({ code: "mfa_verification_failed" })).toBe("invalid_code");
    expect(mfaErrorKey({ code: "mfa_challenge_expired" })).toBe("expired");
    expect(mfaErrorKey({ status: 429 })).toBe("rate_limited");
    expect(mfaErrorKey({ code: "over_request_rate_limit" })).toBe("rate_limited");
    expect(mfaErrorKey({ code: "insufficient_aal" })).toBe("needs_aal2");
    expect(mfaErrorKey({ code: "mfa_totp_enroll_not_enabled" })).toBe("mfa_disabled");
    expect(mfaErrorKey({ message: "MFA enroll is disabled for TOTP" })).toBe("mfa_disabled");
  });
  it("falls back to generic", () => {
    expect(mfaErrorKey(null)).toBe("generic");
    expect(mfaErrorKey({ message: "boom" })).toBe("generic");
  });
});

describe("code input", () => {
  it("normalizes", () => {
    expect(normalizeCode("12 34-56789")).toBe("123456");
    expect(isCompleteCode("123456")).toBe(true);
    expect(isCompleteCode("12345")).toBe(false);
  });
});

describe("factors", () => {
  const f = [
    { id: "a", factor_type: "totp", status: "verified" },
    { id: "b", factor_type: "totp", status: "unverified" },
    { id: "c", factor_type: "phone", status: "unverified" },
  ];
  it("filters", () => {
    expect(verifiedTotp(f).map((x) => x.id)).toEqual(["a"]);
    expect(staleUnverifiedTotp(f).map((x) => x.id)).toEqual(["b"]);
  });
});

describe("passkey errors", () => {
  it("detects disabled", () => {
    expect(isPasskeyDisabled({ code: "passkey_disabled", status: 404 })).toBe(true);
    expect(isPasskeyDisabled({ status: 404, message: "passkeys not enabled" })).toBe(true);
    expect(isPasskeyDisabled({ status: 500 })).toBe(false);
  });
  it("detects cancel", () => {
    expect(isUserCancel({ name: "NotAllowedError" })).toBe(true);
    expect(isUserCancel({ name: "WebAuthnError", originalError: { name: "NotAllowedError" } })).toBe(true);
    expect(isUserCancel({ code: "ERROR_CEREMONY_ABORTED" })).toBe(true);
    expect(isUserCancel({ name: "Other" })).toBe(false);
  });
});
