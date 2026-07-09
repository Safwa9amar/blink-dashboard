"use server";

import { hasStaffRole } from "@/lib/auth/staff";
import { createClient } from "@/lib/supabase/server";
import type { ServerInstance } from "@/features/blink-server";
import { resolveInstanceBase } from "./instance-base";

// Blink Server → Health. Proxies to the blink-server super-admin GET /metrics with the
// operator's Supabase access token (same staff-JWT pattern as the log actions).
// `instance` selects which backend (online / local) to poll — see instance-base.ts.
// Keep this shape in sync with blink-server's MetricsSnapshot (src/lib/metrics.ts).
export interface LatencyBucket {
  offsetMin: number; // 0 = current minute, -1 … -9 = minutes ago (localized client-side)
  p50: number;
  p95: number;
  count: number;
}

export interface StatusBreakdown {
  c2xx: number;
  c3xx: number;
  c4xx: number;
  c5xx: number;
}

export interface HostStats {
  memUsed: number;
  memTotal: number;
  cpuCount: number;
  loadAvg: number[];
  diskUsed: number;
  diskTotal: number;
  sysUptimeMs: number;
  node: string;
  platform: string;
}

export interface MetricsSnapshot {
  uptimeMs: number;
  rss: number;
  heapUsed: number;
  heapTotal: number;
  cpuPct: number;
  eventLoopLagMs: number;
  reqPerMin: number;
  errorRatePct: number;
  avgLatencyMs: number;
  latencyBuckets: LatencyBucket[];
  statusCodes: StatusBreakdown;
  host: HostStats;
}

async function staffToken(): Promise<string | null> {
  if (!(await hasStaffRole("super_admin"))) return null;
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

export async function fetchServerMetrics(
  instance: ServerInstance = "online"
): Promise<{ metrics: MetricsSnapshot | null; error: string | null }> {
  const token = await staffToken();
  if (!token) return { metrics: null, error: "Not authorized" };
  try {
    const res = await fetch(`${resolveInstanceBase(instance)}/metrics?_=${Date.now()}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) {
      const j = (await res.json().catch(() => null)) as { error?: string } | null;
      return { metrics: null, error: j?.error ?? `Request failed (${res.status})` };
    }
    const j = (await res.json()) as { metrics?: MetricsSnapshot };
    return { metrics: j.metrics ?? null, error: null };
  } catch (e) {
    return { metrics: null, error: (e as Error).message };
  }
}

// ── Traffic analytics (Blink Server → Traffic). Keep in sync with the server's
// TrafficSnapshot (blink-server src/lib/metrics.ts). ─────────────────────────
export type TrafficRange = "15m" | "1h" | "24h";

export interface TopEndpoint {
  method: string;
  route: string;
  hits: number;
  avgMs: number;
  errPct: number;
}
export interface VolumePoint {
  offsetMin: number;
  count: number;
}
export interface TrafficSnapshot {
  rangeMin: number;
  totalRequests: number;
  avgRps: number;
  errorRatePct: number;
  distinctRoutes: number;
  statusCodes: StatusBreakdown;
  topEndpoints: TopEndpoint[];
  volume: VolumePoint[];
}

export async function fetchServerTraffic(
  range: TrafficRange = "1h",
  instance: ServerInstance = "online"
): Promise<{ traffic: TrafficSnapshot | null; error: string | null }> {
  const token = await staffToken();
  if (!token) return { traffic: null, error: "Not authorized" };
  try {
    const res = await fetch(
      `${resolveInstanceBase(instance)}/metrics/traffic?range=${range}&_=${Date.now()}`,
      {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) {
      const j = (await res.json().catch(() => null)) as { error?: string } | null;
      return { traffic: null, error: j?.error ?? `Request failed (${res.status})` };
    }
    const j = (await res.json()) as { traffic?: TrafficSnapshot };
    return { traffic: j.traffic ?? null, error: null };
  } catch (e) {
    return { traffic: null, error: (e as Error).message };
  }
}

// ── AI Insights (Blink Server → AI Insights). Keep in sync with the server's
// AiMetricsSnapshot (blink-server src/lib/ai-log.ts). ────────────────────────
export interface AiModelStat {
  model: string;
  provider: string | null;
  calls: number;
  limitHits: number;
  errPct: number;
  avgMs: number;
  promptTokens: number;
  completionTokens: number;
  costUsd: number;
  status: "ok" | "degraded";
}
export interface AiMetricsSnapshot {
  totalCalls: number;
  replies: number;
  failures: number;
  limitHits: number;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estCostUsd: number;
  avgLatencyMs: number;
  models: AiModelStat[];
}

export async function fetchAiMetrics(
  instance: ServerInstance = "online"
): Promise<{ aiMetrics: AiMetricsSnapshot | null; error: string | null }> {
  const token = await staffToken();
  if (!token) return { aiMetrics: null, error: "Not authorized" };
  try {
    const res = await fetch(`${resolveInstanceBase(instance)}/metrics/ai?_=${Date.now()}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) {
      const j = (await res.json().catch(() => null)) as { error?: string } | null;
      return { aiMetrics: null, error: j?.error ?? `Request failed (${res.status})` };
    }
    const j = (await res.json()) as { aiMetrics?: AiMetricsSnapshot };
    return { aiMetrics: j.aiMetrics ?? null, error: null };
  } catch (e) {
    return { aiMetrics: null, error: (e as Error).message };
  }
}
