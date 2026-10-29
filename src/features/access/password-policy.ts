// Staff password policy. Browser-safe (no node imports): client forms read the minimum
// length from here, server actions validate with it.
export const MIN_PASSWORD_LENGTH = 10;

/** Returns an `access.errors.*` key, or null when the password is acceptable. */
export function validateNewPassword(pw: string, current?: string): "weak_password" | "same_password" | null {
  if (pw.length < MIN_PASSWORD_LENGTH || !/[A-Za-z]/.test(pw) || !/\d/.test(pw)) return "weak_password";
  if (current && pw === current) return "same_password";
  return null;
}
