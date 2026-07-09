"use server";

import { hasStaffRole } from "@/lib/auth/staff";
import { createClient } from "@/lib/supabase/server";
import type { ServerInstance } from "@/features/blink-server";
import { resolveInstanceBase } from "./instance-base";

// Blink Server → AI Log. The AI-call log lives in the blink-server process (an
// in-memory ring buffer — every provider chat/stream, including the "model reached
// its limit" case). These proxy to its super-admin GET/DELETE /ai-logs endpoint
// using the operator's Supabase access token (same staff-JWT pattern as fetchServerLogs).
// `instance` selects which backend (online / local) to poll — see instance-base.ts.

export type AiLogLevel = "info" | "warn" | "error";
// "reply" = a successful AI call. rate_limit/quota are the "model reached its
// limit" cases (HTTP 429 / 402); timeout/error are other failures.
export type AiLogKind = "reply" | "rate_limit" | "quota" | "timeout" | "error";

export interface AiLogTokens {
  prompt?: number;
  completion?: number;
  total?: number;
}

export interface AiLogEntry {
  id: number;
  ts: string;
  level: AiLogLevel;
  kind: AiLogKind;
  source?: string | null;
  conversationId?: string | null;
  userId?: string | null;
  userRole?: string | null;
  locale?: string | null;
  provider?: string | null;
  model?: string | null;
  statusCode?: number | null;
  message?: string | null;
  userMessage?: string | null;
  tokens?: AiLogTokens | null;
  latencyMs?: number | null;
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
export async function fetchAiLogs(
  since = 0,
  instance: ServerInstance = "online"
): Promise<{ logs: AiLogEntry[]; lastId: number; error: string | null }> {
  const token = await staffToken();
  if (!token) return { logs: [], lastId: since, error: "Not authorized" };
  try {
    // `_` cache-busts: prod nginx caches GETs without Cache-Control, and /ai-logs?since=0
    // is a fixed URL that would otherwise stay stuck on a cached empty response.
    const res = await fetch(`${resolveInstanceBase(instance)}/ai-logs?since=${since}&_=${Date.now()}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) {
      const j = (await res.json().catch(() => null)) as { error?: string } | null;
      return { logs: [], lastId: since, error: j?.error ?? `Request failed (${res.status})` };
    }
    const j = (await res.json()) as { logs?: AiLogEntry[]; lastId?: number };
    return {
      logs: Array.isArray(j.logs) ? j.logs : [],
      lastId: typeof j.lastId === "number" ? j.lastId : since,
      error: null,
    };
  } catch (e) {
    return { logs: [], lastId: since, error: (e as Error).message };
  }
}

export async function clearAiLogs(
  instance: ServerInstance = "online"
): Promise<{ error: string | null }> {
  const token = await staffToken();
  if (!token) return { error: "Not authorized" };
  try {
    const res = await fetch(`${resolveInstanceBase(instance)}/ai-logs`, {
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
