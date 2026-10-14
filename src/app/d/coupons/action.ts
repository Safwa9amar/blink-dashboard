"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStaffActor } from "@/lib/auth/staff";
import { categoryToArt, customerSearchFilters, validateIssue, type CustomerHit, type IssueValues } from "@/features/coupons";

// Coupon writes: service-role client, gated by `canAccessPath(role, "/coupons")`.
// Error strings are i18n keys under `coupons.errors.*`; raw DB messages pass through.

const PATH = "/coupons";
const NOT_AUTHORIZED = "not_authorized";
type Result<T = object> = ({ error: null } & T) | { error: string };

const refresh = () => {
  revalidatePath("/d/coupons");
  revalidatePath("/d/promotions");
};

export async function extendCoupon(id: string, expiresAtIso: string, note: string): Promise<Result> {
  const actor = await getStaffActor(PATH);
  if (!actor) return { error: NOT_AUTHORIZED };
  const when = new Date(expiresAtIso);
  if (Number.isNaN(when.getTime()) || when.getTime() <= Date.now()) return { error: "expiry_future" };
  const supabase = await createAdminClient();
  const { data: row } = await supabase.from("customer_coupons").select("used_at, revoked_at").eq("id", id).maybeSingle();
  const c = row as { used_at: string | null; revoked_at: string | null } | null;
  if (!c) return { error: "not_found" };
  if (c.used_at) return { error: "already_used" };
  if (c.revoked_at) return { error: "is_revoked" };
  const { error } = await supabase
    .from("customer_coupons")
    .update({ expires_at: when.toISOString(), note: note.trim() || null, issued_by: actor.id })
    .eq("id", id);
  if (error) return { error: error.message };
  refresh();
  return { error: null };
}

export async function revokeCoupon(id: string, note: string): Promise<Result> {
  const actor = await getStaffActor(PATH);
  if (!actor) return { error: NOT_AUTHORIZED };
  if (!note.trim()) return { error: "note_required" };
  const supabase = await createAdminClient();
  const { error } = await supabase
    .from("customer_coupons")
    .update({ revoked_at: new Date().toISOString(), note: note.trim(), issued_by: actor.id })
    .eq("id", id)
    .is("used_at", null);
  if (error) return { error: error.message };
  refresh();
  return { error: null };
}

export async function restoreCoupon(id: string): Promise<Result> {
  const actor = await getStaffActor(PATH);
  if (!actor) return { error: NOT_AUTHORIZED };
  const supabase = await createAdminClient();
  const { error } = await supabase.from("customer_coupons").update({ revoked_at: null, issued_by: actor.id }).eq("id", id);
  if (error) return { error: error.message };
  refresh();
  return { error: null };
}

// Customer search for the issue flow: name or phone. Every app user can hold coupons
// (`users.role` is the active persona), so only console staff are excluded.
export async function searchCustomers(query: string): Promise<CustomerHit[]> {
  if (!(await getStaffActor(PATH))) return [];
  if (query.trim().length < 2) return [];
  const filters = customerSearchFilters(query);
  if (!filters.length) return [];
  const supabase = await createAdminClient();
  let req = supabase.from("users").select("id, first_name, last_name, phone_number").is("staff_role", null);
  for (const f of filters) req = req.or(f);
  const { data } = await req.limit(8);
  return ((data ?? []) as { id: string; first_name: string | null; last_name: string | null; phone_number: string | null }[]).map((u) => ({
    id: u.id,
    name: [u.first_name, u.last_name].filter(Boolean).join(" "),
    phone: u.phone_number ?? "",
  }));
}

export async function issueCoupon(
  values: IssueValues
): Promise<Result<{ id: string }> | { error: string; fieldErrors: Record<string, string> }> {
  const actor = await getStaffActor(PATH);
  if (!actor) return { error: NOT_AUTHORIZED };
  const fieldErrors = validateIssue(values);
  if (Object.keys(fieldErrors).length) return { error: "validation", fieldErrors: fieldErrors as Record<string, string> };

  const supabase = await createAdminClient();
  const code = values.code.trim().toUpperCase();
  const base = { user_id: values.userId, code, source: "staff", issued_by: actor.id, note: values.note.trim() || null };

  let payload: Record<string, unknown>;
  if (values.mode === "promotion") {
    const { data: p } = await supabase.from("promotions").select("*").eq("id", values.promotionId).maybeSingle();
    const promo = p as Record<string, unknown> | null;
    if (!promo) return { error: "promotion_not_found" };
    // Unique (user_id, promotion_id): refuse with a clear message before the insert.
    const { data: existing } = await supabase
      .from("customer_coupons")
      .select("id")
      .eq("user_id", values.userId)
      .eq("promotion_id", values.promotionId)
      .limit(1);
    if ((existing ?? []).length > 0) return { error: "already_has_coupon" };

    const byValidity = Date.now() + Number(promo.valid_days ?? 30) * 86_400_000;
    const endsAt = promo.ends_at ? new Date(String(promo.ends_at)).getTime() : Infinity;
    const expires = new Date(Math.min(byValidity, endsAt));
    payload = {
      ...base,
      promotion_id: values.promotionId,
      type: categoryToArt(String(promo.category)),
      title: promo.title,
      description: promo.subtitle ?? "",
      discount_type: promo.discount_type,
      discount_value: promo.discount_value,
      min_order: promo.min_order,
      max_discount: promo.max_discount,
      image_url: promo.image_url || null,
      expires_at: expires.toISOString(),
    };
  } else {
    payload = {
      ...base,
      promotion_id: null,
      type: values.art,
      title: values.title.trim(),
      description: "",
      discount_type: values.discount_type,
      discount_value: values.discount_type === "free_delivery" ? 0 : Number(values.discount_value),
      min_order: values.min_order.trim() === "" ? 0 : Number(values.min_order),
      max_discount: values.discount_type === "percent" && values.max_discount.trim() !== "" ? Number(values.max_discount) : null,
      expires_at: new Date(values.expires_at).toISOString(),
    };
  }

  const { data, error } = await supabase.from("customer_coupons").insert(payload).select("id").single();
  if (error || !data) {
    if (error?.code === "23505") {
      return { error: error.message.includes("user_promotion") ? "already_has_coupon" : "code_taken" };
    }
    return { error: error?.message ?? "save_failed" };
  }
  refresh();
  return { error: null, id: (data as { id: string }).id };
}
