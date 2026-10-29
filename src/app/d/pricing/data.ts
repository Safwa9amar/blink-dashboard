import { cache } from "react";
import { requirePathAccess } from "@/lib/auth/staff";
import { blinkApi } from "@/lib/blink-api";
import { blinkApiErrorMessage } from "@/lib/blink-api-errors";
import type { Change, Fee, Override, OverrideFilters, VehicleClass, ZonesPayload } from "@/features/pricing";
import { PRICING_READ_ROLES, PRICING_WRITE_ROLES } from "./roles";

// Server loaders for the /pricing routes. Every loader gates on the section first.
const SECTION = "/pricing";
const NS = "pricing";

type Loaded<T> = { data: T; error?: string };

/** Whether the viewer may edit (hides edit controls for view-only roles). */
export const getPricingAccess = cache(async () => {
  const role = await requirePathAccess(SECTION);
  return { role, canEdit: PRICING_WRITE_ROLES.includes(role) };
});

/** The fee catalog; `classes` are its `vehicle_classes` (empty on a server that predates vehicle classes). */
export const getCatalog = cache(async (): Promise<Loaded<Fee[]> & { classes: VehicleClass[] }> => {
  await requirePathAccess(SECTION);
  const res = await blinkApi<{ fees: Fee[]; vehicle_classes?: VehicleClass[] }>("/pricing/admin/catalog", { roles: PRICING_READ_ROLES });
  if (!res.ok) return { data: [], classes: [], error: await blinkApiErrorMessage(NS, res) };
  return { data: res.data.fees, classes: res.data.vehicle_classes ?? [] };
});

/** Classes with rider counts, archived ones included (the /pricing/vehicles manager). */
export const getVehicleClasses = cache(async (): Promise<Loaded<VehicleClass[]>> => {
  await requirePathAccess(SECTION);
  const res = await blinkApi<{ vehicle_classes?: VehicleClass[]; classes?: VehicleClass[] }>(
    "/pricing/admin/vehicle-classes?include_archived=true",
    { roles: PRICING_READ_ROLES },
  );
  if (!res.ok) return { data: [], error: await blinkApiErrorMessage(NS, res) };
  return { data: res.data.vehicle_classes ?? res.data.classes ?? [] };
});

export async function getOverrides(filters: OverrideFilters): Promise<Loaded<Override[]>> {
  await requirePathAccess(SECTION);
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(filters)) if (v) qs.set(k, v);
  const res = await blinkApi<{ overrides: Override[] }>(`/pricing/admin/overrides?${qs}`, { roles: PRICING_READ_ROLES });
  if (!res.ok) return { data: [], error: await blinkApiErrorMessage(NS, res) };
  return { data: res.data.overrides };
}

export async function getHistory(key?: string, limit = 100): Promise<Loaded<Change[]>> {
  await requirePathAccess(SECTION);
  const qs = new URLSearchParams({ limit: String(limit) });
  if (key) qs.set("key", key);
  const res = await blinkApi<{ changes: Change[] }>(`/pricing/admin/history?${qs}`, { roles: PRICING_READ_ROLES });
  if (!res.ok) return { data: [], error: await blinkApiErrorMessage(NS, res) };
  return { data: res.data.changes };
}

const EMPTY_ZONES: ZonesPayload = { zones: [], tiers: [], unzoned_tier: "" };

/** Zones + tiers + the unzoned tier (cached per request: layout and page share one call). */
export const getZones = cache(async (): Promise<Loaded<ZonesPayload>> => {
  await requirePathAccess(SECTION);
  const res = await blinkApi<ZonesPayload>("/pricing/admin/zones?include_archived=true", { roles: PRICING_READ_ROLES });
  if (!res.ok) return { data: EMPTY_ZONES, error: await blinkApiErrorMessage(NS, res) };
  return { data: res.data };
});
