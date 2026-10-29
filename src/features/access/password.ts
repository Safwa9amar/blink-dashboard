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

// The policy itself lives in ./password-policy (no node imports, so client forms can use it).
export { MIN_PASSWORD_LENGTH, validateNewPassword } from "./password-policy";
