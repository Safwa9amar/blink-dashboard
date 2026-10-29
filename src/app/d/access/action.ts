"use server";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { sendAuthEmail, toAuthLang } from "@/lib/auth/auth-email";
import { getStaffActor } from "@/lib/auth/staff";
import { isStaffRole, type StaffRole } from "@/lib/auth/access";
import { logAccessEvent } from "@/features/access/audit";
import { generateTempPassword, validateNewPassword } from "@/features/access/password";
import type { CandidateHit } from "@/features/access/types";

// Every admin action is gated on super_admin first and writes with the service-role
// client (RLS no longer lets authenticated users touch privileged `users` columns).
// `error` is an i18n key under `access.errors.*` or a raw DB message.

const PATHS = ["/d/access", "/d/access/activity", "/d/access/roles"];
const refresh = () => PATHS.forEach((p) => revalidatePath(p));

type Admin = Awaited<ReturnType<typeof createAdminClient>>;

async function requireSuperAdmin() {
  const actor = await getStaffActor("/access");
  return actor && actor.role === "super_admin" ? actor : null;
}

// Number of super_admins that can still sign in, excluding `excludeId`.
async function activeSuperAdmins(supabase: Admin, excludeId: string): Promise<number> {
  const { data } = await supabase.from("users").select("id").eq("staff_role", "super_admin").neq("id", excludeId);
  const ids = ((data ?? []) as { id: string }[]).map((r) => r.id);
  const flags = await Promise.all(
    ids.map(async (id) => {
      const { data: res } = await supabase.auth.admin.getUserById(id);
      const until = (res?.user as { banned_until?: string | null } | undefined)?.banned_until;
      return !(until && new Date(until).getTime() > Date.now());
    }),
  );
  return flags.filter(Boolean).length;
}

async function getTarget(supabase: Admin, userId: string) {
  const { data } = await supabase.from("users").select("id, email, staff_role").eq("id", userId).maybeSingle();
  const row = data as { id: string; email: string | null; staff_role: string | null } | null;
  if (!row) return null;
  return { id: row.id, email: row.email, staffRole: isStaffRole(row.staff_role) ? row.staff_role : null };
}

export async function createStaffAccount(input: {
  firstName: string;
  lastName?: string;
  email: string;
  phone?: string;
  staffRole: StaffRole;
}): Promise<{ error: string | null; tempPassword?: string }> {
  const actor = await requireSuperAdmin();
  if (!actor) return { error: "not_authorized" };
  const firstName = input.firstName?.trim();
  const email = input.email?.trim().toLowerCase();
  if (!firstName || !email || !/^\S+@\S+\.\S+$/.test(email)) return { error: "invalid_input" };
  if (!isStaffRole(input.staffRole)) return { error: "invalid_role" };

  const supabase = await createAdminClient();
  const tempPassword = generateTempPassword();
  const { data: created, error: createError } = await supabase.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
    app_metadata: { must_change_password: true },
  });
  if (createError || !created?.user) {
    const msg = createError?.message ?? "";
    if (createError && /already|registered|exists/i.test(msg)) {
      return { error: "email_exists" };
    }
    return { error: msg || "invalid_input" };
  }
  const id = created.user.id;

  const { error: insertError } = await supabase.from("users").insert({
    id,
    email,
    first_name: firstName,
    last_name: input.lastName?.trim() || null,
    phone_number: input.phone?.trim() || null,
    staff_role: input.staffRole,
  });
  if (insertError) {
    await supabase.auth.admin.deleteUser(id);
    return { error: insertError.message };
  }

  await logAccessEvent(supabase, { actorId: actor.id, targetId: id, action: "created", toRole: input.staffRole });
  refresh();
  return { error: null, tempPassword };
}

export async function grantStaffAccess(userId: string, staffRole: StaffRole): Promise<{ error: string | null }> {
  const actor = await requireSuperAdmin();
  if (!actor) return { error: "not_authorized" };
  if (!isStaffRole(staffRole)) return { error: "invalid_role" };

  const supabase = await createAdminClient();
  const target = await getTarget(supabase, userId);
  if (!target) return { error: "not_found" };
  if (target.staffRole) return { error: "already_staff" };

  const { error } = await supabase.from("users").update({ staff_role: staffRole }).eq("id", userId);
  if (error) return { error: error.message };

  await logAccessEvent(supabase, { actorId: actor.id, targetId: userId, action: "granted", toRole: staffRole });
  refresh();
  return { error: null };
}

export async function searchGrantCandidates(query: string): Promise<CandidateHit[]> {
  const actor = await requireSuperAdmin();
  if (!actor) return [];
  const terms = (query ?? "")
    .replace(/[%,()*\\]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 3);
  if (terms.length === 0) return [];

  const supabase = await createAdminClient();
  let q = supabase
    .from("users")
    .select("id, email, first_name, last_name, phone_number")
    .is("staff_role", null);
  for (const term of terms) {
    const parts = [`first_name.ilike.%${term}%`, `last_name.ilike.%${term}%`, `email.ilike.%${term}%`];
    const digits = term.replace(/\D/g, "");
    if (digits.length >= 3) {
      for (const p of new Set([digits, digits.replace(/^0+/, "")])) {
        if (p.length >= 3) parts.push(`phone_number.ilike.%${p}%`);
      }
    } else {
      parts.push(`phone_number.ilike.%${term}%`);
    }
    q = q.or(parts.join(","));
  }
  const { data, error } = await q.limit(8);
  if (error) {
    console.error("[access] searchGrantCandidates:", error.message);
    return [];
  }
  return ((data ?? []) as {
    id: string;
    email: string | null;
    first_name: string | null;
    last_name: string | null;
    phone_number: string | null;
  }[]).map((u) => ({
    id: u.id,
    name: [u.first_name, u.last_name].filter(Boolean).join(" ").trim() || (u.email ? u.email.split("@")[0] : ""),
    email: u.email ?? "",
    phone: u.phone_number,
  }));
}

export async function changeStaffRole(userId: string, staffRole: StaffRole): Promise<{ error: string | null }> {
  const actor = await requireSuperAdmin();
  if (!actor) return { error: "not_authorized" };
  if (!isStaffRole(staffRole)) return { error: "invalid_role" };
  if (actor.id === userId) return { error: "self_action" };

  const supabase = await createAdminClient();
  const target = await getTarget(supabase, userId);
  if (!target || !target.staffRole) return { error: "not_found" };
  if (target.staffRole === staffRole) return { error: null };
  if (target.staffRole === "super_admin" && (await activeSuperAdmins(supabase, userId)) === 0) {
    return { error: "last_super_admin" };
  }

  const { error } = await supabase.from("users").update({ staff_role: staffRole }).eq("id", userId);
  if (error) return { error: error.message };

  await logAccessEvent(supabase, {
    actorId: actor.id,
    targetId: userId,
    action: "role_changed",
    fromRole: target.staffRole,
    toRole: staffRole,
  });
  refresh();
  return { error: null };
}

export async function revokeStaffAccess(userId: string): Promise<{ error: string | null }> {
  const actor = await requireSuperAdmin();
  if (!actor) return { error: "not_authorized" };
  if (actor.id === userId) return { error: "self_action" };

  const supabase = await createAdminClient();
  const target = await getTarget(supabase, userId);
  if (!target || !target.staffRole) return { error: "not_found" };
  if (target.staffRole === "super_admin" && (await activeSuperAdmins(supabase, userId)) === 0) {
    return { error: "last_super_admin" };
  }

  const { error } = await supabase.from("users").update({ staff_role: null }).eq("id", userId);
  if (error) return { error: error.message };

  await logAccessEvent(supabase, { actorId: actor.id, targetId: userId, action: "revoked", fromRole: target.staffRole });
  refresh();
  return { error: null };
}

export async function suspendStaff(userId: string, suspend: boolean): Promise<{ error: string | null }> {
  const actor = await requireSuperAdmin();
  if (!actor) return { error: "not_authorized" };
  if (actor.id === userId) return { error: "self_action" };

  const supabase = await createAdminClient();
  const target = await getTarget(supabase, userId);
  if (!target || !target.staffRole) return { error: "not_found" };
  if (suspend && target.staffRole === "super_admin" && (await activeSuperAdmins(supabase, userId)) === 0) {
    return { error: "last_super_admin" };
  }

  const { error } = await supabase.auth.admin.updateUserById(userId, {
    ban_duration: suspend ? "876000h" : "none",
  });
  if (error) return { error: error.message };

  await logAccessEvent(supabase, {
    actorId: actor.id,
    targetId: userId,
    action: suspend ? "suspended" : "reinstated",
    fromRole: target.staffRole,
  });
  refresh();
  return { error: null };
}

export async function resetStaffPassword(userId: string): Promise<{ error: string | null; tempPassword?: string }> {
  const actor = await requireSuperAdmin();
  if (!actor) return { error: "not_authorized" };
  if (actor.id === userId) return { error: "self_action" };

  const supabase = await createAdminClient();
  const target = await getTarget(supabase, userId);
  if (!target || !target.staffRole) return { error: "not_found" };

  const { data: existing } = await supabase.auth.admin.getUserById(userId);
  if (!existing?.user) return { error: "not_found" };

  const tempPassword = generateTempPassword();
  const { error } = await supabase.auth.admin.updateUserById(userId, {
    password: tempPassword,
    app_metadata: { ...existing.user.app_metadata, must_change_password: true },
  });
  if (error) return { error: error.message };

  await logAccessEvent(supabase, { actorId: actor.id, targetId: userId, action: "password_reset" });
  refresh();
  return { error: null, tempPassword };
}

export async function resetStaffTwoFactor(userId: string): Promise<{ error: string | null }> {
  const actor = await requireSuperAdmin();
  if (!actor) return { error: "not_authorized" };

  const supabase = await createAdminClient();
  const target = await getTarget(supabase, userId);
  if (!target || !target.staffRole) return { error: "not_found" };

  const { data, error: listError } = await supabase.auth.admin.mfa.listFactors({ userId });
  if (listError || !data) return { error: "generic" };
  if (data.factors.length === 0) return { error: "nothing_to_reset" };
  for (const f of data.factors) {
    const { error } = await supabase.auth.admin.mfa.deleteFactor({ id: f.id, userId });
    if (error) return { error: "generic" };
  }

  await logAccessEvent(supabase, { actorId: actor.id, targetId: userId, action: "mfa_reset" });
  refresh();
  return { error: null };
}

export async function removeStaffPasskeys(userId: string): Promise<{ error: string | null }> {
  const actor = await requireSuperAdmin();
  if (!actor) return { error: "not_authorized" };

  const supabase = await createAdminClient();
  const target = await getTarget(supabase, userId);
  if (!target || !target.staffRole) return { error: "not_found" };

  let passkeys: { id: string }[];
  try {
    const { data, error } = await supabase.auth.admin.passkey.listPasskeys({ userId });
    if (error || !data) return { error: "generic" };
    passkeys = data;
  } catch {
    return { error: "generic" };
  }
  if (passkeys.length === 0) return { error: "nothing_to_reset" };
  try {
    for (const p of passkeys) {
      const { error } = await supabase.auth.admin.passkey.deletePasskey({ userId, passkeyId: p.id });
      if (error) return { error: "generic" };
    }
  } catch {
    return { error: "generic" };
  }

  await logAccessEvent(supabase, { actorId: actor.id, targetId: userId, action: "passkeys_reset" });
  refresh();
  return { error: null };
}

export async function sendStaffResetEmail(userId: string): Promise<{ error: string | null }> {
  const actor = await requireSuperAdmin();
  if (!actor) return { error: "not_authorized" };
  if (actor.id === userId) return { error: "self_action" };

  const supabase = await createAdminClient();
  const target = await getTarget(supabase, userId);
  if (!target || !target.staffRole || !target.email) return { error: "not_found" };

  const lang = toAuthLang(await getLocale());
  const sent = await sendAuthEmail({ userId, email: target.email, type: "recovery", lang });
  if (!sent.ok) return { error: sent.reason === "rate_limited" ? "email_rate_limited" : "email_failed" };

  await logAccessEvent(supabase, { actorId: actor.id, targetId: userId, action: "reset_email_sent" });
  refresh();
  return { error: null };
}

// Any signed-in user (a flagged account has no usable dashboard role yet, so no staff gate).
export async function changeOwnPassword(input: {
  currentPassword?: string;
  newPassword: string;
}): Promise<{ error: string | null }> {
  const ssr = await createClient();
  const {
    data: { user },
  } = await ssr.auth.getUser();
  if (!user || !user.email) return { error: "not_signed_in" };

  // Always verify the current password (the temporary one for a flagged account), so an
  // old session that outlived a reset can't set a new password on its own.
  if (!input.currentPassword) return { error: "wrong_password" };
  const verifier = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  const { error: signInError } = await verifier.auth.signInWithPassword({
    email: user.email,
    password: input.currentPassword,
  });
  if (signInError) return { error: "wrong_password" };

  const invalid = validateNewPassword(input.newPassword, input.currentPassword);
  if (invalid) return { error: invalid };

  const supabase = await createAdminClient();
  const { error } = await supabase.auth.admin.updateUserById(user.id, {
    password: input.newPassword,
    app_metadata: { ...user.app_metadata, must_change_password: false },
  });
  if (error) {
    return { error: /same|different/i.test(error.message) ? "same_password" : error.message };
  }

  await logAccessEvent(supabase, { actorId: user.id, targetId: user.id, action: "password_changed" });
  refresh();
  return { error: null };
}
