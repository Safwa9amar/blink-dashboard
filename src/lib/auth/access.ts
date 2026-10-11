// Dashboard access model — the single source of truth for "which admin can see what".
//
// Admin authority lives on its OWN axis (`users.staff_role`), independent of the
// mobile-app persona (`users.role`: customer/rider/merchant/agent). A person can be an
// `agent` in the app AND a `finance_admin` in the console without conflict.
//
// This file is intentionally pure (no imports, client- and server-safe) so both the
// shell nav (hide menu entries) and the server gates (block access) read the same map.
// The route keys are the nav `href`s from `src/lib/nav/modules.ts`.

export const STAFF_ROLES = [
  "super_admin",
  "ops_admin",
  "finance_admin",
  "support_admin",
  "commerce_admin",
  "hr_admin",
] as const;

export type StaffRole = (typeof STAFF_ROLES)[number];

// Which dashboard routes each role may reach. "*" = everything. Routes absent from a
// role's list are denied for that role (e.g. only `super_admin` reaches `/settings`).
// "/" (Overview) is granted to every staff role and serves as the safe landing page.
export const ROLE_ACCESS: Record<StaffRole, "*" | readonly string[]> = {
  super_admin: "*",
  ops_admin: [
    "/",
    "/customers",
    "/agents",
    "/orders",
    "/demand",
    "/live-ops",
    "/trips",
    "/riders",
    "/users",
    "/deletion-requests",
  ],
  finance_admin: ["/", "/blink-cash"],
  support_admin: ["/", "/notifications", "/news", "/deep-links", "/support", "/email", "/deletion-requests"],
  commerce_admin: ["/", "/merchants", "/marketplace", "/library", "/promotions", "/coupons", "/merchant-pricing", "/packs-management"],
  // HR / RH manager — people-facing sections: the customer & merchant rosters,
  // platform users, riders and agents (each with its verification sub-route).
  hr_admin: ["/", "/customers", "/merchants", "/agents", "/users", "/deletion-requests", "/riders"],
};

export function isStaffRole(value: unknown): value is StaffRole {
  return typeof value === "string" && (STAFF_ROLES as readonly string[]).includes(value);
}

// Mirrors the sidebar's active-link logic: "/" matches only itself; every other route
// matches itself and its sub-paths (so "/notifications" covers "/notifications/[id]").
function routeMatches(pathname: string, route: string): boolean {
  if (route === "/") return pathname === "/";
  return pathname === route || pathname.startsWith(route + "/");
}

export function canAccessPath(role: StaffRole | null | undefined, pathname: string): boolean {
  if (!role) return false;
  const allowed = ROLE_ACCESS[role];
  if (allowed === "*") return true;
  return allowed.some((route) => routeMatches(pathname, route));
}

// Where to send a staff member who lands on a route they can't see. Overview is in
// every role's list, so it's always a valid destination.
export function defaultPathFor(role: StaffRole | null | undefined): string {
  if (!role) return "/login";
  const allowed = ROLE_ACCESS[role];
  if (allowed === "*") return "/";
  return allowed[0] ?? "/";
}

// Every staff role that can open `pathname`. Server actions use it to re-check the
// caller against the section they review (e.g. "/riders" for rider documents), so the
// guard can never drift from the nav map above.
export function rolesWithAccess(pathname: string): StaffRole[] {
  return STAFF_ROLES.filter((role) => canAccessPath(role, pathname));
}

// Legacy routes that only forward to a merged page (no data, no UI). They are not in
// any role's list — the target page enforces access — but the shell's client guard
// must let them through, otherwise it would bounce a role home before the server
// redirect lands it on the right target.
const REDIRECT_ONLY = ["/vehicles", "/agent-shops", "/verification"] as const;

export function isRedirectOnlyPath(pathname: string): boolean {
  return REDIRECT_ONLY.some((route) => routeMatches(pathname, route));
}
