import {
  type RiderRow,
  type RiderVehicle,
  type RiderVerification,
  type VehicleDocKey,
  type VehicleDocState,
} from "./types";

type Rec = Record<string, unknown>;
const isRec = (v: unknown): v is Rec => typeof v === "object" && v !== null && !Array.isArray(v);
const str = (v: unknown): string => (typeof v === "string" ? v : "");
const strOrNull = (v: unknown): string | null => (typeof v === "string" && v ? v : null);
// PostgREST returns a to-one embed as an object, or a one-element array.
const one = (v: unknown): Rec | null => (Array.isArray(v) ? (isRec(v[0]) ? v[0] : null) : isRec(v) ? v : null);

const VERIFICATION: readonly RiderVerification[] = ["not_submitted", "pending", "approved", "rejected"];

/** State of one rider_profiles.documents entry: no stored path = not uploaded. */
function docState(entry: unknown): VehicleDocState {
  if (!isRec(entry) || !strOrNull(entry.path)) return "not_uploaded";
  return entry.status === "verified" || entry.status === "rejected" ? entry.status : "pending";
}

function toVehicleDocs(documents: unknown): Record<VehicleDocKey, VehicleDocState> {
  const docs = isRec(documents) ? documents : {};
  return {
    gray_card_front: docState(docs.gray_card_front),
    gray_card_back: docState(docs.gray_card_back),
    insurance: docState(docs.insurance),
  };
}

function toVehicle(v: Rec | null): RiderVehicle | null {
  if (!v) return null;
  return {
    brand: str(v.brand),
    model: str(v.model),
    plate: str(v.license_plate),
    year: str(v.year),
    color: str(v.color),
    category: str(v.category),
  };
}

/** rider_profiles row (with `documents`) with `users(first_name, last_name, phone_number, wilaya, vehicles(...))` embedded. */
export function toRiderRow(row: unknown): RiderRow | null {
  if (!isRec(row) || typeof row.id !== "string") return null;
  const user = one(row.users);
  const name = [user?.first_name, user?.last_name].filter((p) => typeof p === "string" && p).join(" ");
  const type = row.vehicle_type === "bicycle" || row.vehicle_type === "motorcycle" ? row.vehicle_type : null;
  return {
    id: row.id,
    riderId: str(row.rider_id),
    name,
    phone: strOrNull(user?.phone_number),
    wilaya: strOrNull(user?.wilaya),
    vehicleType: type,
    vehicle: toVehicle(one(user?.vehicles)),
    vehicleDocs: toVehicleDocs(row.documents),
    verification: VERIFICATION.find((s) => s === row.verification_status) ?? "not_submitted",
    available: row.is_available === true,
    joinedAt: str(row.created_at),
  };
}

/** Case-insensitive match on name, phone and rider id. */
export function matchesRider(r: RiderRow, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return [r.name, r.phone ?? "", r.riderId].some((f) => f.toLowerCase().includes(q));
}
