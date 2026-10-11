import { describe, expect, it } from "vitest";
import { buildRiderDocSlots, visibleDocGroups } from "@/features/verification/partners";
import { isUuid, shortRef, statusVariant, sumTotals, toActivityOrders, toRiderProfile } from "./detail";

describe("isUuid", () => {
  it("accepts uuids and rejects everything else", () => {
    expect(isUuid("0b0e1f5e-4c1b-4a7e-9d3a-1b2c3d4e5f60")).toBe(true);
    expect(isUuid("not-a-uuid")).toBe(false);
    expect(isUuid("")).toBe(false);
    expect(isUuid(undefined)).toBe(false);
  });
});

describe("toRiderProfile", () => {
  const row = {
    user_id: "u1",
    rider_id: "BK-RR-100001",
    vehicle_type: "motorcycle",
    verification_status: "approved",
    is_available: true,
    latitude: 36.7,
    longitude: 3.05,
    location_updated_at: "2026-10-11T10:00:00Z",
    created_at: "2026-01-01T00:00:00Z",
    users: {
      first_name: "Amine",
      last_name: "B.",
      phone_number: "+213550000000",
      email: null,
      wilaya: "Alger",
      is_active: false,
      vehicles: [{ brand: "Yamaha", model: "X", license_plate: "123", year: "2020", color: "red", category: "standard" }],
    },
  };

  it("maps the embedded user and vehicle", () => {
    const p = toRiderProfile(row)!;
    expect(p).toMatchObject({ id: "u1", name: "Amine B.", email: null, active: false, available: true, verification: "approved" });
    expect(p.vehicle?.plate).toBe("123");
    expect(p.latitude).toBe(36.7);
  });

  it("handles a missing user/vehicle and an unknown status", () => {
    const p = toRiderProfile({ user_id: "u2", verification_status: "weird", users: null })!;
    expect(p).toMatchObject({ name: "", vehicle: null, active: null, verification: "not_submitted", latitude: null });
  });

  it("returns null for a row without user_id", () => {
    expect(toRiderProfile({ rider_id: "x" })).toBeNull();
  });
});

describe("activity helpers", () => {
  it("sums totals and ignores bad rows", () => {
    expect(sumTotals([{ total: 100 }, { total: 250 }, { total: "x" }, null])).toBe(350);
    expect(sumTotals(null)).toBe(0);
  });
  it("maps orders and shortens refs", () => {
    const [o] = toActivityOrders([{ id: "abcdef1234", status: "delivered", type: "merchant", store_name: "S", total: 900, created_at: "d" }]);
    expect(o).toMatchObject({ store: "S", total: 900 });
    expect(shortRef(o.id)).toBe("ABCDEF12");
  });
  it("colours statuses", () => {
    expect(statusVariant("delivered")).toBe("success");
    expect(statusVariant("cancelled")).toBe("danger");
    expect(statusVariant("pending")).toBe("warning");
    expect(statusVariant("???")).toBe("default");
  });
});

describe("rider document groups", () => {
  const documents = { id_front: { path: "a/id_front.jpg", status: "pending" } };

  it("a bicycle rider only sees the identity group", () => {
    const groups = visibleDocGroups(buildRiderDocSlots("bicycle", documents, new Map()));
    expect(groups.map((g) => g.group)).toEqual(["identity"]);
  });

  it("a motorcycle rider sees all three groups, with signed urls", () => {
    const slots = buildRiderDocSlots("motorcycle", documents, new Map([["a/id_front.jpg", "https://signed"]]));
    expect(visibleDocGroups(slots).map((g) => g.group)).toEqual(["identity", "licence", "vehicle"]);
    expect(slots.find((s) => s.key === "id_front")).toMatchObject({ url: "https://signed", trusted: true, status: "pending" });
    expect(slots.find((s) => s.key === "license_front")?.status).toBe("missing");
  });
});
