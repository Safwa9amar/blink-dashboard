export type DeepLinkRole = "customer" | "rider" | "merchant" | "agent" | "auth" | "shared";

/** A normalized, dashboard-ready deep-link route. */
export interface DeepLinkRoute {
  /** The deep link template, e.g. `blink://customer/deal/[id]`. */
  deepLink: string;
  /** Human label derived from the route path, e.g. `Customer › Deal › :id`. */
  label: string;
  role: DeepLinkRole;
  /** Names of params that must be filled in (in order), e.g. `["id"]`. */
  requiresParams: string[];
  /** Original Expo route path (kept for reference / regeneration). */
  routePath: string;
}

/** Shape of an imported catalog file (as exported from the app). */
export interface RawDeepLinkFile {
  scheme?: string;
  appVersion?: string;
  count?: number;
  roles?: string[];
  routes?: RawDeepLinkRoute[];
}

export interface RawDeepLinkRoute {
  routePath: string;
  deepLink: string;
  role: string | null;
  requiresParams?: string[];
  label?: string;
}

export interface DeepLinkCatalog {
  scheme: string;
  routes: DeepLinkRoute[];
}

export interface ParsedDeepLink {
  route?: DeepLinkRoute;
  params: Record<string, string>;
  valid: boolean;
}

export interface ImportResult {
  ok: boolean;
  count: number;
  scheme?: string;
  error?: string;
}

// ─── DB shape for the `deep_links` table (managed/generated links) ───────────
// Mirrors blink-server's `deepLinks` Drizzle table (src/db/schema/deep-links.ts).
// The dashboard queries via supabase-js, so it declares the row shape here and
// keeps it in sync with the server schema by hand.
export interface ManagedDeepLink {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  role: DeepLinkRole;
  route_path: string;
  deep_link: string;
  web_url: string | null;
  required_params: string[];
  params: Record<string, string>;
  campaign: string | null;
  is_active: boolean;
  clicks: number;
  expires_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// What the create/edit form hands to the server action (camelCase; the action
// maps it to the snake_case columns). `slug` is derived from the title when omitted.
export interface ManagedDeepLinkInput {
  title: string;
  slug?: string;
  description?: string | null;
  role: DeepLinkRole;
  routePath: string;
  deepLink: string;
  webUrl?: string | null;
  requiredParams: string[];
  params: Record<string, string>;
  campaign?: string | null;
  isActive: boolean;
  expiresAt?: string | null;
}
