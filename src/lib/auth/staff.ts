// Server-side staff resolution + guards. Imported only by server entries (the `d`
// layout and `action.ts` mutations) — never by client components.

import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { canAccessPath, defaultPathFor, type StaffRole } from "./access";
import { assuranceLevels, decideGate, type StaffGate } from "./gate";

// Resolves the viewer's gate state: signed out, needs the second factor, not staff, or ok.
//
// TODO(blink-server migration): `users.staff_role` may not exist yet; Postgres 42703
// (undefined_column) is treated as "pre-migration" and lets any authenticated user through
// as `super_admin`. A real row with a null/invalid `staff_role` resolves to not_staff.
// MFA: a session that is aal1 while the user has a verified factor is never authorized.
// Cached: one auth lookup per request, shared by every guard.
export const getStaffGate = cache(async (): Promise<StaffGate> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: "signed_out" };

  // Never mfa.getAuthenticatorAssuranceLevel() here: without a token argument it reads the
  // factor list from the session cookie, which the browser can edit to skip the second step.
  // `user` is server-verified (getUser hits Auth), and getSession() returns the access token
  // getUser() just validated, so its `aal` claim can be trusted.
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const levels = assuranceLevels(user.factors, session?.access_token);
  if (levels.nextLevel === "aal2" && levels.currentLevel !== "aal2") {
    return decideGate({ userId: user.id, staffRole: null, ...levels });
  }

  const { data, error } = await supabase.from("users").select("staff_role").eq("id", user.id).single();
  return decideGate({
    userId: user.id,
    staffRole: (data as { staff_role?: unknown } | null)?.staff_role ?? null,
    preMigration: error?.code === "42703",
    lookupFailed: !!error && error.code !== "42703",
    ...levels,
  });
});

export async function getCurrentStaffRole(): Promise<StaffRole | null> {
  return (await getCurrentStaff())?.role ?? null;
}

// The current viewer's user id + dashboard role, or null if they aren't (fully) authorized staff.
export async function getCurrentStaff(): Promise<{ id: string; role: StaffRole } | null> {
  const gate = await getStaffGate();
  return gate.status === "ok" ? { id: gate.id, role: gate.role } : null;
}

// Mutation guard for server actions (which have no pathname to gate on). Returns true
// only when the current viewer's staff role is in `allowed`.
export async function hasStaffRole(...allowed: StaffRole[]): Promise<boolean> {
  const role = await getCurrentStaffRole();
  return role !== null && allowed.includes(role);
}

/** Maps a non-ok gate to its redirect (never returns). */
export function redirectForGate(gate: Exclude<StaffGate, { status: "ok" }>): never {
  if (gate.status === "signed_out") redirect("/login");
  if (gate.status === "mfa_required") redirect("/login/mfa");
  redirect("/auth/signout?reason=no_access");
}

/**
 * Server gate for one dashboard section (`path` = its nav href, e.g. "/merchant-pricing").
 * Redirects signed-out → /login, MFA pending → /login/mfa, non-staff → sign-out, a role
 * that can't reach the section → their landing page; returns the role otherwise. Call it in
 * the page / data loader that reads the rows, not only in a layout.
 */
export async function requirePathAccess(path: string): Promise<StaffRole> {
  const gate = await getStaffGate();
  if (gate.status !== "ok") redirectForGate(gate);
  if (!canAccessPath(gate.role, path)) redirect(defaultPathFor(gate.role));
  return gate.role;
}

/**
 * Server-action guard for one dashboard section: returns the signed-in staff user's id
 * and role when their role may reach `path` (via `canAccessPath`), otherwise null.
 */
export async function getStaffActor(path: string): Promise<{ id: string; role: StaffRole } | null> {
  const gate = await getStaffGate();
  if (gate.status !== "ok" || !canAccessPath(gate.role, path)) return null;
  return { id: gate.id, role: gate.role };
}

/** True when the signed-in user was issued a temporary password and must set a new one. */
export async function mustChangePassword(): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.app_metadata?.must_change_password === true;
}
