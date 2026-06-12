// Seed data for the Access module.
//
// TODO(blink-server migration): swap this seed for real queries in `page.tsx`
// (`users` WHERE `staff_role IS NOT NULL`, plus an access-audit table) once they
// ship — see src/lib/auth/staff.ts. Until then the lists are mock so the screen
// is demoable.

import { ROLE_ACCESS, STAFF_ROLES, type StaffRole } from "@/lib/auth/access";
import type { AccessLogEntry, StaffMember } from "./types";

export type { StaffMember, StaffStatus, AccessLogEntry, AccessAction, TFn } from "./types";
export { STAFF_ROLES, type StaffRole };

export const STAFF: StaffMember[] = [
  { id: "u-001", name: "Amine Bouzid", email: "amine@blink.dz", staffRole: "super_admin", status: "active", lastActive: "2026-05-31" },
  { id: "u-002", name: "Yasmine Haddad", email: "yasmine@blink.dz", staffRole: "ops_admin", status: "active", lastActive: "2026-05-31" },
  { id: "u-003", name: "Karim Saadi", email: "karim@blink.dz", staffRole: "finance_admin", status: "active", lastActive: "2026-05-29" },
  { id: "u-004", name: "Nadia Cherif", email: "nadia@blink.dz", staffRole: "support_admin", status: "invited", lastActive: "2026-05-30" },
  { id: "u-005", name: "Sofiane Brahimi", email: "sofiane@blink.dz", staffRole: "commerce_admin", status: "active", lastActive: "2026-05-28" },
  { id: "u-006", name: "Lina Mansouri", email: "lina@blink.dz", staffRole: "ops_admin", status: "suspended", lastActive: "2026-05-20" },
];

// Access audit trail — most recent first.
export const ACCESS_LOG: AccessLogEntry[] = [
  { id: "log-01", actor: "Amine Bouzid", action: "granted", target: "Nadia Cherif", role: "support_admin", at: "2026-05-31T09:12:00" },
  { id: "log-02", actor: "Amine Bouzid", action: "suspended", target: "Lina Mansouri", role: "ops_admin", at: "2026-05-30T16:40:00" },
  { id: "log-03", actor: "Amine Bouzid", action: "changed", target: "Karim Saadi", role: "finance_admin", at: "2026-05-29T11:05:00" },
  { id: "log-04", actor: "Amine Bouzid", action: "granted", target: "Sofiane Brahimi", role: "commerce_admin", at: "2026-05-28T14:22:00" },
  { id: "log-05", actor: "Amine Bouzid", action: "revoked", target: "Omar Tlemcani", role: null, at: "2026-05-26T10:30:00" },
  { id: "log-06", actor: "Amine Bouzid", action: "granted", target: "Yasmine Haddad", role: "ops_admin", at: "2026-05-24T08:50:00" },
];

// href → sidebar i18n key, so the roles reference / permission matrix can label
// sections using the existing `sidebar` namespace (no duplicated copy).
const ROUTE_LABEL_KEY: Record<string, string> = {
  "/": "overview",
  "/customers": "customers",
  "/orders": "orders",
  "/demand": "demand",
  "/live-ops": "live_ops",
  "/trips": "trips",
  "/riders": "riders",
  "/vehicles": "vehicles",
  "/users": "users",
  "/verification": "verification",
  "/blink-cash": "blink_cash",
  "/notifications": "notifications",
  "/news": "news",
  "/deep-links": "deep_links",
  "/merchants": "merchants",
  "/marketplace": "marketplace",
  "/agents": "agents",
  "/agent-shops": "agent_shops",
  "/promotions": "promotions",
  "/coupons": "coupons",
};

// Every gateable section, as {href, key} rows — the row axis of the permission matrix.
export const ALL_SECTIONS: { href: string; key: string }[] = Object.entries(ROUTE_LABEL_KEY).map(
  ([href, key]) => ({ href, key })
);

// Which sidebar sections a role can reach, derived from the single source of truth
// (ROLE_ACCESS) so the reference panel can never drift from what's enforced.
// Returns "all" for super_admin.
export function sectionKeysForRole(role: StaffRole): "all" | string[] {
  const access = ROLE_ACCESS[role];
  if (access === "*") return "all";
  return access.map((href) => ROUTE_LABEL_KEY[href]).filter(Boolean);
}
