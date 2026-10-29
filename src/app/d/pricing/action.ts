"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { getCurrentStaffRole, hasStaffRole } from "@/lib/auth/staff";
import { blinkApi, type BlinkApiResult } from "@/lib/blink-api";
import { blinkApiErrorMessage } from "@/lib/blink-api-errors";
import { createAdminClient } from "@/lib/supabase/admin";
import type {
  ActionResult,
  Fee,
  FeeValue,
  Override,
  OverrideInput,
  PartnerHit,
  PartnerKind,
  PreviewContext,
  PreviewResult,
  PreviewSample,
  SimulateBody,
  SimulateResult,
  PricingKey,
  Tier,
  TierInput,
  TierPatch,
  Zone,
  ZoneInput,
  ZoneLookup,
  ZonePatch,
  ZonesPayload,
  GeoFeatureCollection,
  VehicleClass,
  VehicleClassInput,
  VehicleClassPatch,
  RiderClassState,
} from "@/features/pricing";
import { PRICING_KEYS } from "@/features/pricing";

// Staff pricing goes through blink-server (`/pricing/admin/*`): it validates the value
// against the fee's schema, writes the audit row and notifies targeted partners.
import { PRICING_READ_ROLES, PRICING_WRITE_ROLES } from "./roles";
const NS = "pricing";
const ID_RE = /^[0-9a-f-]{36}$/i;
const TIER_RE = /^[a-z][a-z0-9_]{1,23}$/;

async function fail(res: Extract<BlinkApiResult<unknown>, { ok: false }>): Promise<Extract<ActionResult, { ok: false }>> {
  const bodyCode = (res.body as { code?: unknown } | null | undefined)?.code;
  const errCode = res.code ?? (typeof bodyCode === "string" ? bodyCode : undefined);
  if (res.status === 409 && (errCode === "zone_in_use" || errCode === "tier_in_use" || res.error === "zone_in_use" || res.error === "tier_in_use")) {
    const code = errCode ?? res.error;
    const count = (res.body as { override_count?: unknown } | null | undefined)?.override_count;
    const t = await getTranslations(`${NS}.errors`);
    return {
      ok: false,
      status: 409,
      code,
      error: t(code),
      ...(typeof count === "number" ? { overrideCount: count } : {}),
    };
  }
  if (res.status === 409 && (errCode === "class_in_use" || res.error === "class_in_use")) {
    const b = res.body as { rider_count?: unknown; override_count?: unknown; open_orders?: unknown } | null | undefined;
    const n = (v: unknown) => (typeof v === "number" ? v : undefined);
    const t = await getTranslations(`${NS}.errors`);
    return {
      ok: false,
      status: 409,
      code: "class_in_use",
      error: t("class_in_use"),
      usage: { riders: n(b?.rider_count), overrides: n(b?.override_count), orders: n(b?.open_orders) },
    };
  }
  if (res.status === 400 && errCode === "class") {
    const t = await getTranslations(`${NS}.errors`);
    return { ok: false, status: 400, code: "class", error: t("class_mismatch") };
  }
  if (res.status === 400 && errCode === "geometry") {
    const t = await getTranslations(`${NS}.errors`);
    return { ok: false, status: 400, code: "geometry", error: t("geometry", { detail: res.error }) };
  }
  if (res.status === 409) {
    const t = await getTranslations(`${NS}.errors`);
    if (res.error === "stale") {
      revalidatePath("/d/pricing", "layout");
      return { ok: false, error: t("stale"), stale: true };
    }
    if (res.error === "overlap") {
      const id = (res.body as { conflict_id?: unknown } | null | undefined)?.conflict_id;
      return { ok: false, error: t("overlap"), conflictId: typeof id === "string" ? id : undefined };
    }
  }
  return {
    ok: false,
    error: await blinkApiErrorMessage(NS, res),
    status: res.status,
    ...(errCode ? { code: errCode } : {}),
  };
}

const done = () => revalidatePath("/d/pricing", "layout");

const isKey = (k: unknown): k is PricingKey => typeof k === "string" && (PRICING_KEYS as readonly string[]).includes(k);

export async function updateDefault(
  key: PricingKey,
  value: FeeValue,
  expectedUpdatedAt: string | null
): Promise<ActionResult<Fee>> {
  if (!isKey(key)) return { ok: false, error: await blinkApiErrorMessage(NS, { status: 400, error: "Unknown fee" }) };
  const res = await blinkApi<{ fee: Fee }>(`/pricing/admin/defaults/${key}`, {
    method: "PUT",
    body: { value, ...(expectedUpdatedAt ? { expected_updated_at: expectedUpdatedAt } : {}) },
    roles: PRICING_WRITE_ROLES,
  });
  if (!res.ok) return fail(res);
  done();
  return { ok: true, data: res.data.fee };
}

export async function createOverride(input: OverrideInput): Promise<ActionResult<Override>> {
  const res = await blinkApi<{ override: Override }>("/pricing/admin/overrides", {
    method: "POST",
    body: input,
    roles: PRICING_WRITE_ROLES,
  });
  if (!res.ok) return fail(res);
  done();
  return { ok: true, data: res.data.override };
}

export async function updateOverride(
  id: string,
  patch: { value?: FeeValue; starts_at?: string | null; ends_at?: string | null; note?: string | null }
): Promise<ActionResult<Override>> {
  if (!ID_RE.test(id)) return { ok: false, error: await blinkApiErrorMessage(NS, { status: 400, error: "Bad id" }) };
  const res = await blinkApi<{ override: Override }>(`/pricing/admin/overrides/${id}`, {
    method: "PATCH",
    body: patch,
    roles: PRICING_WRITE_ROLES,
  });
  if (!res.ok) return fail(res);
  done();
  return { ok: true, data: res.data.override };
}

export async function archiveOverride(id: string): Promise<ActionResult<Override>> {
  if (!ID_RE.test(id)) return { ok: false, error: await blinkApiErrorMessage(NS, { status: 400, error: "Bad id" }) };
  const res = await blinkApi<{ override: Override }>(`/pricing/admin/overrides/${id}`, {
    method: "DELETE",
    roles: PRICING_WRITE_ROLES,
  });
  if (!res.ok) return fail(res);
  done();
  return { ok: true, data: res.data.override };
}

export async function previewPricing(
  context: PreviewContext,
  sample?: PreviewSample,
  candidate?: { key: PricingKey; value: FeeValue }
): Promise<ActionResult<PreviewResult>> {
  const res = await blinkApi<PreviewResult>("/pricing/admin/preview", {
    method: "POST",
    body: { context, ...(sample ? { sample } : {}), ...(candidate ? { candidate } : {}) },
    roles: PRICING_READ_ROLES,
  });
  if (!res.ok) return fail(res);
  return { ok: true, data: res.data };
}

/** The fee catalog (+ vehicle classes) — lazily fetched by the override modal when opened outside /pricing. */
export async function loadCatalog(): Promise<ActionResult<{ fees: Fee[]; classes: VehicleClass[] }>> {
  const res = await blinkApi<{ fees: Fee[]; vehicle_classes?: VehicleClass[] }>("/pricing/admin/catalog", { roles: PRICING_READ_ROLES });
  if (!res.ok) return fail(res);
  return { ok: true, data: { fees: res.data.fees, classes: res.data.vehicle_classes ?? [] } };
}

/** One partner's overrides (merchant / agent "Pricing deals" card) + whether the viewer may edit. */
export async function listPartnerOverrides(
  kind: PartnerKind,
  partnerId: string
): Promise<ActionResult<{ overrides: Override[]; canEdit: boolean }>> {
  if (!ID_RE.test(partnerId)) return { ok: false, error: await blinkApiErrorMessage(NS, { status: 400, error: "Bad id" }) };
  const param = kind === "merchant" ? "merchant_id" : "agent_id";
  const res = await blinkApi<{ overrides: Override[] }>(`/pricing/admin/overrides?${param}=${partnerId}`, {
    roles: PRICING_READ_ROLES,
  });
  if (!res.ok) return fail(res);
  const role = await getCurrentStaffRole();
  const canEdit = role !== null && PRICING_WRITE_ROLES.includes(role);
  return { ok: true, data: { overrides: res.data.overrides, canEdit } };
}

/** Merchant / agent picker: name, email or phone search over `users`. */
export async function searchPartners(kind: PartnerKind, query: string): Promise<PartnerHit[]> {
  if (!(await hasStaffRole(...PRICING_READ_ROLES))) return [];
  const q = query.replace(/[^\p{L}\p{N}@.+\- ]/gu, "").trim().slice(0, 40);
  if (q.length < 2) return [];
  const supabase = await createAdminClient();
  const like = `%${q}%`;
  const { data } = await supabase
    .from("users")
    .select("id, first_name, last_name, email, phone_number")
    .eq("role", kind)
    .is("staff_role", null)
    .or(`first_name.ilike.${like},last_name.ilike.${like},email.ilike.${like},phone_number.ilike.${like}`)
    .limit(8);
  return ((data ?? []) as Record<string, string | null>[]).map((u) => ({
    id: u.id as string,
    name: [u.first_name, u.last_name].filter(Boolean).join(" ") || u.email || (u.id as string),
    sub: u.email || u.phone_number || "",
  }));
}

/** "What does this order cost and who earns what?" — all numbers come from the server. */
export async function simulatePricing(body: SimulateBody): Promise<ActionResult<SimulateResult>> {
  const res = await blinkApi<SimulateResult>("/pricing/admin/simulate", {
    method: "POST",
    body,
    roles: PRICING_READ_ROLES,
  });
  if (!res.ok) return fail(res);
  return { ok: true, data: res.data };
}

export type StoreHit = { id: string; name: string; city: string };

/** A merchant's stores (name + city) for the simulator's store select. */
export async function listMerchantStores(merchantId: string): Promise<StoreHit[]> {
  if (!ID_RE.test(merchantId) || !(await hasStaffRole(...PRICING_READ_ROLES))) return [];
  const supabase = await createAdminClient();
  const { data } = await supabase
    .from("stores")
    .select("id, name, city")
    .eq("owner_id", merchantId)
    .order("name", { ascending: true })
    .limit(50);
  return ((data ?? []) as { id: string; name: string | null; city: string | null }[]).map((s) => ({
    id: s.id,
    name: s.name ?? s.id,
    city: s.city ?? "",
  }));
}

// ---- zones & tiers -------------------------------------------------------------------

/** Zones + tiers (+ the unzoned tier) — lazily fetched by editors opened outside /pricing/zones. */
export async function loadZones(includeArchived = false): Promise<ActionResult<ZonesPayload>> {
  const res = await blinkApi<ZonesPayload>(`/pricing/admin/zones?include_archived=${includeArchived}`, { roles: PRICING_READ_ROLES });
  if (!res.ok) return fail(res);
  return { ok: true, data: res.data };
}

export async function createZone(input: ZoneInput): Promise<ActionResult<Zone>> {
  const res = await blinkApi<{ zone: Zone }>("/pricing/admin/zones", { method: "POST", body: input, roles: PRICING_WRITE_ROLES });
  if (!res.ok) return fail(res);
  done();
  return { ok: true, data: res.data.zone };
}

export async function updateZone(id: string, patch: ZonePatch): Promise<ActionResult<Zone>> {
  if (!ID_RE.test(id)) return { ok: false, error: await blinkApiErrorMessage(NS, { status: 400, error: "Bad id" }) };
  const res = await blinkApi<{ zone: Zone }>(`/pricing/admin/zones/${id}`, { method: "PATCH", body: patch, roles: PRICING_WRITE_ROLES });
  if (!res.ok) return fail(res);
  done();
  return { ok: true, data: res.data.zone };
}

/** Archive (soft delete). Fails with `zone_in_use` while live overrides still use the zone. */
export async function archiveZone(id: string): Promise<ActionResult<Zone>> {
  if (!ID_RE.test(id)) return { ok: false, error: await blinkApiErrorMessage(NS, { status: 400, error: "Bad id" }) };
  const res = await blinkApi<{ zone: Zone }>(`/pricing/admin/zones/${id}`, { method: "DELETE", roles: PRICING_WRITE_ROLES });
  if (!res.ok) return fail(res);
  done();
  return { ok: true, data: res.data.zone };
}

/** All-or-nothing GeoJSON import; every feature gets `tier`, its name from `name_property`. */
export async function importZones(
  geojson: GeoFeatureCollection,
  tier: string,
  nameProperty = "name"
): Promise<ActionResult<Zone[]>> {
  const res = await blinkApi<{ zones: Zone[] }>("/pricing/admin/zones/import", {
    method: "POST",
    body: { geojson, tier, name_property: nameProperty },
    roles: PRICING_WRITE_ROLES,
  });
  if (!res.ok) return fail(res);
  done();
  return { ok: true, data: res.data.zones };
}

/** What a map click is priced as: place, effective values and sample fares (all from the server). */
export async function lookupZone(lat: number, lng: number): Promise<ActionResult<ZoneLookup>> {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return { ok: false, error: await blinkApiErrorMessage(NS, { status: 400, error: "Bad point" }) };
  const res = await blinkApi<ZoneLookup>(`/pricing/admin/zones/lookup?lat=${lat}&lng=${lng}`, { roles: PRICING_READ_ROLES });
  if (!res.ok) return fail(res);
  return { ok: true, data: res.data };
}

export async function createTier(input: TierInput): Promise<ActionResult<Tier>> {
  const res = await blinkApi<{ tier: Tier }>("/pricing/admin/tiers", { method: "POST", body: input, roles: PRICING_WRITE_ROLES });
  if (!res.ok) return fail(res);
  done();
  return { ok: true, data: res.data.tier };
}

export async function updateTier(code: string, patch: TierPatch): Promise<ActionResult<Tier>> {
  if (!TIER_RE.test(code)) return { ok: false, error: await blinkApiErrorMessage(NS, { status: 400, error: "Bad code" }) };
  const res = await blinkApi<{ tier: Tier }>(`/pricing/admin/tiers/${code}`, { method: "PATCH", body: patch, roles: PRICING_WRITE_ROLES });
  if (!res.ok) return fail(res);
  done();
  return { ok: true, data: res.data.tier };
}

/** Archive a tier. Fails with `tier_in_use` while a live zone / override / `zone_defaults` uses it. */
export async function archiveTier(code: string): Promise<ActionResult<Tier>> {
  if (!TIER_RE.test(code)) return { ok: false, error: await blinkApiErrorMessage(NS, { status: 400, error: "Bad code" }) };
  const res = await blinkApi<{ tier: Tier }>(`/pricing/admin/tiers/${code}`, { method: "DELETE", roles: PRICING_WRITE_ROLES });
  if (!res.ok) return fail(res);
  done();
  return { ok: true, data: res.data.tier };
}

// ---- vehicle classes -----------------------------------------------------------------

const CLASS_RE = /^[a-z][a-z0-9_]{1,23}$/;
/** The list / write replies name the class(es) `vehicle_classes` / `vehicle_class` (the catalog does); `classes` / `class` are tolerated. */
type ClassList = { vehicle_classes?: VehicleClass[]; classes?: VehicleClass[] };
type ClassOne = { vehicle_class?: VehicleClass; class?: VehicleClass };
const listOf = (d: ClassList) => d.vehicle_classes ?? d.classes ?? [];
const oneOf = (d: ClassOne) => (d.vehicle_class ?? d.class) as VehicleClass;

/** Classes with rider counts; archived ones too, so the manager can show them. */
export async function loadVehicleClasses(includeArchived = true): Promise<ActionResult<VehicleClass[]>> {
  const res = await blinkApi<ClassList>(`/pricing/admin/vehicle-classes?include_archived=${includeArchived}`, { roles: PRICING_READ_ROLES });
  if (!res.ok) return fail(res);
  return { ok: true, data: listOf(res.data) };
}

export async function createVehicleClass(input: VehicleClassInput): Promise<ActionResult<VehicleClass>> {
  const res = await blinkApi<ClassOne>("/pricing/admin/vehicle-classes", { method: "POST", body: input, roles: PRICING_WRITE_ROLES });
  if (!res.ok) return fail(res);
  done();
  return { ok: true, data: oneOf(res.data) };
}

export async function updateVehicleClass(code: string, patch: VehicleClassPatch): Promise<ActionResult<VehicleClass>> {
  if (!CLASS_RE.test(code)) return { ok: false, error: await blinkApiErrorMessage(NS, { status: 400, error: "Bad code" }) };
  const res = await blinkApi<ClassOne>(`/pricing/admin/vehicle-classes/${code}`, { method: "PATCH", body: patch, roles: PRICING_WRITE_ROLES });
  if (!res.ok) return fail(res);
  done();
  return { ok: true, data: oneOf(res.data) };
}

/** Archive a class. Fails with `class_in_use` while riders, live overrides or open orders use it. */
export async function archiveVehicleClass(code: string): Promise<ActionResult<VehicleClass>> {
  if (!CLASS_RE.test(code)) return { ok: false, error: await blinkApiErrorMessage(NS, { status: 400, error: "Bad code" }) };
  const res = await blinkApi<ClassOne>(`/pricing/admin/vehicle-classes/${code}`, { method: "DELETE", roles: PRICING_WRITE_ROLES });
  if (!res.ok) return fail(res);
  done();
  return { ok: true, data: oneOf(res.data) };
}

/** A rider's assigned class (null = the default class of their base vehicle). */
export async function getRiderVehicleClass(userId: string): Promise<ActionResult<RiderClassState>> {
  if (!ID_RE.test(userId)) return { ok: false, error: await blinkApiErrorMessage(NS, { status: 400, error: "Bad id" }) };
  const res = await blinkApi<RiderClassState>(`/pricing/admin/riders/${userId}/vehicle-class`, { roles: PRICING_READ_ROLES });
  if (!res.ok) return fail(res);
  return { ok: true, data: res.data };
}

/** Assign a class (or `null` for the default). 400 `class` when its base vehicle differs from the rider's. */
export async function setRiderVehicleClass(userId: string, vehicleClass: string | null): Promise<ActionResult<RiderClassState>> {
  if (!ID_RE.test(userId)) return { ok: false, error: await blinkApiErrorMessage(NS, { status: 400, error: "Bad id" }) };
  if (vehicleClass !== null && !CLASS_RE.test(vehicleClass)) return { ok: false, error: await blinkApiErrorMessage(NS, { status: 400, error: "Bad code" }) };
  const res = await blinkApi<RiderClassState>(`/pricing/admin/riders/${userId}/vehicle-class`, {
    method: "PUT",
    body: { vehicle_class: vehicleClass },
    roles: PRICING_WRITE_ROLES,
  });
  if (!res.ok) return fail(res);
  revalidatePath(`/d/riders/${userId}`);
  revalidatePath("/d/pricing/vehicles");
  return { ok: true, data: res.data };
}
