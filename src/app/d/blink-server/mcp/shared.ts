// Pure, client-safe helpers + types for the staff MCP access-token tab.

export const MCP_ENDPOINT = "https://blink-server-q4ey.onrender.com/mcp";
export const MCP_ENDPOINT_SPARE = "https://blink-server-spare.onrender.com/mcp";
export const TOKEN_PREFIX = "blk_mcp_";
export const PREFIX_DISPLAY_LEN = 12;
export const MAX_ACTIVE_TOKENS = 10;
export const NAME_MAX = 60;
export const EXPIRY_OPTIONS = [30, 90, 365, null] as const;
export type ExpiryDays = (typeof EXPIRY_OPTIONS)[number];

export type McpTokenStatus = "active" | "expired" | "revoked";

export interface McpTokenRow {
  id: string;
  user_id: string;
  name: string;
  token_prefix: string;
  last_used_at: string | null;
  expires_at: string | null;
  revoked_at: string | null;
  created_at: string;
  owner_name: string | null;
  owner_email: string | null;
}

export interface McpAuditRow {
  id: number;
  tool: string;
  ok: boolean;
  error: string | null;
  row_count: number | null;
  duration_ms: number | null;
  created_at: string;
  token_name: string | null;
  owner_name: string | null;
}

export interface McpListResult<T> {
  data: T | null;
  error: string | null;
  /** True when the staff_mcp_* tables don't exist yet (migration pending). */
  migrationPending?: boolean;
}

export function isExpiryDays(v: unknown): v is ExpiryDays {
  return v === null || v === 30 || v === 90 || v === 365;
}

/** ISO expiry timestamp `days` after `now`, or null for "never". */
export function computeExpiry(days: ExpiryDays, now: Date = new Date()): string | null {
  if (days === null) return null;
  return new Date(now.getTime() + days * 86_400_000).toISOString();
}

export function deriveStatus(
  t: { revoked_at: string | null; expires_at: string | null },
  now: Date = new Date()
): McpTokenStatus {
  if (t.revoked_at) return "revoked";
  if (t.expires_at && new Date(t.expires_at).getTime() <= now.getTime()) return "expired";
  return "active";
}

/** Postgres undefined_table / PostgREST schema-cache miss → migration not applied. */
export function isMissingTable(err: { code?: string } | null | undefined): boolean {
  return err?.code === "42P01" || err?.code === "PGRST205";
}
