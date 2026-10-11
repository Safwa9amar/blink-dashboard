// Rider list view model: rider_profiles ⨝ users (name, phone, wilaya) ⨝ vehicles
// (one row per user). Mapped from PostgREST rows in rows.ts so the client only
// receives plain, serializable fields.
export type RiderVerification = "not_submitted" | "pending" | "approved" | "rejected";
export type RiderVehicleType = "bicycle" | "motorcycle";
export type VehicleDocState = "approved" | "needs_update" | "pending" | "not_uploaded";

export interface RiderVehicle {
  brand: string;
  model: string;
  plate: string;
  year: string;
  color: string;
  category: string;
  grayCard: VehicleDocState;
  insurance: VehicleDocState;
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
  verification: RiderVerification;
  available: boolean;
  joinedAt: string;
}
