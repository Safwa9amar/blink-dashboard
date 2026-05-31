// Domain types for the vehicles (fleet) feature.
// Modelled on the real Blink Supabase schema (blink-server 00001_initial_schema.sql):
//   - vehicle_type ENUM  → 'bicycle' | 'motorcycle'   (cars are not supported yet)
//   - vehicle_category   → 'standard' | 'electric' | 'hybrid'
//   - document_status    → 'approved' | 'needs_update' | 'pending' | 'not_uploaded'
// A vehicle carries three embedded documents as columns on the `vehicles` table:
//   gray card (carte grise), insurance (assurance) and driving licence (permis).
export type TFn = (k: string, v?: Record<string, string | number>) => string;

export type VehicleType = "bicycle" | "motorcycle";
export type VehicleCategory = "standard" | "electric" | "hybrid";
export type DocStatus = "approved" | "needs_update" | "pending" | "not_uploaded";

// The three document slots embedded on a vehicle row, keyed by camelCase.
export type DocKey = "grayCard" | "insurance" | "drivingLicense";

// Algerian wilayas — structured location (free text in the DB).
export type Wilaya = "Alger" | "Oran" | "Constantine" | "Annaba" | "Blida" | "Setif" | "Tlemcen";

// A fleet row = the `vehicles` record joined with its owning rider (rider_profiles + users).
// Field names mirror the schema columns; rider-level fields are read-only enrichments.
export interface Vehicle {
  id: string;
  userId: string; // vehicles.user_id → the owning rider (one vehicle per rider)
  // --- rider enrichment (rider_profiles + users) ---
  riderCode: string; // rider_profiles.rider_id, display ID e.g. "BK-9921"
  riderName: string; // users.first_name + last_name
  wilaya: Wilaya; // rider_profiles.wilaya
  vehicleType: VehicleType; // rider_profiles.vehicle_type
  // --- vehicle spec (vehicles) ---
  brand: string; // vehicles.brand
  model: string; // vehicles.model
  licensePlate: string; // vehicles.license_plate ("" for bicycles)
  year: string; // vehicles.year (TEXT in the schema)
  color: string; // vehicles.color
  category: VehicleCategory; // vehicles.category
  // --- embedded documents (vehicles.*_status) ---
  grayCardStatus: DocStatus; // vehicles.gray_card_status — carte grise
  insuranceStatus: DocStatus; // vehicles.insurance_status — assurance
  drivingLicenseStatus: DocStatus; // vehicles.driving_license_status — permis de conduire
  createdAt: number;
}

// Form input — admin enters rider + spec; doc statuses default to not_uploaded.
export type NewVehicleInput = Omit<Vehicle, "id" | "createdAt">;

// A flattened document-review row (one per required doc slot) for the Documents tab.
export interface DocRow {
  id: string; // `${vehicleId}:${key}`
  vehicleId: string;
  key: DocKey;
  status: DocStatus;
  vehicle: Vehicle; // back-reference for rendering the vehicle/rider cells
}
