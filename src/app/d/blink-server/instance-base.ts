import type { ServerInstance } from "@/features/blink-server";

// Allowlisted backend instances the monitoring tabs (AI Log + Live Logs) can
// target. Resolving by KEY — not a client-supplied URL — keeps the dashboard from
// being turned into an open proxy. Both URLs are env-overridable:
//   • online → BLINK_API_BASE_URL  (default: the prod API)
//   • local  → BLINK_API_LOCAL_URL (default: the dev server on :3001; only
//              reachable when the dashboard runs on the same machine as it)
const INSTANCE_URLS: Record<ServerInstance, string> = {
  online: process.env.BLINK_API_BASE_URL ?? "https://blink.greenpedal.net",
  local: process.env.BLINK_API_LOCAL_URL ?? "http://localhost:3001",
};

export function resolveInstanceBase(instance: ServerInstance): string {
  return INSTANCE_URLS[instance] ?? INSTANCE_URLS.online;
}
