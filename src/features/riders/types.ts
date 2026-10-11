// Rider list view model: rider_profiles ⨝ users (name, phone, wilaya) ⨝ vehicles
// (one row per user). Mapped from PostgREST rows in rows.ts so the client only
// receives plain, serializable fields.
export type RiderVerification = "not_submitted" | "pending" | "approved" | "rejected";
export type RiderVehicleType = "bicycle" | "motorcycle";
/** Review state of a vehicle document held in rider_profiles.documents. */
export type VehicleDocState = "not_uploaded" | "pending" | "verified" | "rejected";
export const VEHICLE_DOC_KEYS = ["gray_card_front", "gray_card_back", "insurance"] as const;
export type VehicleDocKey = (typeof VEHICLE_DOC_KEYS)[number];

export interface RiderVehicle {
  brand: string;
  model: string;
  plate: string;
  year: string;
  color: string;
  category: string;
}

export interface RiderRow {
  /** rider_profiles.id */
  id: string;
  /** Display ID, e.g. "BK-RR-100001". */
  riderId: string;
  name: string;
  phone: string | null;
  wilaya: string | null;
  vehicleType: RiderVehicleType | null;
  vehicle: RiderVehicle | null;
  /** Gray card / insurance review state, from rider_profiles.documents. */
  vehicleDocs: Record<VehicleDocKey, VehicleDocState>;
  verification: RiderVerification;
  available: boolean;
  joinedAt: string;
}
