import { describe, expect, it } from "vitest";
import { buildVerificationRequest, defaultSelection, requiredDocKeys } from "./verification-request";

const ID = "0b0e1f5e-4c1b-4a7e-9d3a-1b2c3d4e5f60";

describe("defaultSelection", () => {
  it("selects every document for a motorcycle", () => {
    expect(defaultSelection("motorcycle")).toHaveLength(7);
  });
  it("selects only the national ID for a bicycle", () => {
    expect(defaultSelection("bicycle")).toEqual(["id_front", "id_back"]);
    expect(requiredDocKeys("bicycle")).toEqual(["id_front", "id_back"]);
  });
});

describe("buildVerificationRequest", () => {
  it("builds the request with trimmed note and ordered unique keys", () => {
    expect(buildVerificationRequest(ID, ["insurance", "id_front", "insurance"], "  Expired  ", "motorcycle")).toEqual({
      path: `/riders/admin/riders/${ID}/verification-request`,
      body: { documents: ["id_front", "insurance"], note: "Expired" },
    });
  });
  it("rejects a bad id, unknown key, or empty selection", () => {
    expect(buildVerificationRequest("x", ["id_front"], "n")).toEqual({ code: "invalid_target" });
    expect(buildVerificationRequest(ID, ["passport"], "n")).toEqual({ code: "invalid_target" });
    expect(buildVerificationRequest(ID, [], "n")).toEqual({ code: "no_documents" });
  });
  it("rejects a document the vehicle doesn't need", () => {
    expect(buildVerificationRequest(ID, ["insurance"], "n", "bicycle")).toEqual({ code: "invalid_target" });
  });
  it("requires a note of 1..200 characters", () => {
    expect(buildVerificationRequest(ID, ["id_front"], "   ")).toEqual({ code: "note_required" });
    expect(buildVerificationRequest(ID, ["id_front"], "a".repeat(201))).toEqual({ code: "note_too_long" });
    expect("path" in buildVerificationRequest(ID, ["id_front"], "a".repeat(200))).toBe(true);
  });
});
