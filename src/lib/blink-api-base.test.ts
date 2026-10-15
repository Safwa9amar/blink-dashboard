import { describe, expect, it } from "vitest";
import { parseApiBases, shouldFailOver } from "./blink-api-base";

describe("parseApiBases", () => {
  it("defaults to the Render primary then spare", () => {
    expect(parseApiBases(undefined)).toEqual([
      "https://blink-server-q4ey.onrender.com",
      "https://blink-server-spare.onrender.com",
    ]);
  });
  it("ignores the retired greenpedal host", () => {
    expect(parseApiBases("https://blink.greenpedal.net")[0]).toBe("https://blink-server-q4ey.onrender.com");
  });
  it("puts env URLs first, trims slashes and de-duplicates", () => {
    expect(parseApiBases(" https://a.example/ , https://blink-server-spare.onrender.com")).toEqual([
      "https://a.example",
      "https://blink-server-spare.onrender.com",
      "https://blink-server-q4ey.onrender.com",
    ]);
  });
});

describe("shouldFailOver", () => {
  it("always retries reads", () => {
    expect(shouldFailOver("GET", new Error("timeout"))).toBe(true);
  });
  it("retries writes only when no connection was made", () => {
    expect(shouldFailOver("POST", { cause: { code: "ENOTFOUND" } })).toBe(true);
    expect(shouldFailOver("POST", new Error("The operation was aborted due to timeout"))).toBe(false);
  });
});
