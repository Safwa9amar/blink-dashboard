import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Dashboard subdomain prefixes — add your production domain.
// Use `dashboard.` for production custom domains (e.g. `dashboard.blink-dz.com`).
const DASHBOARD_PREFIXES = ["dashboard."];

/**
 * Full hostnames to treat as the dashboard surface (no `dashboard.` prefix
 * required). On Vercel deployments without a custom domain, the bare
 * `*.vercel.app` URL is the only entry point — without this, the middleware
 * would only ever serve the landing site there.
 *
 * `VERCEL_URL` is the URL for the current deployment (preview or production).
 * `VERCEL_PROJECT_PRODUCTION_URL` is the canonical production URL.
 *
 * Additionally, anything in `DASHBOARD_HOSTS` (comma-separated env var) gets
 * added — useful for staging domains or custom Vercel aliases without a
 * `dashboard.` prefix.
 */
const DASHBOARD_HOSTS = new Set(
  [
    process.env.VERCEL_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
    ...(process.env.DASHBOARD_HOSTS?.split(",") ?? []),
  ]
    .map((h) => h?.trim().toLowerCase())
    .filter((h): h is string => !!h),
);

function isDashboard(host: string): boolean {
  const h = host.toLowerCase();
  if (DASHBOARD_HOSTS.has(h)) return true;
  return DASHBOARD_PREFIXES.some((p) => h.startsWith(p));
}

// The internal (rewritten) dashboard segment is exactly `/d` or `/d/...` —
// NOT every path that merely begins with "/d" (e.g. /deep-links, /demand).
function isInternalDashboardPath(pathname: string): boolean {
  return pathname === "/d" || pathname.startsWith("/d/");
}

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get("host") ?? "";
  const { pathname } = request.nextUrl;

  if (isDashboard(hostname)) {
    // Already rewritten to /d — let it through with auth
    if (isInternalDashboardPath(pathname)) {
      return await updateSession(request);
    }

    // /login stays at /login (shared between both)
    if (pathname.startsWith("/login")) {
      return await updateSession(request);
    }

    // Rewrite all dashboard subdomain requests to /d/* internally
    const url = request.nextUrl.clone();
    url.pathname = `/d${pathname === "/" ? "" : pathname}`;
    return NextResponse.rewrite(url);
  }

  // Main domain — block dashboard internal routes
  if (isInternalDashboardPath(pathname)) {
    return NextResponse.rewrite(new URL("/not-found", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|images|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
