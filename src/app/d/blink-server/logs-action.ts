"use server";

import { hasStaffRole } from "@/lib/auth/staff";
import { createClient } from "@/lib/supabase/server";

// Blink Server → Live Logs. The logs live in the blink-server process (an in-memory
// ring buffer), so these proxy to its super-admin GET/DELETE /logs endpoint using
// the operator's Supabase access token (same staff-JWT pattern as fetchAiModels).
const API_BASE = process.env.BLINK_API_BASE_URL ?? "https://blink.greenpedal.net";

export interface ServerLogEntry {
  id: number;
  ts: string;
  level: "info" | "warn" | "error";
  source: string;
  msg: string;
}

async function staffToken(): Promise<string | null> {
  if (!(await hasStaffRole("super_admin"))) return null;
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

// Incremental tail: pass the last id seen to get only newer entries.
export async function fetchServerLogs(
  since = 0
): Promise<{ logs: ServerLogEntry[]; lastId: number; error: string | null }> {
  const token = await staffToken();
  if (!token) return { logs: [], lastId: since, error: "Not authorized" };
  try {
    const res = await fetch(`${API_BASE}/logs?since=${since}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) {
      const j = (await res.json().catch(() => null)) as { error?: string } | null;
      return { logs: [], lastId: since, error: j?.error ?? `Request failed (${res.status})` };
    }
    const j = (await res.json()) as { logs?: ServerLogEntry[]; lastId?: number };
    return {
      logs: Array.isArray(j.logs) ? j.logs : [],
      lastId: typeof j.lastId === "number" ? j.lastId : since,
      error: null,
    };
  } catch (e) {
    return { logs: [], lastId: since, error: (e as Error).message };
  }
}

export async function clearServerLogs(): Promise<{ error: string | null }> {
  const token = await staffToken();
  if (!token) return { error: "Not authorized" };
  try {
    const res = await fetch(`${API_BASE}/logs`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) return { error: `Request failed (${res.status})` };
    return { error: null };
  } catch (e) {
    return { error: (e as Error).message };
  }
}
