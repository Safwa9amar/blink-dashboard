import { describe, expect, it } from "vitest";
import { countVerifiedTotp } from "./security";

describe("countVerifiedTotp", () => {
  it("counts only verified totp factors", () => {
    expect(
      countVerifiedTotp([
        { factor_type: "totp", status: "verified" },
        { factor_type: "totp", status: "unverified" },
        { factor_type: "phone", status: "verified" },
      ]),
    ).toBe(1);
  });
  it("handles empty input", () => {
    expect(countVerifiedTotp(null)).toBe(0);
    expect(countVerifiedTotp([])).toBe(0);
  });
});
