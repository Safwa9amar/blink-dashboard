// Trip detail page: pure helpers (row → view model). No I/O —
// src/app/d/trips/[id]/page.tsx fetches the row. Person / stop / GPS-trail
// mapping is shared with the order detail page.
import { columnStop, toPath, toPerson, type LatLng, type Person, type Stop } from "@/features/orders/detail";

type Rec = Record<string, unknown>;
const isRec = (v: unknown): v is Rec => typeof v === "object" && v !== null && !Array.isArray(v);
const str = (v: unknown): string => (typeof v === "string" ? v : "");
const strOrNull = (v: unknown): string | null => (typeof v === "string" && v ? v : null);
const numOrNull = (v: unknown): number | null => {
  const n = typeof v === "string" && v.trim() ? Number(v) : v;
  return typeof n === "number" && Number.isFinite(n) ? n : null;
};
const one = (v: unknown): Rec | null => (Array.isArray(v) ? (isRec(v[0]) ? v[0] : null) : isRec(v) ? v : null);

export interface TripOrder {
  id: string;
  type: string;
  status: string;
  store: string;
  total: number;
  createdAt: string;
}

export interface TripDetail {
  id: string;
  displayId: string;
  status: string;
  disputeStatus: string | null;
  createdAt: string;
  updatedAt: string;
  rider: Person | null;
  customer: Person | null;
  order: TripOrder | null;
  pickup: Stop | null;
  dropoff: Stop | null;
  distanceKm: number | null;
  durationMinutes: number | null;
  estimatedPayout: number | null;
  netPayout: number | null;
  commissionRate: number | null;
  penaltyAmount: number | null;
  customerRating: number | null;
  cancellationReason: string | null;
  notes: string | null;
  fraudNotice: string | null;
  path: LatLng[];
}

/** Trip row with the page's embeds (rider, customer, order) → view model. */
export function toTripDetail(row: unknown): TripDetail | null {
  if (!isRec(row) || typeof row.id !== "string") return null;
  const order = one(row.order);
  return {
    id: row.id,
    displayId: str(row.display_id),
    status: str(row.status),
    disputeStatus: strOrNull(row.dispute_status),
    createdAt: str(row.created_at),
    updatedAt: str(row.updated_at),
    rider: toPerson(row.rider),
    customer: toPerson(row.customer),
    order:
      order && typeof order.id === "string"
        ? {
            id: order.id,
            type: str(order.type),
            status: str(order.status),
            store: str(order.store_name),
            total: numOrNull(order.total) ?? 0,
            createdAt: str(order.created_at),
          }
        : null,
    pickup: columnStop(row.pickup_label, row.pickup_address, row.pickup_lat, row.pickup_lng),
    dropoff: columnStop(row.dropoff_label, row.dropoff_address, row.dropoff_lat, row.dropoff_lng),
    distanceKm: numOrNull(row.distance_km),
    durationMinutes: numOrNull(row.duration_minutes),
    estimatedPayout: numOrNull(row.estimated_payout),
    netPayout: numOrNull(row.net_payout),
    commissionRate: numOrNull(row.commission_rate),
    penaltyAmount: numOrNull(row.penalty_amount),
    customerRating: numOrNull(row.customer_rating),
    cancellationReason: strOrNull(row.cancellation_reason),
    notes: strOrNull(row.notes),
    fraudNotice: strOrNull(row.fraud_notice),
    path: toPath(row.route_path),
  };
}
