// Server-side staff resolution + guards. Imported only by server entries (the `d`
// layout and `action.ts` mutations) — never by client components.

import { createClient } from "@/lib/supabase/server";
import { isStaffRole, type StaffRole } from "./access";

// Resolves the current viewer's dashboard role, or null if they aren't staff.
//
// TODO(blink-server migration): this reads `users.staff_role`, a column that does NOT
// exist yet (see ~/blink-server/supabase/migrations — the `staff_role` column + RLS
// read policies still need to land). Until the migration ships, the SELECT fails with
// Postgres 42703 (undefined_column); we treat that one case as "pre-migration" and let
// any authenticated user through as `super_admin` so the console stays usable. Once the
// column exists, a real row with a null/invalid `staff_role` correctly resolves to null
// (no dashboard access) and this stub becomes a no-op.
export async function getCurrentStaffRole(): Promise<StaffRole | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("users")
    .select("staff_role")
    .eq("id", user.id)
    .single();

  if (error) {
    // 42703 = undefined_column → migration hasn't run. Don't lock anyone out yet.
    if (error.code === "42703") return "super_admin";
    return null;
  }

  const value = (data as { staff_role?: unknown } | null)?.staff_role ?? null;
  return isStaffRole(value) ? value : null;
}

// Mutation guard for server actions (which have no pathname to gate on). Returns true
// only when the current viewer's staff role is in `allowed`.
export async function hasStaffRole(...allowed: StaffRole[]): Promise<boolean> {
  const role = await getCurrentStaffRole();
  return role !== null && allowed.includes(role);
}
