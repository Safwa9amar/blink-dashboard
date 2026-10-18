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
} from "@/features/pricing";
import { PRICING_KEYS } from "@/features/pricing";

// Staff pricing goes through blink-server (`/pricing/admin/*`): it validates the value
// against the fee's schema, writes the audit row and notifies targeted partners.
import { PRICING_READ_ROLES, PRICING_WRITE_ROLES } from "./roles";
const NS = "pricing";
const ID_RE = /^[0-9a-f-]{36}$/i;

async function fail(res: Extract<BlinkApiResult<unknown>, { ok: false }>): Promise<{ ok: false; error: string; stale?: boolean; conflictId?: string; status?: number }> {
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
  return { ok: false, error: await blinkApiErrorMessage(NS, res), status: res.status };
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

/** The fee catalog — lazily fetched by the override modal when opened outside /pricing. */
export async function loadCatalog(): Promise<ActionResult<Fee[]>> {
  const res = await blinkApi<{ fees: Fee[] }>("/pricing/admin/catalog", { roles: PRICING_READ_ROLES });
  if (!res.ok) return fail(res);
  return { ok: true, data: res.data.fees };
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
