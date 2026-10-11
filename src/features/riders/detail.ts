// Rider detail page: pure helpers (id check, row → view model, status colours,
// activity totals). No I/O — src/app/d/riders/[id]/page.tsx fetches the rows.
import type { Variant } from "@/components/ui";
import type { RiderVehicle, RiderVehicleType, RiderVerification } from "./types";

type Rec = Record<string, unknown>;
const isRec = (v: unknown): v is Rec => typeof v === "object" && v !== null && !Array.isArray(v);
const str = (v: unknown): string => (typeof v === "string" ? v : "");
const strOrNull = (v: unknown): string | null => (typeof v === "string" && v ? v : null);
const numOrNull = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? v : null);
const one = (v: unknown): Rec | null => (Array.isArray(v) ? (isRec(v[0]) ? v[0] : null) : isRec(v) ? v : null);

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isUuid = (v: unknown): v is string => typeof v === "string" && UUID.test(v);

const VERIFICATION: readonly RiderVerification[] = ["not_submitted", "pending", "approved", "rejected"];

export interface RiderProfileView {
  /** users.id */
  id: string;
  riderId: string;
  name: string;
  phone: string | null;
  email: string | null;
  wilaya: string | null;
  /** users.is_active; null when the column isn't there / unset. */
  active: boolean | null;
  vehicleType: RiderVehicleType | null;
  vehicle: RiderVehicle | null;
  verification: RiderVerification;
  available: boolean;
  joinedAt: string;
  latitude: number | null;
  longitude: number | null;
  locationUpdatedAt: string | null;
}

/** rider_profiles row with `users(..., vehicles(...))` embedded → the page's profile view model. */
export function toRiderProfile(row: unknown): RiderProfileView | null {
  if (!isRec(row) || typeof row.user_id !== "string") return null;
  const user = one(row.users);
  const v = one(user?.vehicles);
  const type = row.vehicle_type === "bicycle" || row.vehicle_type === "motorcycle" ? row.vehicle_type : null;
  return {
    id: row.user_id,
    riderId: str(row.rider_id),
    name: [user?.first_name, user?.last_name].filter((p) => typeof p === "string" && p).join(" "),
    phone: strOrNull(user?.phone_number),
    email: strOrNull(user?.email),
    wilaya: strOrNull(user?.wilaya),
    active: typeof user?.is_active === "boolean" ? user.is_active : null,
    vehicleType: type,
    vehicle: v
      ? {
          brand: str(v.brand),
          model: str(v.model),
          plate: str(v.license_plate),
          year: str(v.year),
          color: str(v.color),
          category: str(v.category),
        }
      : null,
    verification: VERIFICATION.find((s) => s === row.verification_status) ?? "not_submitted",
    available: row.is_available === true,
    joinedAt: str(row.created_at),
    latitude: numOrNull(row.latitude),
    longitude: numOrNull(row.longitude),
    locationUpdatedAt: strOrNull(row.location_updated_at),
  };
}

export interface ActivityOrder { id: string; status: string; type: string; store: string; total: number; createdAt: string }
export interface ActivityTrip { id: string; status: string; from: string; to: string; payout: number; createdAt: string }
export interface ActivityTx { id: string; type: string; status: string; amount: number; fees: number; total: number; createdAt: string }

const num = (v: unknown): number => (typeof v === "number" && Number.isFinite(v) ? v : 0);
const list = (rows: unknown): Rec[] => (Array.isArray(rows) ? rows.filter(isRec) : []);

export const toActivityOrders = (rows: unknown): ActivityOrder[] =>
  list(rows).map((r) => ({
    id: str(r.id), status: str(r.status), type: str(r.type), store: str(r.store_name), total: num(r.total), createdAt: str(r.created_at),
  }));

export const toActivityTrips = (rows: unknown): ActivityTrip[] =>
  list(rows).map((r) => ({
    id: str(r.id), status: str(r.status), from: str(r.pickup_label), to: str(r.dropoff_label), payout: num(r.net_payout), createdAt: str(r.created_at),
  }));

export const toActivityTxs = (rows: unknown): ActivityTx[] =>
  list(rows).map((r) => ({
    id: str(r.id), type: str(r.type), status: str(r.status), amount: num(r.amount), fees: num(r.fees), total: num(r.total), createdAt: str(r.created_at),
  }));

/** Sum of the `total` column over rows (completed transactions). */
export function sumTotals(rows: unknown): number {
  return list(rows).reduce((acc, r) => acc + num(r.total), 0);
}

/** Short reference shown in tables: first 8 characters of the id, upper-cased. */
export const shortRef = (id: string): string => id.slice(0, 8).toUpperCase();

/** Badge colour for an order / trip / transaction status. */
export function statusVariant(status: string): Variant {
  switch (status) {
    case "delivered":
    case "completed":
      return "success";
    case "canceled":
    case "cancelled":
    case "merchant_rejected":
      return "danger";
    case "pending":
    case "under_review":
    case "searching":
    case "processing":
      return "warning";
    case "upcoming":
    case "heading_to_store":
    case "preparation":
    case "pickup":
    case "on_the_way":
      return "info";
    default:
      return "default";
  }
}

/** One independently loaded section of the page: its data, or why it couldn't load. */
export interface Block<T> {
  data: T;
  error: string | null;
}

/** `Promise.allSettled` result → Block (a thrown error or a Supabase `{ error }` becomes the block's error). */
export function toBlock<T>(
  settled: PromiseSettledResult<{ data: T; error: string | null }>,
  empty: T
): Block<T> {
  if (settled.status === "rejected") {
    return { data: empty, error: settled.reason instanceof Error ? settled.reason.message : String(settled.reason) };
  }
  return settled.value.error ? { data: empty, error: settled.value.error } : settled.value;
}
