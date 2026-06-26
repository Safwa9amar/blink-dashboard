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

// CANONICAL deep link = the exact URL the app navigates with: the scheme + the
// Expo `routePath`, with the route-group parens KEPT — e.g.
// "blink://(rider)/blink-cash", "blink://(customer)/deal/[id]", "blink://news".
// The app resolves these via Expo Router's group-aware linking; the paren-LESS
// form ("blink://rider/…") does NOT navigate (the bare role isn't a route and the
// app's resolveDeepLink bridge is unused), so we DERIVE deepLink from routePath
// rather than trusting the catalog's (paren-less) `deepLink`. Matching stays
// paren-tolerant (see parseDeepLink) so a pasted paren-less link still resolves.
export function routePathToDeepLink(routePath: string, scheme = "blink"): string {
  return `${scheme}://${routePath.replace(/^\//, "")}`;
}

/** Normalize a raw imported file into a deduped, labelled, sorted route list. */
export function normalize(raw: RawDeepLinkFile): DeepLinkRoute[] {
  const scheme = raw?.scheme ?? "blink";
  const rawRoutes: RawDeepLinkRoute[] = Array.isArray(raw?.routes) ? raw.routes : [];
  const seen = new Set<string>();
  const out: DeepLinkRoute[] = [];

  for (const r of rawRoutes) {
    const routePath = r?.routePath ?? r?.deepLink;
    if (!routePath) continue;
    const role = roleOf(r.role);
    // Derive the canonical group-kept deep link from the routePath (the app form).
    const deepLink = routePath.startsWith("/") ? routePathToDeepLink(routePath, scheme) : routePath;
    if (seen.has(deepLink)) continue;
    seen.add(deepLink);
    out.push({
      deepLink,
      role,
      requiresParams: Array.isArray(r.requiresParams) ? r.requiresParams : extractParams(routePath),
      routePath,
      label: labelFromRoutePath(routePath, role),
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
 * Drop Expo route-group parens from a link so matching is paren-AGNOSTIC:
 * `blink://(merchant)/earnings` → `blink://merchant/earnings`. The canonical
 * deepLink keeps the parens, but we strip them on BOTH the input and the template
 * before matching, so an operator who pastes either form still resolves.
 */
function stripRouteGroups(url: string): string {
  return url.replace(/\(([^()/]+)\)/g, "$1");
}

/** Match a concrete URL against the catalog, extracting its params. */
export function parseDeepLink(url: string, routes: DeepLinkRoute[]): ParsedDeepLink {
  const clean = stripRouteGroups(url.trim());
  for (const route of routes) {
    const m = templateToRegex(stripRouteGroups(route.deepLink)).exec(clean);
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

// Blink's marketing/web hosts. A path on one of these can be mapped to an in-app
// deep link. (No OS universal links are configured — this is an authoring
// convenience: paste a web URL, get the proper blink:// link.)
export const BLINK_WEB_HOSTS = ["blink.dz", "www.blink.dz"];

export interface WebUrlConversion {
  /** External blink:// URL, with any concrete path params filled in. */
  deepLink: string;
  /** Internal /(role)/… router.push form, params filled. */
  routePath: string;
  /** The matched catalog route. */
  route: DeepLinkRoute;
  /** The original web URL (kept as the web_url fallback). */
  webUrl: string;
}

/**
 * Convert a Blink web URL into the matching in-app deep link, e.g.
 *   https://blink.dz/news            → blink://news            (route /news)
 *   https://blink.dz/customer/deal/42 → blink://customer/deal/42 (/(customer)/deal/[id])
 *
 * Returns null — leaving the link untouched — for a non-Blink host (real external
 * link), the bare marketing root, or a path that matches no catalog route. The
 * role stays a plain first segment (never parenthesized); the parens live only on
 * the returned `routePath`.
 */
export function webUrlToDeepLink(
  url: string,
  routes: DeepLinkRoute[],
  scheme = "blink"
): WebUrlConversion | null {
  const trimmed = url.trim();
  if (!isExternalUrl(trimmed)) return null; // not an http(s) URL

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(trimmed);
  } catch {
    return null;
  }
  if (!BLINK_WEB_HOSTS.includes(parsedUrl.hostname.toLowerCase())) return null; // real external link

  const segments = parsedUrl.pathname.split("/").filter(Boolean);
  if (segments.length && segments[segments.length - 1].toLowerCase() === "index") segments.pop();
  if (segments.length === 0) return null; // bare marketing root — nothing to link

  const candidate = `${scheme}://${segments.join("/")}`;
  const parsed = parseDeepLink(candidate, routes);
  if (!parsed.valid || !parsed.route) return null; // not a known in-app route

  return {
    deepLink: buildDeepLink(parsed.route.deepLink, parsed.params),
    routePath: fillRoute(parsed.route.routePath, parsed.params),
    route: parsed.route,
    webUrl: trimmed,
  };
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
