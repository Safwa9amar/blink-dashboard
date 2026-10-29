// Post-sign-in redirect targets come from the URL (`?next=`), so only same-site
// relative paths are honoured: "/orders/123?tab=x" yes, "//evil.com" or "https://…" no.
export function safeNext(value: string | null | undefined, fallback = "/"): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return fallback;
  // Never bounce back into the auth screens themselves.
  if (value === "/login" || value.startsWith("/login?") || value.startsWith("/auth/")) return fallback;
  return value;
}

// Sign-in screens a signed-in user is bounced off (to "/"). Only real page loads are bounced:
// the sign-in form calls server actions (POST /login) right after signing in, and redirecting
// those makes the action fail with an HTML response.
const SIGNED_OUT_ONLY = new Set(["/login", "/login/forgot"]);

export function bounceSignedIn(method: string, pathname: string): boolean {
  if (method !== "GET" && method !== "HEAD") return false;
  return SIGNED_OUT_ONLY.has(pathname.replace(/\/+$/, "") || "/");
}
