import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Dashboard subdomain prefixes — add your production domain
const DASHBOARD_PREFIXES = ["dashboard."];

function isDashboard(host: string): boolean {
  return DASHBOARD_PREFIXES.some((p) => host.startsWith(p));
}

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get("host") ?? "";
  const { pathname } = request.nextUrl;

  if (isDashboard(hostname)) {
    // Already rewritten to /d — let it through with auth
    if (pathname.startsWith("/d")) {
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
  if (pathname.startsWith("/d")) {
    return NextResponse.rewrite(new URL("/not-found", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|images|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
