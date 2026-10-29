import { describe, expect, it } from "vitest";
import { toTripDetail } from "./detail";

describe("toTripDetail", () => {
  it("maps the trip, its people, linked order and GPS trail", () => {
    const d = toTripDetail({
      id: "t1",
      display_id: "BK-EC626A",
      status: "completed",
      dispute_status: null,
      created_at: "2026-10-27T11:27:00Z",
      updated_at: "2026-10-27T11:40:00Z",
      pickup_label: "Kouba",
      pickup_address: "Kouba, Algiers",
      pickup_lat: 36.73,
      pickup_lng: 3.08,
      dropoff_label: "Hydra",
      dropoff_address: "Hydra, Algiers",
      dropoff_lat: 36.74,
      dropoff_lng: 3.04,
      distance_km: "1.3",
      duration_minutes: 5,
      estimated_payout: 200,
      net_payout: 170,
      commission_rate: 0.15,
      customer_rating: 5,
      route_path: [[36.73, 3.08], [36.74, 3.04]],
      rider: { id: "r1", first_name: "Lina", last_name: "C.", rider_profiles: [{ rider_id: "BK-RR-1" }] },
      customer: [{ id: "c1", first_name: "Sara", customer_profiles: [{ customer_id: "BK-CU-1" }] }],
      order: { id: "o1", type: "ride", status: "delivered", store_name: "Ride", total: 200, created_at: "2026-10-27T11:26:00Z" },
    })!;
    expect(d.displayId).toBe("BK-EC626A");
    expect(d.rider).toMatchObject({ id: "r1", name: "Lina C.", ref: "BK-RR-1" });
    expect(d.customer).toMatchObject({ id: "c1", ref: "BK-CU-1" });
    expect(d.order).toEqual({ id: "o1", type: "ride", status: "delivered", store: "Ride", total: 200, createdAt: "2026-10-27T11:26:00Z" });
    expect(d.pickup).toMatchObject({ label: "Kouba", lat: 36.73 });
    expect(d.dropoff).toMatchObject({ label: "Hydra", lng: 3.04 });
    expect(d.distanceKm).toBe(1.3);
    expect(d.commissionRate).toBe(0.15);
    expect(d.penaltyAmount).toBeNull();
    expect(d.path).toHaveLength(2);
  });

  it("tolerates a missing order and people", () => {
    const d = toTripDetail({ id: "t2", status: "canceled", cancellation_reason: "no_show", order: null })!;
    expect(d.order).toBeNull();
    expect(d.rider).toBeNull();
    expect(d.pickup).toBeNull();
    expect(d.cancellationReason).toBe("no_show");
  });

  it("rejects rows without an id", () => {
    expect(toTripDetail(undefined)).toBeNull();
  });
});
