// Pure decision for the server-side staff gate (no I/O, unit-tested).
import { isStaffRole, type StaffRole } from "./access";

export type StaffGate =
  | { status: "ok"; id: string; role: StaffRole }
  | { status: "signed_out" }
  | { status: "mfa_required" }
  | { status: "password_change" }
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
  /** Signed in with a temporary password (app_metadata.must_change_password). */
  mustChangePassword?: boolean;
}): StaffGate {
  if (!input.userId) return { status: "signed_out" };
  // A verified factor exists but this session hasn't passed it: not authorized anywhere.
  if (input.nextLevel === "aal2" && input.currentLevel !== "aal2") return { status: "mfa_required" };
  if (input.lookupFailed && !input.preMigration) return { status: "not_staff" };
  const role: StaffRole | null = input.preMigration ? "super_admin" : isStaffRole(input.staffRole) ? input.staffRole : null;
  if (!role) return { status: "not_staff" };
  // A temporary password must be replaced before anything else, server actions included.
  if (input.mustChangePassword) return { status: "password_change" };
  return { status: "ok", id: input.userId, role };
}

/** `aal` claim of an access token, decoded without verifying (callers verify it first). */
export function tokenAal(jwt: string | null | undefined): string | null {
  const part = jwt?.split(".")[1];
  if (!part) return null;
  try {
    const json = JSON.parse(Buffer.from(part.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8"));
    return typeof json?.aal === "string" ? json.aal : null;
  } catch {
    return null;
  }
}

/** Assurance levels from a server-verified user (its factors) and its validated token. */
export function assuranceLevels(
  factors: readonly { status?: string }[] | null | undefined,
  accessToken: string | null | undefined,
): { currentLevel: string | null; nextLevel: string | null } {
  const currentLevel = tokenAal(accessToken);
  const nextLevel = factors?.some((f) => f.status === "verified") ? "aal2" : currentLevel;
  return { currentLevel, nextLevel };
}
