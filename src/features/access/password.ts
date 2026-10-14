// Pure password helpers for staff accounts (no server-only imports: unit-testable).
import { randomInt } from "node:crypto";

// No 0/O/1/l/I — easy to misread when read aloud or copied by hand.
const UPPER = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const LOWER = "abcdefghijkmnpqrstuvwxyz";
const LETTERS = UPPER + LOWER;
const DIGITS = "23456789";
const ALPHABET = LETTERS + DIGITS;
const TEMP_LENGTH = 14;

const pick = (set: string) => set[randomInt(set.length)];

/** 14-char temporary password with at least one upper-case letter, one lower-case letter and one digit. */
export function generateTempPassword(): string {
  const chars = [pick(UPPER), pick(LOWER), pick(DIGITS)];
  while (chars.length < TEMP_LENGTH) chars.push(pick(ALPHABET));
  // Fisher-Yates shuffle so the guaranteed chars aren't always first.
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join("");
}

export const MIN_PASSWORD_LENGTH = 10;

/** Returns an `access.errors.*` key, or null when the password is acceptable. */
export function validateNewPassword(pw: string, current?: string): "weak_password" | "same_password" | null {
  if (pw.length < MIN_PASSWORD_LENGTH || !/[A-Za-z]/.test(pw) || !/\d/.test(pw)) return "weak_password";
  if (current && pw === current) return "same_password";
  return null;
}
