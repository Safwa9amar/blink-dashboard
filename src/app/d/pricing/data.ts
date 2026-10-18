import { cache } from "react";
import { requirePathAccess } from "@/lib/auth/staff";
import { blinkApi } from "@/lib/blink-api";
import { blinkApiErrorMessage } from "@/lib/blink-api-errors";
import type { Change, Fee, Override, OverrideFilters } from "@/features/pricing";
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

export const getCatalog = cache(async (): Promise<Loaded<Fee[]>> => {
  await requirePathAccess(SECTION);
  const res = await blinkApi<{ fees: Fee[] }>("/pricing/admin/catalog", { roles: PRICING_READ_ROLES });
  if (!res.ok) return { data: [], error: await blinkApiErrorMessage(NS, res) };
  return { data: res.data.fees };
});

export async function getOverrides(filters: OverrideFilters): Promise<Loaded<Override[]>> {
  await requirePathAccess(SECTION);
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(filters)) if (v) qs.set(k, v);
  const res = await blinkApi<{ overrides: Override[] }>(`/pricing/admin/overrides?${qs}`, { roles: PRICING_READ_ROLES });
  if (!res.ok) return { data: [], error: await blinkApiErrorMessage(NS, res) };
  return { data: res.data.overrides };
}

export async function getHistory(key?: string): Promise<Loaded<Change[]>> {
  await requirePathAccess(SECTION);
  const qs = new URLSearchParams({ limit: "100" });
  if (key) qs.set("key", key);
  const res = await blinkApi<{ changes: Change[] }>(`/pricing/admin/history?${qs}`, { roles: PRICING_READ_ROLES });
  if (!res.ok) return { data: [], error: await blinkApiErrorMessage(NS, res) };
  return { data: res.data.changes };
}
