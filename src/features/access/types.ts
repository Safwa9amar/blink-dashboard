// Domain types for the Access (dashboard access management) feature.
import type { StaffRole } from "@/lib/auth/access";
export type { StaffRole } from "@/lib/auth/access";

// Account state of a staff member, separate from their role.
//  - active:    can sign in now
//  - invited:   granted a role but hasn't signed in yet
//  - suspended: kept on the roster but blocked from signing in
export type StaffStatus = "active" | "invited" | "suspended";

// A person who can sign in to the admin console. `staffRole` is their dashboard
// authority — a separate axis from the mobile-app persona (`users.role`).
export interface StaffMember {
  id: string;
  name: string; // display name — derived from first + last
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string;
  staffRole: StaffRole;
  status: StaffStatus;
  lastActive: string; // ISO date
}

// One entry in the access audit trail (who changed whose access, and when).
export type AccessAction = "granted" | "changed" | "revoked" | "suspended" | "reinstated";

export interface AccessLogEntry {
  id: string;
  actor: string; // staff member who made the change
  action: AccessAction;
  target: string; // staff member affected
  role: StaffRole | null; // role involved (null when access was revoked)
  at: string; // ISO datetime
}

// The translator type that recurs across features.
export type TFn = (key: string, values?: Record<string, string | number>) => string;
