"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStaffActor } from "@/lib/auth/staff";
import { formToWrite, validatePromotionForm, type PromotionFormValues } from "@/features/promotions";

// Promotions writes: service-role client, gated by `canAccessPath(role, "/promotions")`
// (getStaffActor). Error strings are i18n keys under `promotions.errors.*` /
// `promotions.form.errors.*` where the client translates them; raw DB messages pass through.

const PATH = "/promotions";

type Result<T = object> = ({ error: null } & T) | { error: string };

const NOT_AUTHORIZED = "not_authorized";

function refresh(id?: string) {
  revalidatePath("/d/promotions");
  revalidatePath("/d/promotions/analytics");
  if (id) revalidatePath(`/d/promotions/${id}`);
}

// A code must be unique among non-archived promotions.
async function codeTaken(code: string, exceptId?: string): Promise<boolean> {
  const supabase = await createAdminClient();
  let q = supabase.from("promotions").select("id").ilike("code", code).is("archived_at", null).limit(1);
  if (exceptId) q = q.neq("id", exceptId);
  const { data } = await q;
  return (data ?? []).length > 0;
}

export async function savePromotion(
  id: string | null,
  values: PromotionFormValues
): Promise<Result<{ id: string }> | { error: string; fieldErrors: Record<string, string> }> {
  const actor = await getStaffActor(PATH);
  if (!actor) return { error: NOT_AUTHORIZED };

  const fieldErrors = validatePromotionForm(values);
  if (Object.keys(fieldErrors).length) return { error: "validation", fieldErrors: fieldErrors as Record<string, string> };

  const write = formToWrite(values);
  if (write.code && (await codeTaken(write.code, id ?? undefined))) {
    return { error: "validation", fieldErrors: { code: "code_taken" } };
  }

  const supabase = await createAdminClient();
  if (id) {
    const { error } = await supabase.from("promotions").update({ ...write, updated_at: new Date().toISOString() }).eq("id", id);
    if (error) return { error: error.message };
    refresh(id);
    return { error: null, id };
  }
  const { data, error } = await supabase
    .from("promotions")
    .insert({ ...write, created_by: actor.id })
    .select("id")
    .single();
  if (error || !data) return { error: error?.message ?? "save_failed" };
  refresh();
  return { error: null, id: (data as { id: string }).id };
}

export async function setPromotionActive(id: string, isActive: boolean): Promise<Result> {
  if (!(await getStaffActor(PATH))) return { error: NOT_AUTHORIZED };
  const supabase = await createAdminClient();
  const { error } = await supabase.from("promotions").update({ is_active: isActive }).eq("id", id);
  if (error) return { error: error.message };
  refresh(id);
  return { error: null };
}

export async function setPromotionArchived(id: string, archived: boolean): Promise<Result> {
  if (!(await getStaffActor(PATH))) return { error: NOT_AUTHORIZED };
  const supabase = await createAdminClient();
  if (!archived) {
    // Un-archiving must not collide with the code of another live promotion.
    const { data: row } = await supabase.from("promotions").select("code").eq("id", id).maybeSingle();
    const code = (row as { code: string | null } | null)?.code;
    if (code && (await codeTaken(code, id))) return { error: "code_taken" };
  }
  const { error } = await supabase
    .from("promotions")
    .update({ archived_at: archived ? new Date().toISOString() : null })
    .eq("id", id);
  if (error) return { error: error.message };
  refresh(id);
  return { error: null };
}

// Copy as paused, title + " (copy)", code cleared (codes are unique among live promotions).
export async function duplicatePromotion(id: string, copySuffix: string): Promise<Result<{ id: string }>> {
  const actor = await getStaffActor(PATH);
  if (!actor) return { error: NOT_AUTHORIZED };
  const supabase = await createAdminClient();
  const { data: src, error: readErr } = await supabase.from("promotions").select("*").eq("id", id).maybeSingle();
  if (readErr || !src) return { error: readErr?.message ?? "not_found" };
  const {
    id: _id,
    created_at: _c,
    updated_at: _u,
    archived_at: _a,
    created_by: _b,
    ...rest
  } = src as Record<string, unknown>;
  void [_id, _c, _u, _a, _b];
  const { data, error } = await supabase
    .from("promotions")
    .insert({ ...rest, title: `${String(rest.title)} ${copySuffix}`, code: null, is_active: false, created_by: actor.id })
    .select("id")
    .single();
  if (error || !data) return { error: error?.message ?? "save_failed" };
  refresh();
  return { error: null, id: (data as { id: string }).id };
}

// Only when no coupon was ever issued; otherwise the staff member is told to archive.
export async function deletePromotion(id: string): Promise<Result> {
  if (!(await getStaffActor(PATH))) return { error: NOT_AUTHORIZED };
  const supabase = await createAdminClient();
  const { count, error: cErr } = await supabase
    .from("customer_coupons")
    .select("id", { count: "exact", head: true })
    .eq("promotion_id", id);
  if (cErr) return { error: cErr.message };
  if ((count ?? 0) > 0) return { error: "has_coupons" };
  const { error } = await supabase.from("promotions").delete().eq("id", id);
  if (error) return { error: error.message };
  refresh();
  return { error: null };
}

// One-time signed upload URL for the public `news` bucket (same approach as News covers);
// the browser uploads straight to Storage so the bytes never pass through this action.
export async function createPromotionUploadUrl(
  ext: string
): Promise<{ path: string | null; token: string | null; error: string | null }> {
  if (!(await getStaffActor(PATH))) return { path: null, token: null, error: NOT_AUTHORIZED };
  const safeExt = (ext || "bin").toLowerCase().replace(/[^a-z0-9]/g, "") || "bin";
  const path = `promotions/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${safeExt}`;
  const supabase = await createAdminClient();
  const { data, error } = await supabase.storage.from("news").createSignedUploadUrl(path);
  if (error || !data) return { path: null, token: null, error: error?.message ?? "upload_failed" };
  return { path: data.path, token: data.token, error: null };
}
