import { describe, expect, it } from "vitest";
import { customerSearchFilters } from "./search";

describe("customerSearchFilters", () => {
  it("one filter per term, max 3", () => {
    expect(customerSearchFilters("hamza hassani")).toHaveLength(2);
    expect(customerSearchFilters("a1 b2 c3 d4")).toHaveLength(3);
  });
  it("strips PostgREST-special characters", () => {
    const [f] = customerSearchFilters("ha,m(z)a*");
    expect(f).not.toMatch(/[()*\\]/);
    expect(f.split(",")).toHaveLength(3);
  });
  it("matches phones with and without the leading 0", () => {
    const [f] = customerSearchFilters("0674020244");
    expect(f).toContain("phone_number.ilike.%0674020244%");
    expect(f).toContain("phone_number.ilike.%674020244%");
  });
  it("short digit terms still search the raw term", () => {
    expect(customerSearchFilters("05")[0]).toContain("phone_number.ilike.%05%");
  });
  it("empty query gives no filters", () => expect(customerSearchFilters("  ")).toEqual([]));
});
