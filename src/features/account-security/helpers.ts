// Pure helpers for the account-security UI (error mapping, code input, factor filtering).

export type AuthErrorLike = {
  name?: string;
  code?: string | number;
  status?: number;
  message?: string;
  cause?: unknown;
  originalError?: unknown;
} | null
  | undefined;

export type MfaErrorKey =
  | "invalid_code"
  | "expired"
  | "rate_limited"
  | "mfa_disabled"
  | "needs_aal2"
  | "name_conflict"
  | "generic";

/** Maps a Supabase MFA error to a localized key (never surface raw messages). */
export function mfaErrorKey(error: AuthErrorLike): MfaErrorKey {
  if (!error) return "generic";
  const code = String(error.code ?? "");
  const msg = error.message ?? "";
  if (code === "mfa_verification_failed" || /invalid.*(totp|code)/i.test(msg)) return "invalid_code";
  if (code === "mfa_challenge_expired" || /challenge.*expired/i.test(msg)) return "expired";
  if (error.status === 429 || /rate_limit/i.test(code) || /rate limit/i.test(msg)) return "rate_limited";
  if (code === "insufficient_aal") return "needs_aal2";
  if (code === "mfa_factor_name_conflict") return "name_conflict";
  if (/^mfa_.*not_enabled$/.test(code) || /mfa.*(not enabled|disabled)/i.test(msg)) return "mfa_disabled";
  return "generic";
}

/** Strips spaces/non-digits and caps at six digits. */
export function normalizeCode(value: string): string {
  return value.replace(/\D/g, "").slice(0, 6);
}

export function isCompleteCode(value: string): boolean {
  return /^\d{6}$/.test(value);
}

type FactorLike = { id: string; factor_type: string; status: string; friendly_name?: string };

export function staleUnverifiedTotp<T extends FactorLike>(factors: T[]): T[] {
  return factors.filter((f) => f.factor_type === "totp" && f.status === "unverified");
}

export function verifiedTotp<T extends FactorLike>(factors: T[]): T[] {
  return factors.filter((f) => f.factor_type === "totp" && f.status === "verified");
}

/** True when the server says passkeys aren't enabled for the project. */
export function isPasskeyDisabled(error: AuthErrorLike): boolean {
  if (!error) return false;
  if (String(error.code ?? "") === "passkey_disabled") return true;
  return error.status === 404 && /passkey/i.test(error.message ?? "");
}

/** True when the user dismissed / cancelled the browser's WebAuthn prompt. */
export function isUserCancel(error: unknown): boolean {
  const e = error as AuthErrorLike;
  if (!e) return false;
  const nested = (x: unknown) => (x as { name?: string } | undefined)?.name === "NotAllowedError";
  return (
    e.name === "NotAllowedError" ||
    nested(e.originalError) ||
    nested(e.cause) ||
    String(e.code ?? "") === "ERROR_CEREMONY_ABORTED"
  );
}
