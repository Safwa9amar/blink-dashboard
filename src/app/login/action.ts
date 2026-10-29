"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createAnonAuthClient } from "@/lib/supabase/anon";
import { isStaffRole } from "@/lib/auth/access";
import { requestOrigin } from "@/lib/auth/origin";
import { logAccessEvent } from "@/features/access/audit";
import { validateNewPassword } from "@/features/access/password";
import { mapAuthError, type AuthErrorKey } from "./errors";

type Result = { ok: true } | { ok: false; error: AuthErrorKey };

const LOCALES = ["en", "fr", "ar"];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RESET_WINDOW_S = 15 * 60;

function cleanLocale(locale: string): string {
  return LOCALES.includes(locale) ? locale : "en";
}

// Whether a staff account (users row with a valid staff_role) exists for this email.
async function isStaffEmail(email: string): Promise<boolean> {
  const admin = await createAdminClient();
  const escaped = email.replace(/[\\%_]/g, (c) => `\\${c}`);
  const { data } = await admin.from("users").select("staff_role").ilike("email", escaped).limit(5);
  return (data ?? []).some((r: { staff_role?: unknown }) => isStaffRole(r.staff_role));
}

/**
 * Emails a 6-digit sign-in code (+ magic link). Non-staff / unknown emails get the same
 * `{ ok: true }` without anything being sent, so accounts can't be enumerated.
 */
export async function requestSignInCode(email: string, locale: string): Promise<Result> {
  const clean = email.trim().toLowerCase();
  if (!EMAIL_RE.test(clean)) return { ok: true };
  if (!(await isStaffEmail(clean))) return { ok: true };

  const { error } = await createAnonAuthClient().auth.signInWithOtp({
    email: clean,
    options: {
      shouldCreateUser: false,
      emailRedirectTo: `${await requestOrigin()}/auth/confirm?next=/&lang=${cleanLocale(locale)}`,
    },
  });
  // Same answer as for unknown emails: a rate-limit / banned error only ever happens for a
  // real staff account, so surfacing it would tell an attacker which emails are staff.
  if (error) console.error("[auth] sign-in code not sent:", error.code ?? error.message);
  return { ok: true };
}

/** Emails a password-reset link + code to staff accounts; generic success otherwise. */
export async function requestPasswordReset(email: string, locale: string): Promise<Result> {
  const clean = email.trim().toLowerCase();
  if (!EMAIL_RE.test(clean)) return { ok: true };
  if (!(await isStaffEmail(clean))) return { ok: true };

  const { error } = await createAnonAuthClient().auth.resetPasswordForEmail(clean, {
    redirectTo: `${await requestOrigin()}/auth/confirm?next=/login/reset&lang=${cleanLocale(locale)}`,
  });
  if (error) console.error("[auth] reset email not sent:", error.code ?? error.message);
  return { ok: true };
}

/**
 * Shared post-sign-in gate: the signed-in account must be dashboard staff. Reads the
 * user's own `staff_role` directly (not getCurrentStaff, which also demands MFA and would
 * reject a fresh aal1 session here). Non-staff are signed out.
 */
export async function checkDashboardAccess(): Promise<Result> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "session_expired" };

  const { data, error } = await supabase.from("users").select("staff_role").eq("id", user.id).single();
  // 42703 = staff_role column missing (migration not applied): same leniency as getCurrentStaff.
  const staff = error ? error.code === "42703" : isStaffRole((data as { staff_role?: unknown } | null)?.staff_role);
  if (!staff) {
    await supabase.auth.signOut();
    return { ok: false, error: "no_access" };
  }
  return { ok: true };
}

type Amr = { method?: string; timestamp?: number };

// True when this session came from a password-recovery verification (emailed link or code)
// in the last 15 min. Email-code sign-ins ("otp") don't count: they aren't a reset.
async function hasFreshRecovery(supabase: Awaited<ReturnType<typeof createClient>>): Promise<boolean> {
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims) return false;
  const now = Math.floor(Date.now() / 1000);
  const amr = (claims.amr ?? []) as Array<Amr | string>;
  const detailed = amr.filter((e): e is Amr => typeof e === "object" && e !== null);
  if (detailed.length > 0) {
    return detailed.some(
      (e) => e.method === "recovery" && typeof e.timestamp === "number" && e.timestamp >= now - RESET_WINDOW_S,
    );
  }
  // RFC-8176 string form carries no timestamps: fall back to the token's issue time.
  const hasMethod = amr.some((m) => m === "recovery");
  return hasMethod && typeof claims.iat === "number" && claims.iat >= now - RESET_WINDOW_S;
}

/** Sets a new password for the recovery session, clears the temp-password flag, ends other sessions. */
export async function completePasswordReset(newPassword: string): Promise<Result> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "link_expired" };
  if (!(await hasFreshRecovery(supabase))) return { ok: false, error: "reset_expired" };
  const { data: row } = await supabase.from("users").select("staff_role").eq("id", user.id).single();
  if (!isStaffRole((row as { staff_role?: unknown } | null)?.staff_role)) return { ok: false, error: "no_access" };

  const weak = validateNewPassword(newPassword);
  if (weak) return { ok: false, error: weak };

  const admin = await createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(user.id, {
    password: newPassword,
    app_metadata: { ...user.app_metadata, must_change_password: false },
  });
  if (error) return { ok: false, error: mapAuthError(error) ?? "generic" };

  await logAccessEvent(admin, { actorId: user.id, targetId: user.id, action: "password_recovered" });
  await supabase.auth.signOut({ scope: "others" });
  return { ok: true };
}
