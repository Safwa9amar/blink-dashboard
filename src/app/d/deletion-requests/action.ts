"use server";

import { createAdminClient, hasServiceRole } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { hasStaffRole } from "@/lib/auth/staff";
import { revalidatePath } from "next/cache";

// Account deletion requests are filed from the app (POST /auth/account/deletion-request
// in blink-server) and processed here. "Complete" never hard-deletes the `users` row:
// orders, trips and transactions reference it (NO ACTION) and dues payments cascade
// from it, so the row stays as an anonymous shell and everything personal is wiped.
// The request itself is the deletion history: it keeps a snapshot of who the account
// belonged to and which staff member processed it.

// Buckets that file uploads under `<userId>/…`. The merchant bucket is left alone —
// it holds store/product images that order history still shows.
const PERSONAL_BUCKETS = ["avatars", "agent"] as const;

type AdminClient = Awaited<ReturnType<typeof createAdminClient>>;

/** The signed-in staff member (the admin client carries no session). */
async function currentStaffId(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

/** Every object under `prefix`, walking sub-folders (folders come back with no id). */
async function listFiles(supabase: AdminClient, bucket: string, prefix: string): Promise<string[]> {
  const { data, error } = await supabase.storage.from(bucket).list(prefix, { limit: 1000 });
  if (error) throw new Error(error.message);
  const files: string[] = [];
  for (const entry of data ?? []) {
    const path = `${prefix}/${entry.name}`;
    if (entry.id) files.push(path);
    else files.push(...(await listFiles(supabase, bucket, path)));
  }
  return files;
}

// Each step is idempotent, and the request is marked completed only at the end, so a
// failed run can simply be retried.
export async function completeDeletionRequest(requestId: string) {
  // Irreversible — reserved for super_admin, like the other delete actions.
  if (!(await hasStaffRole("super_admin"))) {
    return { error: "Not authorized" };
  }
  // Deleting the auth user needs the service role; the RLS fallback client can't.
  if (!hasServiceRole()) {
    return { error: "SUPABASE_SERVICE_ROLE_KEY is not configured" };
  }

  const supabase = await createAdminClient();

  const { data: request, error: readError } = await supabase
    .from("account_deletion_requests")
    .select("id, user_id, status, user_snapshot")
    .eq("id", requestId)
    .maybeSingle();
  if (readError) return { error: readError.message };
  if (!request) return { error: "Request not found" };
  if (request.status !== "pending") return { error: "Request is no longer pending" };
  const userId = request.user_id as string;

  // 0. Remember who this was before anything is wiped. Skipped on a retry, so a
  //    half-finished earlier run can't overwrite it with the blanked-out row.
  if (!request.user_snapshot) {
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("first_name, last_name, phone_number, email")
      .eq("id", userId)
      .maybeSingle();
    if (userError) return { error: userError.message };
    const snapshot = {
      name: [user?.first_name, user?.last_name].filter(Boolean).join(" ") || null,
      phone_number: user?.phone_number ?? null,
      email: user?.email ?? null,
    };
    const { error: snapError } = await supabase
      .from("account_deletion_requests")
      .update({ user_snapshot: snapshot })
      .eq("id", requestId);
    if (snapError) return { error: snapError.message };
  }

  // 1. The login goes first: sessions die and the phone/email can sign up afresh.
  //    404 = an earlier attempt already removed it.
  const { error: authError } = await supabase.auth.admin.deleteUser(userId);
  if (authError && authError.status !== 404) return { error: authError.message };

  // 2. Personal data off every table that keeps it; the rows linked to history stay.
  const writes = await Promise.all([
    supabase
      .from("users")
      .update({
        phone_number: null,
        first_name: null,
        last_name: null,
        middle_name: null,
        email: null,
        gender: null,
        birthday: null,
        profile_picture: null,
        address: null,
        wilaya: null,
        wilaya_code: null,
        bank_rib: null,
        pin_hash: null,
      })
      .eq("id", userId),
    supabase.from("agent_profiles").update({ documents: {} }).eq("user_id", userId),
    supabase
      .from("rider_profiles")
      .update({
        is_available: false,
        latitude: null,
        longitude: null,
        location_updated_at: null,
      })
      .eq("user_id", userId),
    supabase
      .from("vehicles")
      .update({
        license_plate: null,
        gray_card_url: null,
        gray_card_status: "not_uploaded",
        insurance_url: null,
        insurance_status: "not_uploaded",
        driving_license_url: null,
        driving_license_status: "not_uploaded",
      })
      .eq("user_id", userId),
    supabase.from("stores").update({ documents: {} }).eq("owner_id", userId),
    // No live or approvable store left behind an anonymised account (filing only
    // hid the live ones). review_note stays: blink-server's owner_leaving check
    // already blocks approving / resubmitting them.
    supabase
      .from("stores")
      .update({ status: "inactive", is_open: false })
      .eq("owner_id", userId)
      .in("status", ["active", "under_review"]),
    supabase.from("addresses").delete().eq("user_id", userId),
    supabase.from("device_tokens").delete().eq("user_id", userId),
    supabase.from("customer_favorites").delete().eq("user_id", userId),
  ]);
  const failed = writes.find((w) => w.error);
  if (failed?.error) return { error: failed.error.message };

  // 3. Uploaded files (avatar, agent documents).
  try {
    for (const bucket of PERSONAL_BUCKETS) {
      const files = await listFiles(supabase, bucket, userId);
      if (files.length === 0) continue;
      const { error } = await supabase.storage.from(bucket).remove(files);
      if (error) throw new Error(error.message);
    }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not remove the user's files" };
  }

  // 4. Done.
  const { error: doneError } = await supabase
    .from("account_deletion_requests")
    .update({
      status: "completed",
      processed_at: new Date().toISOString(),
      processed_by: await currentStaffId(),
    })
    .eq("id", requestId)
    .eq("status", "pending");
  if (doneError) return { error: doneError.message };

  revalidatePath("/d/deletion-requests", "layout");
  return { error: null };
}

// The user keeps their account. Filing the request hid a merchant's live stores
// (active → inactive, no review note), so those come back; agents reopen their own
// shop and riders go back online from the app. Staff store review also sets stores
// `inactive` — always with a review_note (rejected / deactivated) — and those stay
// down: only note-less inactive stores are reactivated.
export async function cancelDeletionRequest(requestId: string) {
  if (!(await hasStaffRole("super_admin", "ops_admin", "hr_admin", "support_admin"))) {
    return { error: "Not authorized" };
  }

  const supabase = await createAdminClient();

  const { data: request, error } = await supabase
    .from("account_deletion_requests")
    .update({
      status: "cancelled",
      processed_at: new Date().toISOString(),
      processed_by: await currentStaffId(),
    })
    .eq("id", requestId)
    .eq("status", "pending")
    .select("user_id, role")
    .maybeSingle();
  if (error) return { error: error.message };
  if (!request) return { error: "Request is no longer pending" };

  if (request.role === "merchant") {
    const { error: storesError } = await supabase
      .from("stores")
      .update({ status: "active" })
      .eq("owner_id", request.user_id)
      .eq("status", "inactive")
      .is("review_note", null);
    if (storesError) return { error: storesError.message };
  }

  revalidatePath("/d/deletion-requests", "layout");
  return { error: null };
}
