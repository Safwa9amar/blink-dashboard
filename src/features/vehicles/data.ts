import type { Variant } from "@/components/ui";
import type {
  Vehicle,
  VehicleType,
  VehicleCategory,
  DocStatus,
  DocKey,
  DocRow,
} from "./types";

export type {
  TFn,
  VehicleType,
  VehicleCategory,
  DocStatus,
  DocKey,
  Wilaya,
  Vehicle,
  DocRow,
  NewVehicleInput,
} from "./types";

export const WILAYAS = ["Alger", "Oran", "Constantine", "Annaba", "Blida", "Setif", "Tlemcen"] as const;

// ---- enum key lists (for selects / filter pills) ----
export const VEHICLE_TYPE_KEYS: VehicleType[] = ["motorcycle", "bicycle"];
export const VEHICLE_CATEGORY_KEYS: VehicleCategory[] = ["standard", "electric", "hybrid"];
export const DOC_STATUS_KEYS: DocStatus[] = ["approved", "pending", "needs_update", "not_uploaded"];

// The three embedded document slots, in display order.
export const DOC_KEYS: DocKey[] = ["grayCard", "insurance", "drivingLicense"];
// Maps a DocKey → the i18n sub-key + (informational) schema column.
export const DOC_COLUMN: Record<DocKey, string> = {
  grayCard: "gray_card_status",
  insurance: "insurance_status",
  drivingLicense: "driving_license_status",
};

// ---- variant maps (enum value → semantic Badge variant) ----
export const VEHICLE_TYPE: Record<VehicleType, Variant> = {
  motorcycle: "info",
  bicycle: "success",
};
export const VEHICLE_CATEGORY: Record<VehicleCategory, Variant> = {
  standard: "default",
  electric: "success",
  hybrid: "info",
};
// Aligned with the verification (KYC) status colours.
export const DOC_STATUS: Record<DocStatus, Variant> = {
  approved: "success",
  pending: "warning",
  needs_update: "danger",
  not_uploaded: "default",
};

// Glyph for a vehicle type (only `bike` exists in the icon kit today; both share it).
export const TYPE_ICON: Record<VehicleType, string> = {
  motorcycle: "bike",
  bicycle: "bike",
};

// Which document slots each vehicle type must carry. Motorcycles need the full set;
// bicycles need none (no registration / insurance / licence in Algeria).
export const REQUIRED_DOCS: Record<VehicleType, DocKey[]> = {
  motorcycle: ["grayCard", "insurance", "drivingLicense"],
  bicycle: [],
};

// Read a vehicle's document status by slot key.
export function docStatusOf(vehicle: Vehicle, key: DocKey): DocStatus {
  if (key === "grayCard") return vehicle.grayCardStatus;
  if (key === "insurance") return vehicle.insuranceStatus;
  return vehicle.drivingLicenseStatus;
}

// Overall compliance of a vehicle, derived from its required documents.
// Returns the "worst" outstanding status, or "approved" when fully compliant
// (bicycles, having no required docs, are always compliant).
export function vehicleCompliance(vehicle: Vehicle): DocStatus {
  const required = REQUIRED_DOCS[vehicle.vehicleType];
  if (!required.length) return "approved";
  const statuses = required.map((k) => docStatusOf(vehicle, k));
  if (statuses.includes("needs_update")) return "needs_update";
  if (statuses.includes("not_uploaded")) return "not_uploaded";
  if (statuses.includes("pending")) return "pending";
  return "approved";
}

// Flatten every required doc slot across the fleet into review rows.
export function buildDocRows(vehicles: Vehicle[]): DocRow[] {
  const rows: DocRow[] = [];
  for (const vehicle of vehicles) {
    for (const key of REQUIRED_DOCS[vehicle.vehicleType]) {
      rows.push({
        id: `${vehicle.id}:${key}`,
        vehicleId: vehicle.id,
        key,
        status: docStatusOf(vehicle, key),
        vehicle,
      });
    }
  }
  return rows;
}

// ---- derived KPIs ----
export function deriveStats(vehicles: Vehicle[]) {
  const docRows = buildDocRows(vehicles);
  return {
    totalVehicles: vehicles.length,
    motorcycles: vehicles.filter((v) => v.vehicleType === "motorcycle").length,
    bicycles: vehicles.filter((v) => v.vehicleType === "bicycle").length,
    fullyCompliant: vehicles.filter((v) => vehicleCompliance(v) === "approved").length,
    pendingReview: docRows.filter((d) => d.status === "pending").length,
    needsAttention: docRows.filter((d) => d.status === "needs_update" || d.status === "not_uploaded")
      .length,
  };
}

// ---- seed data (realistic Algerian fleet; swappable for Supabase later) ----
const day = 86_400_000;
const NOW = Date.now();
const ago = (n: number) => NOW - n * day;

export const SEED_VEHICLES: Vehicle[] = [
  { id: "veh-1", userId: "usr-2041", riderCode: "BK-2041", riderName: "Yacine Haddad", wilaya: "Alger", vehicleType: "motorcycle", brand: "Yamaha", model: "NMAX 125", licensePlate: "00123-114-16", year: "2022", color: "Raspberry", category: "standard", grayCardStatus: "approved", insuranceStatus: "approved", drivingLicenseStatus: "approved", createdAt: ago(420) },
  { id: "veh-2", userId: "usr-2042", riderCode: "BK-2042", riderName: "Mohamed Saïdi", wilaya: "Oran", vehicleType: "motorcycle", brand: "Honda", model: "PCX 125", licensePlate: "00456-114-31", year: "2021", color: "Black", category: "standard", grayCardStatus: "approved", insuranceStatus: "pending", drivingLicenseStatus: "approved", createdAt: ago(510) },
  { id: "veh-3", userId: "usr-2043", riderCode: "BK-2043", riderName: "Sofiane Brahimi", wilaya: "Annaba", vehicleType: "bicycle", brand: "Decathlon", model: "Rockrider ST 30", licensePlate: "", year: "2023", color: "Blue", category: "standard", grayCardStatus: "not_uploaded", insuranceStatus: "not_uploaded", drivingLicenseStatus: "not_uploaded", createdAt: ago(260) },
  { id: "veh-4", userId: "usr-2044", riderCode: "BK-2044", riderName: "Amine Belkacem", wilaya: "Constantine", vehicleType: "motorcycle", brand: "SYM", model: "Symphony 125", licensePlate: "00789-114-25", year: "2020", color: "White", category: "standard", grayCardStatus: "approved", insuranceStatus: "needs_update", drivingLicenseStatus: "approved", createdAt: ago(640) },
  { id: "veh-5", userId: "usr-2045", riderCode: "BK-2045", riderName: "Riad Mansouri", wilaya: "Blida", vehicleType: "motorcycle", brand: "VMS", model: "Mxu 125", licensePlate: "01024-114-09", year: "2023", color: "Gray", category: "standard", grayCardStatus: "approved", insuranceStatus: "pending", drivingLicenseStatus: "pending", createdAt: ago(40) },
  { id: "veh-6", userId: "usr-2046", riderCode: "BK-2046", riderName: "Karim Ould Ali", wilaya: "Setif", vehicleType: "bicycle", brand: "Btwin", model: "Riverside 120 E", licensePlate: "", year: "2022", color: "Green", category: "electric", grayCardStatus: "not_uploaded", insuranceStatus: "not_uploaded", drivingLicenseStatus: "not_uploaded", createdAt: ago(300) },
  { id: "veh-7", userId: "usr-2047", riderCode: "BK-2047", riderName: "Bilal Cherif", wilaya: "Tlemcen", vehicleType: "motorcycle", brand: "Vespa", model: "Primavera 125", licensePlate: "00342-114-13", year: "2019", color: "Mint", category: "standard", grayCardStatus: "needs_update", insuranceStatus: "approved", drivingLicenseStatus: "not_uploaded", createdAt: ago(820) },
  { id: "veh-8", userId: "usr-2048", riderCode: "BK-2048", riderName: "Sami Larbi", wilaya: "Alger", vehicleType: "motorcycle", brand: "Honda", model: "CB 125F", licensePlate: "00911-114-16", year: "2022", color: "Red", category: "standard", grayCardStatus: "approved", insuranceStatus: "approved", drivingLicenseStatus: "approved", createdAt: ago(180) },
  { id: "veh-9", userId: "usr-2049", riderCode: "BK-2049", riderName: "Nabil Cherfi", wilaya: "Oran", vehicleType: "motorcycle", brand: "Yamaha", model: "NMAX 155", licensePlate: "01337-114-31", year: "2024", color: "Blue", category: "hybrid", grayCardStatus: "pending", insuranceStatus: "pending", drivingLicenseStatus: "pending", createdAt: ago(15) },
  { id: "veh-10", userId: "usr-2050", riderCode: "BK-2050", riderName: "Hichem Ferhat", wilaya: "Blida", vehicleType: "bicycle", brand: "Cannondale", model: "Quick 4", licensePlate: "", year: "2023", color: "Black", category: "standard", grayCardStatus: "not_uploaded", insuranceStatus: "not_uploaded", drivingLicenseStatus: "not_uploaded", createdAt: ago(90) },
];
