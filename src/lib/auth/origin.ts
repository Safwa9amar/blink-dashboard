// Server-only: the dashboard origin for absolute links in auth emails. On Vercel it comes
// from the deployment's own URL (never from request headers, which a proxy could let a
// client set); `AUTH_SITE_URL` overrides it (e.g. a custom domain). Local dev falls back to
// the request host ("http://dashboard.localhost:3000").
import { headers } from "next/headers";

export async function requestOrigin(): Promise<string> {
  const fixed = process.env.AUTH_SITE_URL;
  if (fixed) return fixed.replace(/\/+$/, "");
  const vercelHost =
    process.env.VERCEL_ENV === "production" ? process.env.VERCEL_PROJECT_PRODUCTION_URL : process.env.VERCEL_URL;
  if (vercelHost) return `https://${vercelHost}`;

  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  const local = host.startsWith("localhost") || host.includes(".localhost") || host.startsWith("127.0.0.1");
  return `${local ? "http" : "https"}://${host}`;
}
