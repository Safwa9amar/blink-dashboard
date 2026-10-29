// Order detail page: pure helpers (row → view model). No I/O —
// src/app/d/orders/[id]/page.tsx fetches the rows. The person / stop / GPS-trail
// mappers are shared with the trip detail page (src/features/trips/detail.ts).
import type { MapMarker } from "@/components/map/types";

type Rec = Record<string, unknown>;
const isRec = (v: unknown): v is Rec => typeof v === "object" && v !== null && !Array.isArray(v);
const str = (v: unknown): string => (typeof v === "string" ? v : "");
const strOrNull = (v: unknown): string | null => (typeof v === "string" && v ? v : null);
/** PostgREST returns `numeric` as a number, but accept a numeric string too. */
const numOrNull = (v: unknown): number | null => {
  const n = typeof v === "string" && v.trim() ? Number(v) : v;
  return typeof n === "number" && Number.isFinite(n) ? n : null;
};
const num = (v: unknown): number => numOrNull(v) ?? 0;
const one = (v: unknown): Rec | null => (Array.isArray(v) ? (isRec(v[0]) ? v[0] : null) : isRec(v) ? v : null);
const list = (rows: unknown): Rec[] => (Array.isArray(rows) ? rows.filter(isRec) : []);

export interface Person {
  /** users.id */
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  /** Display id from customer_profiles / rider_profiles ("BK-CU-…"), when embedded. */
  ref: string | null;
}

/** A `users` embed (optionally with customer_profiles / rider_profiles) → Person. */
export function toPerson(v: unknown): Person | null {
  const u = one(v);
  if (!u || typeof u.id !== "string") return null;
  return {
    id: u.id,
    name: [u.first_name, u.last_name].filter((p) => typeof p === "string" && p).join(" "),
    phone: strOrNull(u.phone_number),
    email: strOrNull(u.email),
    ref: strOrNull(one(u.customer_profiles)?.customer_id) ?? strOrNull(one(u.rider_profiles)?.rider_id),
  };
}

export interface Stop {
  label: string;
  address: string;
  lat: number | null;
  lng: number | null;
  note: string | null;
  /** Sender contact (courier pickup) or recipient (courier drop-off). */
  contactName: string | null;
  contactPhone: string | null;
  /** Courier drop-off delivered time. */
  doneAt: string | null;
}

/** A ride / courier location object (`{ label, address, lat, lng, … }`) → Stop. */
export function toStop(v: unknown): Stop | null {
  if (!isRec(v)) return null;
  const stop: Stop = {
    label: str(v.label),
    address: str(v.address),
    lat: numOrNull(v.lat),
    lng: numOrNull(v.lng),
    note: strOrNull(v.note),
    contactName: strOrNull(v.contact_name) ?? strOrNull(v.recipient_name),
    contactPhone: strOrNull(v.contact_phone) ?? strOrNull(v.recipient_phone),
    doneAt: strOrNull(v.delivered_at),
  };
  return stop.label || stop.address || stop.lat !== null ? stop : null;
}

/** Plain columns (address + lat/lng) → Stop, or null when all are empty. */
export function columnStop(label: unknown, address: unknown, lat: unknown, lng: unknown): Stop | null {
  return toStop({ label, address, lat, lng });
}

export type LatLng = [number, number];

/** `route_path` (`[[lat, lng], …]`, the rider's GPS trail) → valid points only. */
export function toPath(v: unknown): LatLng[] {
  if (!Array.isArray(v)) return [];
  return v.flatMap((p) => {
    if (!Array.isArray(p)) return [];
    const lat = numOrNull(p[0]);
    const lng = numOrNull(p[1]);
    return lat !== null && lng !== null && Math.abs(lat) <= 90 && Math.abs(lng) <= 180 ? [[lat, lng] as LatLng] : [];
  });
}

/** Merchant / shopper orders: a store, a basket of priced items. Rides and parcels have neither. */
export const isStoreOrder = (type: unknown): boolean => type === "merchant" || type === "shopper";

export interface OrderItem {
  name: string;
  quantity: number;
  unitPrice: number;
}

export type TimelineStep = "placed" | "accepted" | "prepared" | "rider_assigned" | "rider_arrived" | "picked_up" | "delivered" | "canceled";
export interface TimelineEntry {
  step: TimelineStep;
  at: string;
}

export interface OrderTrip {
  id: string;
  displayId: string;
  status: string;
  payout: number;
  createdAt: string;
}

export interface OrderDetail {
  id: string;
  type: string;
  status: string;
  createdAt: string;
  scheduledAt: string | null;
  estimatedTime: string | null;
  customer: Person | null;
  rider: Person | null;
  store: { id: string | null; name: string; phone: string | null; place: string | null } | null;
  driver: { name: string; phone: string | null; vehicle: string | null; plate: string | null } | null;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  serviceFee: number;
  discount: number;
  total: number;
  coupon: { code: string; title: string | null } | null;
  pickup: Stop | null;
  dropoffs: Stop[];
  distanceKm: number | null;
  durationMinutes: number | null;
  courier: { parcelType: string | null; parcelSize: string | null; parcelNote: string | null; paidBy: string | null } | null;
  ride: { passengerName: string | null; passengerPhone: string | null; femaleRiderOnly: boolean } | null;
  timeline: TimelineEntry[];
  cancel: { by: string | null; reason: string | null; note: string | null; rejectReason: string | null } | null;
  merchantStatus: string | null;
  reviews: {
    storeRating: number | null;
    storeReview: string | null;
    storeReply: string | null;
    riderRating: number | null;
    riderReview: string | null;
    riderTags: string[];
  };
  vehicleType: string | null;
  deliveryMode: string | null;
  zone: string | null;
  tier: string | null;
  commissionRate: number | null;
  stampDutyRate: number | null;
  path: LatLng[];
}

/** Order row with the page's embeds (customer, rider, store, driver, coupon, zone) → view model. */
export function toOrderDetail(row: unknown): OrderDetail | null {
  if (!isRec(row) || typeof row.id !== "string") return null;
  const ride = isRec(row.ride) ? row.ride : null;
  const courier = isRec(row.courier) ? row.courier : null;
  const store = one(row.store);
  const driver = one(row.driver);
  const coupon = one(row.coupon);
  const passenger = isRec(ride?.passenger) ? ride.passenger : null;
  const parcel = isRec(courier?.parcel) ? courier.parcel : null;
  // Rides / parcels carry a placeholder store_name ("Ride", "Courier"); only store orders have a store.
  const hasStore = !!store || !!strOrNull(row.store_id) || (isStoreOrder(row.type) && !!strOrNull(row.store_name));

  // Rides and parcels keep their stops in JSON; store orders use the address columns.
  const pickup =
    toStop(ride?.pickup) ?? toStop(courier?.pickup) ?? columnStop(row.store_name, row.pickup_address, row.pickup_lat, row.pickup_lng);
  const dropoffs = ride
    ? [toStop(ride.destination)].filter((s): s is Stop => s !== null)
    : courier
      ? list(courier.drop_offs).map(toStop).filter((s): s is Stop => s !== null)
      : [];
  if (dropoffs.length === 0) {
    const dest = columnStop("", row.destination_address, row.destination_lat, row.destination_lng);
    if (dest) dropoffs.push(dest);
  }

  const steps: [TimelineStep, unknown][] = [
    ["placed", row.created_at],
    ["accepted", row.accepted_at],
    ["prepared", row.prepared_at],
    ["rider_assigned", row.rider_assigned_at],
    ["rider_arrived", ride?.arrived_at],
    ["picked_up", row.picked_up_at],
    ["delivered", row.delivered_at],
    ["canceled", row.canceled_at],
  ];
  const timeline = steps
    .flatMap(([step, at]) => (typeof at === "string" && !Number.isNaN(Date.parse(at)) ? [{ step, at }] : []))
    .sort((a, b) => Date.parse(a.at) - Date.parse(b.at));

  const cancel = {
    by: strOrNull(row.canceled_by),
    reason: strOrNull(row.cancel_reason),
    note: strOrNull(row.cancel_note),
    rejectReason: strOrNull(row.merchant_reject_reason),
  };

  return {
    id: row.id,
    type: str(row.type),
    status: str(row.status),
    createdAt: str(row.created_at),
    scheduledAt: strOrNull(row.scheduled_at),
    estimatedTime: strOrNull(row.estimated_time),
    customer: toPerson(row.customer),
    rider: toPerson(row.rider),
    store: hasStore
      ? {
            id: strOrNull(store?.id) ?? strOrNull(row.store_id),
            name: str(store?.name) || str(row.store_name),
            phone: strOrNull(store?.phone),
            place: [store?.city, store?.wilaya].filter((p) => typeof p === "string" && p).join(", ") || null,
        }
      : null,
    driver: driver
      ? {
          name: str(driver.full_name),
          phone: strOrNull(driver.phone),
          vehicle: strOrNull(driver.vehicle_type),
          plate: strOrNull(driver.plate_number),
        }
      : null,
    items: list(row.items).map((i) => ({ name: str(i.name), quantity: num(i.quantity), unitPrice: num(i.unit_price) })),
    subtotal: num(row.subtotal),
    deliveryFee: num(row.delivery_fee),
    serviceFee: num(row.service_fee),
    discount: num(row.discount),
    total: num(row.total),
    coupon: coupon && strOrNull(coupon.code) ? { code: str(coupon.code), title: strOrNull(coupon.title) } : null,
    pickup,
    dropoffs,
    distanceKm: numOrNull(ride?.distance_km) ?? numOrNull(courier?.distance_km),
    durationMinutes: numOrNull(ride?.duration_minutes),
    courier: courier
      ? {
          parcelType: strOrNull(parcel?.type),
          parcelSize: strOrNull(parcel?.size),
          parcelNote: strOrNull(parcel?.note),
          paidBy: strOrNull(courier.paid_by),
        }
      : null,
    ride: ride
      ? {
          passengerName: strOrNull(passenger?.name),
          passengerPhone: strOrNull(passenger?.phone),
          femaleRiderOnly: ride.female_rider_only === true,
        }
      : null,
    timeline,
    cancel: Object.values(cancel).some((v) => v !== null) ? cancel : null,
    merchantStatus: strOrNull(row.merchant_status),
    reviews: {
      storeRating: numOrNull(row.store_rating),
      storeReview: strOrNull(row.store_review),
      storeReply: strOrNull(row.store_review_reply),
      riderRating: numOrNull(row.rider_rating),
      riderReview: strOrNull(row.rider_review),
      riderTags: Array.isArray(row.rider_tags) ? row.rider_tags.filter((t): t is string => typeof t === "string") : [],
    },
    vehicleType: strOrNull(row.vehicle_type),
    deliveryMode: strOrNull(row.delivery_mode),
    zone: strOrNull(one(row.zone)?.name),
    tier: strOrNull(row.pricing_tier),
    commissionRate: numOrNull(row.merchant_commission_rate),
    stampDutyRate: numOrNull(row.stamp_duty_rate),
    path: toPath(row.route_path),
  };
}

export const toOrderTrips = (rows: unknown): OrderTrip[] =>
  list(rows).map((r) => ({
    id: str(r.id),
    displayId: str(r.display_id),
    status: str(r.status),
    payout: num(r.net_payout),
    createdAt: str(r.created_at),
  }));

/** Minutes between two ISO times, or null when either is missing / out of order. */
export function minutesBetween(from: string | null, to: string | null): number | null {
  if (!from || !to) return null;
  const ms = Date.parse(to) - Date.parse(from);
  return Number.isFinite(ms) && ms >= 0 ? Math.round(ms / 60000) : null;
}

/** Pickup + drop-off markers for the route map; stops without coordinates are skipped. */
export function stopMarkers(pickup: Stop | null, dropoffs: Stop[]): MapMarker[] {
  const marker = (s: Stop, kind: "pickup" | "dropoff", id: string): MapMarker[] =>
    s.lat !== null && s.lng !== null ? [{ id, lat: s.lat, lng: s.lng, kind, label: s.label || s.address }] : [];
  return [...(pickup ? marker(pickup, "pickup", "pickup") : []), ...dropoffs.flatMap((d, i) => marker(d, "dropoff", `dropoff-${i}`))];
}
