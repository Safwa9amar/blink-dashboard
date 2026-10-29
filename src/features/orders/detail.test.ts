import { describe, expect, it } from "vitest";
import { minutesBetween, stopMarkers, toOrderDetail, toOrderTrips, toPath, toPerson } from "./detail";

const customer = {
  id: "c1",
  first_name: "Sara",
  last_name: "K.",
  phone_number: "+213550000001",
  email: null,
  customer_profiles: [{ customer_id: "BK-CU-100001" }],
};

describe("toPerson", () => {
  it("joins the name and picks the customer / rider display id", () => {
    expect(toPerson(customer)).toEqual({ id: "c1", name: "Sara K.", phone: "+213550000001", email: null, ref: "BK-CU-100001" });
    expect(toPerson([{ id: "r1", first_name: "Amine", rider_profiles: { rider_id: "BK-RR-1" } }])?.ref).toBe("BK-RR-1");
  });

  it("is null without an embedded user", () => {
    expect(toPerson(null)).toBeNull();
    expect(toPerson([])).toBeNull();
  });
});

describe("toPath", () => {
  it("keeps only valid [lat, lng] pairs", () => {
    expect(toPath([[36.7, 3.05], ["36.8", "3.1"], [200, 3], [36.7], "x", null])).toEqual([
      [36.7, 3.05],
      [36.8, 3.1],
    ]);
    expect(toPath(null)).toEqual([]);
  });
});

describe("toOrderDetail", () => {
  it("maps a store order: store, priced items, address-column stops, sorted timeline", () => {
    const d = toOrderDetail({
      id: "o1",
      type: "merchant",
      status: "delivered",
      created_at: "2026-10-22T08:30:00Z",
      delivered_at: "2026-10-22T09:00:00Z",
      accepted_at: "2026-10-22T08:32:00Z",
      store_name: "Blink Mart",
      store_id: "s1",
      store: { id: "s1", name: "Blink Mart — Hydra", phone: "0550", city: "Hydra", wilaya: "Alger" },
      customer,
      rider: null,
      items: [{ name: "Milk", quantity: 2, unit_price: 120 }],
      subtotal: 240,
      delivery_fee: "200",
      total: 440,
      pickup_address: "Hydra",
      pickup_lat: 36.74,
      pickup_lng: 3.04,
      destination_address: "Ben Aknoun",
      destination_lat: 36.76,
      destination_lng: 3.01,
      merchant_commission_rate: 0.1,
      route_path: [[36.74, 3.04], [36.76, 3.01]],
    })!;
    expect(d.store).toEqual({ id: "s1", name: "Blink Mart — Hydra", phone: "0550", place: "Hydra, Alger" });
    expect(d.items).toEqual([{ name: "Milk", quantity: 2, unitPrice: 120 }]);
    expect(d.deliveryFee).toBe(200);
    expect(d.pickup).toMatchObject({ label: "Blink Mart", address: "Hydra", lat: 36.74 });
    expect(d.dropoffs).toHaveLength(1);
    expect(d.timeline.map((e) => e.step)).toEqual(["placed", "accepted", "delivered"]);
    expect(d.rider).toBeNull();
    expect(d.cancel).toBeNull();
    expect(d.path).toHaveLength(2);
  });

  it("maps a parcel: courier pickup, every drop-off with its recipient, no store", () => {
    const d = toOrderDetail({
      id: "o2",
      type: "courier",
      status: "canceled",
      store_name: "Courier",
      created_at: "2026-10-27T12:00:00Z",
      canceled_at: "2026-10-27T12:05:00Z",
      canceled_by: "customer",
      cancel_reason: "changed_mind",
      courier: {
        paid_by: "sender",
        distance_km: 5.9,
        parcel: { type: "documents", size: "small", note: null },
        pickup: { label: "Kouba", address: "Kouba, Algiers", lat: 36.73, lng: 3.08, contact_name: "Ali", contact_phone: "0551" },
        drop_offs: [
          { label: "Hydra", address: "Hydra", lat: 36.74, lng: 3.04, recipient_name: "Nour", recipient_phone: "0552", delivered_at: null },
          { label: "", address: "", lat: null },
        ],
      },
    })!;
    expect(d.store).toBeNull();
    expect(d.pickup).toMatchObject({ label: "Kouba", contactName: "Ali", contactPhone: "0551" });
    expect(d.dropoffs).toEqual([expect.objectContaining({ label: "Hydra", contactName: "Nour", contactPhone: "0552" })]);
    expect(d.courier).toEqual({ parcelType: "documents", parcelSize: "small", parcelNote: null, paidBy: "sender" });
    expect(d.distanceKm).toBe(5.9);
    expect(d.cancel).toEqual({ by: "customer", reason: "changed_mind", note: null, rejectReason: null });
    expect(d.timeline.at(-1)?.step).toBe("canceled");
  });

  it("maps a ride: pickup / destination from the ride JSON, passenger and arrival", () => {
    const d = toOrderDetail({
      id: "o3",
      type: "ride",
      status: "delivered",
      store_name: "Ride",
      created_at: "2026-10-29T12:43:00Z",
      picked_up_at: "2026-10-29T12:50:00Z",
      ride: {
        pickup: { label: "Q335", address: "Algiers", lat: 36.75, lng: 3.05 },
        destination: { label: "Ben Aknoun", address: "Ben Aknoun", lat: 36.76, lng: 3.01 },
        passenger: { name: "Yacine", phone: "0553" },
        arrived_at: "2026-10-29T12:47:00Z",
        distance_km: 5.6,
        duration_minutes: 14,
        female_rider_only: true,
      },
    })!;
    expect(d.store).toBeNull();
    expect(d.pickup?.label).toBe("Q335");
    expect(d.dropoffs.map((s) => s.label)).toEqual(["Ben Aknoun"]);
    expect(d.ride).toEqual({ passengerName: "Yacine", passengerPhone: "0553", femaleRiderOnly: true });
    expect(d.durationMinutes).toBe(14);
    expect(d.timeline.map((e) => e.step)).toEqual(["placed", "rider_arrived", "picked_up"]);
  });

  it("rejects rows without an id", () => {
    expect(toOrderDetail(null)).toBeNull();
    expect(toOrderDetail({ type: "merchant" })).toBeNull();
  });
});

describe("toOrderTrips", () => {
  it("maps the order's trips", () => {
    expect(toOrderTrips([{ id: "t1", display_id: "BK-1", status: "completed", net_payout: 85, created_at: "x" }])).toEqual([
      { id: "t1", displayId: "BK-1", status: "completed", payout: 85, createdAt: "x" },
    ]);
  });
});

describe("stopMarkers", () => {
  it("skips stops without coordinates", () => {
    const pickup = { label: "A", address: "", lat: 1, lng: 2, note: null, contactName: null, contactPhone: null, doneAt: null };
    const noCoords = { ...pickup, label: "B", lat: null, lng: null };
    expect(stopMarkers(pickup, [noCoords, { ...pickup, label: "C" }])).toEqual([
      { id: "pickup", lat: 1, lng: 2, kind: "pickup", label: "A" },
      { id: "dropoff-1", lat: 1, lng: 2, kind: "dropoff", label: "C" },
    ]);
  });
});

describe("minutesBetween", () => {
  it("rounds to minutes and ignores missing or reversed times", () => {
    expect(minutesBetween("2026-10-22T08:30:00Z", "2026-10-22T09:00:29Z")).toBe(30);
    expect(minutesBetween(null, "2026-10-22T09:00:00Z")).toBeNull();
    expect(minutesBetween("2026-10-22T09:00:00Z", "2026-10-22T08:00:00Z")).toBeNull();
  });
});
