// Server-side client for blink-server's staff endpoints. Every call carries the
// signed-in operator's Supabase access token, so blink-server's requireStaff is
// the real authority; the staff-role check here only fails fast. It reads the
// session cookie (next/headers): import it from server actions and server
// components only — never from a client component. Same staff-JWT pattern as
// the support, email and Blink Server actions.
import type { StaffRole } from "@/lib/auth/access";
import { hasStaffRole } from "@/lib/auth/staff";
import { createClient } from "@/lib/supabase/server";

import { fetchBlinkApi } from "@/lib/blink-api-base";

// Base URLs (Render primary → spare, BLINK_API_BASE_URL override) live in blink-api-base.ts.
export { BLINK_API_BASE } from "@/lib/blink-api-base";

export type BlinkApiMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type BlinkApiResult<T> =
  | { ok: true; status: number; data: T }
  | {
      ok: false;
      status: number;
      error: string;
      /** blink-server's machine-readable `code`, when it sent one. */
      code?: string;
      /** Parsed error body (e.g. `conflict_id` on a 409). */
      body?: unknown;
    };

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
    const res = await fetchBlinkApi(path, {
      method,
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: "no-store",
    });
    const json = (await res.json().catch(() => null)) as unknown;
    if (!res.ok) {
      const body = json as { error?: unknown; code?: unknown } | null;
      const error = body?.error;
      return {
        ok: false,
        status: res.status,
        error: typeof error === "string" ? error : `Request failed (${res.status})`,
        body: json,
        ...(typeof body?.code === "string" ? { code: body.code } : {}),
      };
    }
    return { ok: true, status: res.status, data: json as T };
  } catch (e) {
    return { ok: false, status: 0, error: (e as Error).message };
  }
}
