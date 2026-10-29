import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// The dashboard is served from `/d/*` internally but its public URLs have no `/d`
// prefix (`/orders/123`). `?next=` must hold the public one.
function publicPath(pathname: string, search: string): string {
  const p = pathname === "/d" ? "/" : pathname.startsWith("/d/") ? pathname.slice(2) : pathname;
  return p + search;
}

// Signed-in users have no business on these; everything else under /login and /auth
// (password change, reset, MFA challenge, email-link confirm, sign-out) stays reachable.
const SIGNED_OUT_ONLY = new Set(["/login", "/login/forgot"]);

/**
 * Refreshes the Supabase session and gates the dashboard.
 * `rewriteTo` is the internal `/d/*` URL for dashboard-host requests that arrive on their
 * public path; the response then rewrites there while still carrying refreshed cookies.
 */
export async function updateSession(request: NextRequest, rewriteTo?: URL) {
  const next = () => (rewriteTo ? NextResponse.rewrite(rewriteTo, { request }) : NextResponse.next({ request }));
  let supabaseResponse = next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = next();
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname, search } = request.nextUrl;
  const isAuthRoute = pathname === "/login" || pathname.startsWith("/login/") || pathname.startsWith("/auth/");

  // Unauthenticated → /login, remembering where they were headed.
  if (!user && !isAuthRoute) {
    const url = request.nextUrl.clone();
    const target = publicPath(pathname, search);
    url.pathname = "/login";
    url.search = target === "/" ? "" : `?next=${encodeURIComponent(target)}`;
    return NextResponse.redirect(url);
  }

  // Authenticated on the sign-in screens → dashboard home.
  if (user && SIGNED_OUT_ONLY.has(pathname.replace(/\/+$/, "") || "/")) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
