// Post-sign-in redirect targets come from the URL (`?next=`), so only same-site
// relative paths are honoured: "/orders/123?tab=x" yes, "//evil.com" or "https://…" no.
export function safeNext(value: string | null | undefined, fallback = "/"): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return fallback;
  // Never bounce back into the auth screens themselves.
  if (value === "/login" || value.startsWith("/login?") || value.startsWith("/auth/")) return fallback;
  return value;
}
