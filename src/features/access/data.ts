// Shared helpers for the Access feature (route labels + role→section mapping).
// The roster and audit trail come from the server (see app/d/access/data.ts).

import { ROLE_ACCESS, STAFF_ROLES, type StaffRole } from "@/lib/auth/access";

export type { StaffStatus } from "./types";
export { STAFF_ROLES, type StaffRole };

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
  "/users": "users",
  "/blink-cash": "blink_cash",
  "/notifications": "notifications",
  "/news": "news",
  "/deep-links": "deep_links",
  "/merchants": "merchants",
  "/marketplace": "marketplace",
  "/agents": "agents",
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
