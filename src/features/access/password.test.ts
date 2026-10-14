import { describe, expect, it } from "vitest";
import { generateTempPassword, validateNewPassword } from "./password";

describe("generateTempPassword", () => {
  it("is 14 chars, unambiguous, with a letter and a digit", () => {
    for (let i = 0; i < 200; i++) {
      const pw = generateTempPassword();
      expect(pw).toHaveLength(14);
      expect(pw).toMatch(/^[A-HJ-NP-Za-km-z2-9]+$/);
      expect(pw).toMatch(/[A-Za-z]/);
      expect(pw).toMatch(/\d/);
    }
  });
  it("differs between calls", () => {
    expect(generateTempPassword()).not.toBe(generateTempPassword());
  });
});

describe("validateNewPassword", () => {
  it("rejects short, letter-less or digit-less passwords", () => {
    expect(validateNewPassword("abc1")).toBe("weak_password");
    expect(validateNewPassword("abcdefghijkl")).toBe("weak_password");
    expect(validateNewPassword("1234567890")).toBe("weak_password");
  });
  it("rejects the current password", () => {
    expect(validateNewPassword("abcdefgh12", "abcdefgh12")).toBe("same_password");
  });
  it("accepts a good password", () => {
    expect(validateNewPassword("abcdefgh12", "other")).toBeNull();
    expect(validateNewPassword("abcdefgh12")).toBeNull();
  });
});
