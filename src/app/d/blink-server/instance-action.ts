"use server";

import { hasStaffRole } from "@/lib/auth/staff";
import type { ServerInstance } from "@/features/blink-server";
import { resolveInstanceBase } from "./instance-base";

// Probe a backend instance's public /health so the switcher can show which server
// is being monitored and its live version. Super-admin only, like the rest of the
// Blink Server section.
export async function fetchInstanceHealth(
  instance: ServerInstance
): Promise<{ version: string | null; ok: boolean; error: string | null }> {
  if (!(await hasStaffRole("super_admin")))
    return { version: null, ok: false, error: "Not authorized" };
  const base = resolveInstanceBase(instance);
  try {
    const res = await fetch(`${base}/health?_=${Date.now()}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return { version: null, ok: false, error: `HTTP ${res.status}` };
    const j = (await res.json()) as { status?: string; version?: string };
    return { version: j?.version ?? null, ok: j?.status === "ok", error: null };
  } catch (e) {
    return { version: null, ok: false, error: (e as Error).message };
  }
}
