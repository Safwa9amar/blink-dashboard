// Domain types for the Access (dashboard access management) feature.
import type { StaffRole } from "@/lib/auth/access";
export type { StaffRole } from "@/lib/auth/access";

// Derived account state of a staff member (see the Staff Access spec).
//  - active:          can sign in now
//  - must_change:     signs in with a temporary password and must change it
//  - never_signed_in: account exists but has never signed in
//  - suspended:       auth-banned, blocked from signing in
export type StaffStatus = "active" | "must_change" | "never_signed_in" | "suspended";

// Audit-trail actions stored in `staff_access_events.action`.
export type AccessEventAction =
  | "created"
  | "granted"
  | "role_changed"
  | "revoked"
  | "suspended"
  | "reinstated"
  | "password_reset"
  | "password_changed";

// A non-staff user offered by the "Grant access" search.
export interface CandidateHit {
  id: string;
  name: string;
  email: string;
  phone: string | null;
}

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
