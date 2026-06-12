// Pure deep-link processing — no React, no store. Normalize an imported catalog,
// derive friendly labels, and build / parse / validate concrete deep links.

import type {
  DeepLinkRole,
  DeepLinkRoute,
  RawDeepLinkFile,
  RawDeepLinkRoute,
  ParsedDeepLink,
} from "./types";

const ROLES: DeepLinkRole[] = ["customer", "rider", "merchant", "agent", "auth", "shared"];

export const ROLE_ORDER: DeepLinkRole[] = ["customer", "rider", "merchant", "agent", "auth", "shared"];

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** "[id]" → ":id"; "deposit-detail" → "Deposit Detail". */
function prettifySegment(seg: string): string {
  const param = seg.match(/^\[(?:\.{3})?(.+)\]$/);
  if (param) return `:${param[1]}`;
  return seg
    .replace(/[-_]/g, " ")
    .split(" ")
    .filter(Boolean)
    .map(cap)
    .join(" ");
}

export function roleOf(raw: string | null | undefined): DeepLinkRole {
  if (raw && (ROLES as string[]).includes(raw)) return raw as DeepLinkRole;
  return "shared";
}

/** Build a breadcrumb label from an Expo routePath, stripping `(group)` segments. */
export function labelFromRoutePath(routePath: string, role: DeepLinkRole): string {
  const crumbs = routePath
    .split("/")
    .filter(Boolean)
    .filter((seg) => !/^\(.+\)$/.test(seg)) // drop route groups: (customer), (deposit)…
    .map(prettifySegment);
  const roleLabel = role !== "shared" ? cap(role) : null;
  const parts = [roleLabel, ...crumbs].filter(Boolean) as string[];
  return parts.length ? parts.join(" › ") : cap(role);
}

/** Normalize a raw imported file into a deduped, labelled, sorted route list. */
export function normalize(raw: RawDeepLinkFile): DeepLinkRoute[] {
  const rawRoutes: RawDeepLinkRoute[] = Array.isArray(raw?.routes) ? raw.routes : [];
  const seen = new Set<string>();
  const out: DeepLinkRoute[] = [];

  for (const r of rawRoutes) {
    if (!r?.deepLink || seen.has(r.deepLink)) continue;
    seen.add(r.deepLink);
    const role = roleOf(r.role);
    out.push({
      deepLink: r.deepLink,
      role,
      requiresParams: Array.isArray(r.requiresParams) ? r.requiresParams : extractParams(r.deepLink),
      routePath: r.routePath ?? r.deepLink,
      label: labelFromRoutePath(r.routePath ?? r.deepLink, role),
    });
  }

  return out.sort((a, b) => {
    const ra = ROLE_ORDER.indexOf(a.role) - ROLE_ORDER.indexOf(b.role);
    return ra !== 0 ? ra : a.label.localeCompare(b.label);
  });
}

/** Param names referenced in a template, e.g. `blink://x/[a]/[b]` → ["a","b"]. */
export function extractParams(template: string): string[] {
  return [...template.matchAll(/\[(?:\.{3})?([^\]]+)\]/g)].map((m) => m[1]);
}

/** Fill `[param]` placeholders with values (URL-encoded). Missing ones are left intact. */
export function buildDeepLink(template: string, params: Record<string, string> = {}): string {
  return template.replace(/\[(?:\.{3})?([^\]]+)\]/g, (whole, name: string) => {
    const v = params[name];
    return v != null && v !== "" ? encodeURIComponent(v) : whole;
  });
}

/** Param placeholders still unfilled in a URL. */
export function missingParams(url: string): string[] {
  return extractParams(url);
}

/**
 * Fill `[param]` placeholders in an internal Expo `routePath`, KEEPING the
 * `(group)` segments — the form passed to `router.push()` and to a push payload's
 * `data.href`. e.g. `fillRoute("/(customer)/deal/[id]", { id: "42" })` →
 * `"/(customer)/deal/42"`. (The `blink://…` form is the external/share URL; use
 * `buildDeepLink` for that.)
 */
export function fillRoute(routePath: string, params: Record<string, string> = {}): string {
  return buildDeepLink(routePath, params);
}

function templateToRegex(template: string): RegExp {
  const escaped = template
    .replace(/[.*+?^${}()|\\]/g, "\\$&")
    .replace(/\[(?:\\\.\\\.\\\.)?[^\]]+\]/g, "([^/]+)");
  return new RegExp(`^${escaped}$`);
}

/**
 * Tolerate Expo route-group parens in a pasted link, mirroring how the catalog
 * derives `deepLink` from `routePath`: `blink://(merchant)/earnings` →
 * `blink://merchant/earnings`. The group segment is kept, only the parens drop.
 */
function stripRouteGroups(url: string): string {
  return url.replace(/\(([^()/]+)\)/g, "$1");
}

/** Match a concrete URL against the catalog, extracting its params. */
export function parseDeepLink(url: string, routes: DeepLinkRoute[]): ParsedDeepLink {
  const clean = stripRouteGroups(url.trim());
  for (const route of routes) {
    const m = templateToRegex(route.deepLink).exec(clean);
    if (!m) continue;
    const params: Record<string, string> = {};
    route.requiresParams.forEach((p, i) => {
      params[p] = decodeURIComponent(m[i + 1] ?? "");
    });
    return { route, params, valid: true };
  }
  return { params: {}, valid: false };
}

export function isExternalUrl(url: string): boolean {
  return /^https?:\/\//i.test(url.trim());
}

export function isCatalogLink(url: string, scheme: string): boolean {
  return url.trim().toLowerCase().startsWith(`${scheme}://`);
}

/**
 * Does this link target an audience? `shared`/`auth` links are always allowed.
 * `audienceRoles` are dashboard role names (e.g. ["Customer"], or ["All"]).
 */
export function matchesAudience(route: DeepLinkRoute | undefined, audienceRoles: string[]): boolean {
  if (!route) return true; // external / custom URL — not our concern
  if (route.role === "shared" || route.role === "auth") return true;
  const lower = audienceRoles.map((r) => r.toLowerCase());
  if (lower.includes("all")) return true;
  return lower.includes(route.role);
}

export function groupByRole(routes: DeepLinkRoute[]): { role: DeepLinkRole; routes: DeepLinkRoute[] }[] {
  return ROLE_ORDER.map((role) => ({ role, routes: routes.filter((r) => r.role === role) })).filter(
    (g) => g.routes.length > 0
  );
}
