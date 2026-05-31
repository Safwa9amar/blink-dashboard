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
