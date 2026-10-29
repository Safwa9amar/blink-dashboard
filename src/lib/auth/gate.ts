// Pure decision for the server-side staff gate (no I/O, unit-tested).
import { isStaffRole, type StaffRole } from "./access";

export type StaffGate =
  | { status: "ok"; id: string; role: StaffRole }
  | { status: "signed_out" }
  | { status: "mfa_required" }
  | { status: "not_staff" };

export function decideGate(input: {
  userId: string | null;
  /** Value of users.staff_role; undefined when the column doesn't exist yet (pre-migration). */
  staffRole: unknown;
  preMigration?: boolean;
  /** Row lookup failed for another reason than the pre-migration case. */
  lookupFailed?: boolean;
  currentLevel: string | null | undefined;
  nextLevel: string | null | undefined;
}): StaffGate {
  if (!input.userId) return { status: "signed_out" };
  // A verified factor exists but this session hasn't passed it: not authorized anywhere.
  if (input.nextLevel === "aal2" && input.currentLevel !== "aal2") return { status: "mfa_required" };
  if (input.preMigration) return { status: "ok", id: input.userId, role: "super_admin" };
  if (input.lookupFailed) return { status: "not_staff" };
  return isStaffRole(input.staffRole)
    ? { status: "ok", id: input.userId, role: input.staffRole }
    : { status: "not_staff" };
}
