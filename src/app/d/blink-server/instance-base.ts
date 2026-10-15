import type { ServerInstance } from "@/features/blink-server";
import { BLINK_API_BASE } from "@/lib/blink-api-base";

// Allowlisted backend instances the monitoring tabs (AI Log + Live Logs) can
// target. Resolving by KEY — not a client-supplied URL — keeps the dashboard from
// being turned into an open proxy. Both URLs are env-overridable:
//   • online → the first blink-server base (blink-api-base.ts: BLINK_API_BASE_URL, else Render primary)
//   • local  → BLINK_API_LOCAL_URL (default: the dev server on :3001; only
//              reachable when the dashboard runs on the same machine as it)
const INSTANCE_URLS: Record<ServerInstance, string> = {
  online: BLINK_API_BASE,
  local: process.env.BLINK_API_LOCAL_URL ?? "http://localhost:3001",
};

export function resolveInstanceBase(instance: ServerInstance): string {
  return INSTANCE_URLS[instance] ?? INSTANCE_URLS.online;
}
