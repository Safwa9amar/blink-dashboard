import { describe, it, expect } from "vitest";
import { refToRange } from "./ref-range";

describe("refToRange", () => {
  it("8-char app reference → id range", () => {
    expect(refToRange("3F2A9C1B")).toEqual({
      gte: "3f2a9c1b-0000-0000-0000-000000000000",
      lte: "3f2a9c1b-ffff-ffff-ffff-ffffffffffff",
    });
  });
  it("accepts a leading # and whitespace", () => expect(refToRange("  #3f2a9c1b ")).toEqual(refToRange("3F2A9C1B")));
  it("full uuid → exact", () => {
    const id = "3f2a9c1b-1234-4abc-8def-0123456789ab";
    expect(refToRange(id.toUpperCase())).toEqual({ exact: id });
  });
  it("rejects short, non-hex or other shapes", () => {
    for (const q of ["3f2a9c1", "zzzzzzzz", "3f2a9c1b-12", "", "pizza"]) expect(refToRange(q), q).toBeNull();
  });
});
