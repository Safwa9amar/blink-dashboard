// Maps Supabase auth failures to `auth.errors.*` keys so the UI never shows raw English
// server text. Pure (no imports) so it is unit-testable.
export type AuthErrorKey =
  | "invalid_credentials"
  | "email_not_confirmed"
  | "rate_limited"
  | "code_invalid"
  | "suspended"
  | "passkey_disabled"
  | "no_access"
  | "link_expired"
  | "session_expired"
  | "reset_expired"
  | "weak_password"
  | "same_password"
  | "generic";

type ErrorLike = { code?: string; status?: number; name?: string; message?: string; cause?: unknown };

const KNOWN_URL_ERRORS: readonly AuthErrorKey[] = ["no_access", "link_expired", "session_expired"];

/** `?error=` values the login page may show; anything else is ignored. */
export function urlErrorKey(value: string | null | undefined): AuthErrorKey | null {
  return KNOWN_URL_ERRORS.find((k) => k === value) ?? null;
}

/** True when the user dismissed the passkey / browser credential prompt (not an error to show). */
export function isCancelledPrompt(err: ErrorLike | null | undefined): boolean {
  if (!err) return false;
  const cause = err.cause as ErrorLike | undefined;
  return (
    err.name === "NotAllowedError" ||
    err.name === "AbortError" ||
    cause?.name === "NotAllowedError" ||
    cause?.name === "AbortError" ||
    err.code === "ERROR_CEREMONY_ABORTED"
  );
}

/**
 * Returns the `auth.errors.*` key for a Supabase error, or `null` when nothing should be
 * shown (no error, or the user cancelled the passkey prompt).
 */
export function mapAuthError(err: ErrorLike | null | undefined): AuthErrorKey | null {
  if (!err) return null;
  if (isCancelledPrompt(err)) return null;

  const code = err.code ?? "";
  const message = err.message ?? "";

  if (code === "user_banned" || /banned/i.test(message)) return "suspended";
  if (code === "passkey_disabled" || /passkeys?.*(disabled|not enabled)/i.test(message)) return "passkey_disabled";
  if (code === "invalid_credentials") return "invalid_credentials";
  if (code === "email_not_confirmed") return "email_not_confirmed";
  if (
    code === "over_request_rate_limit" ||
    code === "over_email_send_rate_limit" ||
    code === "over_sms_send_rate_limit" ||
    err.status === 429
  ) {
    return "rate_limited";
  }
  if (code === "otp_expired" || code === "otp_disabled" || /token has expired|invalid.*(token|otp|code)/i.test(message)) {
    return "code_invalid";
  }
  if (code === "weak_password") return "weak_password";
  if (code === "same_password") return "same_password";
  return "generic";
}
