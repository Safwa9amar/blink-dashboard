import { describe, expect, it } from "vitest";
import { toAsciiDigits } from "./primitives";

describe("toAsciiDigits", () => {
  it("reads Arabic-Indic and Extended Arabic-Indic digits as 0-9", () => {
    expect(toAsciiDigits("٠١٢٣٤٥٦٧٨٩")).toBe("0123456789");
    expect(toAsciiDigits("۰۱۲۳۴۵۶۷۸۹")).toBe("0123456789");
    expect(toAsciiDigits("١٢")).toBe("12");
  });
  it("leaves ASCII digits and other characters alone", () => {
    expect(toAsciiDigits("12 Da")).toBe("12 Da");
    expect(toAsciiDigits("٣a۴")).toBe("3a4");
    expect(toAsciiDigits("")).toBe("");
  });
});
