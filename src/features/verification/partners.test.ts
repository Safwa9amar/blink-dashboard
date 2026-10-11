import { describe, expect, it } from "vitest";
import { buildRiderDocSlots, buildRiderQueue, riderUploadProgress, riderViewOf, ridersInView } from "./partners";

const doc = (status: string) => ({ path: "p/x.jpg", status, uploaded_at: "2026-01-01T00:00:00Z" });

describe("riderViewOf", () => {
  const none = buildRiderDocSlots("motorcycle", {}, new Map());
  it("keeps the existing precedence", () => {
    expect(riderViewOf("rejected", none)).toBe("rejected");
    expect(riderViewOf("pending", none)).toBe("pending");
    expect(riderViewOf("approved", [{ status: "pending" }])).toBe("replacements");
    expect(riderViewOf("approved", none)).toBeNull();
  });
  it("puts not_submitted riders in waiting", () => {
    expect(riderViewOf("not_submitted", none)).toBe("waiting");
  });
});

describe("riderUploadProgress", () => {
  it("counts required documents only", () => {
    const docs = buildRiderDocSlots("bicycle", { id_front: doc("pending"), license_front: doc("pending") }, new Map());
    expect(riderUploadProgress(docs)).toEqual({ done: 1, total: 2, missing: ["id_back"] });
  });
  it("needs all 7 for a motorcycle", () => {
    const docs = buildRiderDocSlots("motorcycle", { id_front: doc("verified") }, new Map());
    const p = riderUploadProgress(docs);
    expect(p.done).toBe(1);
    expect(p.total).toBe(7);
    expect(p.missing).toHaveLength(6);
  });
});

describe("buildRiderQueue", () => {
  it("includes not_submitted riders as waiting, newest update first", () => {
    const row = (id: string, updated: string) => ({
      user_id: id,
      vehicle_type: "bicycle",
      documents: {},
      verification_status: "not_submitted",
      created_at: "2026-01-01T00:00:00Z",
      updated_at: updated,
    });
    const items = buildRiderQueue([row("a", "2026-02-01T00:00:00Z"), row("b", "2026-03-01T00:00:00Z")], new Map());
    expect(ridersInView(items, "waiting").map((i) => i.id)).toEqual(["b", "a"]);
  });
});
