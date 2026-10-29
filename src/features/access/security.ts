// Pure helpers for the sign-in security shown on the staff roster.

interface FactorLike {
  factor_type?: string;
  status?: string;
}

/** Number of verified TOTP factors (unverified enrolments don't protect the account). */
export function countVerifiedTotp(factors: readonly FactorLike[] | null | undefined): number {
  return (factors ?? []).filter((f) => f.factor_type === "totp" && f.status === "verified").length;
}
