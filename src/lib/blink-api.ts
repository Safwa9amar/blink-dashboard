// Server-side client for blink-server's staff endpoints. Every call carries the
// signed-in operator's Supabase access token, so blink-server's requireStaff is
// the real authority; the staff-role check here only fails fast. It reads the
// session cookie (next/headers): import it from server actions and server
// components only — never from a client component. Same staff-JWT pattern as
// the support, email and Blink Server actions.
import type { StaffRole } from "@/lib/auth/access";
import { hasStaffRole } from "@/lib/auth/staff";
import { createClient } from "@/lib/supabase/server";

// Override per environment (Vercel / .env.local / `BLINK_API_BASE_URL=… npm run dev`).
export const BLINK_API_BASE = process.env.BLINK_API_BASE_URL ?? "https://blink.greenpedal.net";

export type BlinkApiMethod = "GET" | "POST" | "PATCH" | "DELETE";

export type BlinkApiResult<T> =
  | { ok: true; status: number; data: T }
  | { ok: false; status: number; error: string };

export async function blinkApi<T = unknown>(
  path: string,
  { method = "GET", body, roles }: { method?: BlinkApiMethod; body?: unknown; roles: readonly StaffRole[] }
): Promise<BlinkApiResult<T>> {
  if (!(await hasStaffRole(...roles))) return { ok: false, status: 403, error: "Not authorized" };

  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) return { ok: false, status: 401, error: "No session" };

  try {
    const res = await fetch(`${BLINK_API_BASE}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    });
    const json = (await res.json().catch(() => null)) as unknown;
    if (!res.ok) {
      const error = (json as { error?: unknown } | null)?.error;
      return {
        ok: false,
        status: res.status,
        error: typeof error === "string" ? error : `Request failed (${res.status})`,
      };
    }
    return { ok: true, status: res.status, data: json as T };
  } catch (e) {
    return { ok: false, status: 0, error: (e as Error).message };
  }
}
