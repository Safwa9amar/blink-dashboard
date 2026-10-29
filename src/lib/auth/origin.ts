// Server-only: the origin the current request came in on ("https://blink-dz.vercel.app",
// "http://dashboard.localhost:3000"), for absolute links in auth emails.
import { headers } from "next/headers";

export async function requestOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") || host.includes(".localhost") ? "http" : "https");
  return `${proto.split(",")[0].trim()}://${host.split(",")[0].trim()}`;
}
