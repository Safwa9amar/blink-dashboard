"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getCurrentStaffRole } from "@/lib/auth/staff";
import { generateToken, hashToken, tokenPrefix } from "./token";
import {
  MAX_ACTIVE_TOKENS,
  NAME_MAX,
  computeExpiry,
  isExpiryDays,
  isMissingTable,
  type ExpiryDays,
  type McpAuditRow,
  type McpListResult,
  type McpTokenRow,
} from "./shared";

// Blink Server → MCP access. Any staff member manages their OWN tokens; only
// super_admin sees/revokes everyone's. Rows are written with the service-role client
// (the tables are RLS deny-by-default). The plaintext token is returned once from
// createMcpToken and never stored or logged — only its sha256 hex is persisted.
const PATH = "/d/blink-server/mcp";
const MIGRATION_PENDING = "migration_pending";

async function actor(): Promise<{ id: string; isSuper: boolean } | null> {
  const role = await getCurrentStaffRole();
  if (!role) return null;
  const {
    data: { user },
  } = await (await createClient()).auth.getUser();
  return user ? { id: user.id, isSuper: role === "super_admin" } : null;
}

type Owner = { first_name: string | null; last_name: string | null; email: string | null };
const ownerName = (o: Owner | undefined) =>
  o ? [o.first_name, o.last_name].filter(Boolean).join(" ") || null : null;

async function loadOwners(ids: string[]): Promise<Map<string, Owner>> {
  const map = new Map<string, Owner>();
  if (!ids.length) return map;
  const supabase = await createAdminClient();
  const { data } = await supabase
    .from("users")
    .select("id, first_name, last_name, email")
    .in("id", [...new Set(ids)]);
  for (const u of (data ?? []) as (Owner & { id: string })[]) map.set(u.id, u);
  return map;
}

export async function listMcpTokens(): Promise<McpListResult<McpTokenRow[]>> {
  try {
    const me = await actor();
    if (!me) return { data: null, error: "not_authorized" };
    const supabase = await createAdminClient();
    let q = supabase
      .from("staff_mcp_tokens")
      .select("id, user_id, name, token_prefix, last_used_at, expires_at, revoked_at, created_at")
      .order("created_at", { ascending: false });
    if (!me.isSuper) q = q.eq("user_id", me.id);
    const { data, error } = await q;
    if (error) {
      return isMissingTable(error)
        ? { data: null, error: MIGRATION_PENDING, migrationPending: true }
        : { data: null, error: "unexpected" };
    }
    const rows = (data ?? []) as Omit<McpTokenRow, "owner_name" | "owner_email">[];
    const owners = me.isSuper ? await loadOwners(rows.map((r) => r.user_id)) : new Map();
    return {
      data: rows.map((r) => ({
        ...r,
        owner_name: ownerName(owners.get(r.user_id)),
        owner_email: owners.get(r.user_id)?.email ?? null,
      })),
      error: null,
    };
  } catch {
    return { data: null, error: "unexpected" };
  }
}

export async function createMcpToken(input: {
  name: string;
  expiresInDays: ExpiryDays;
}): Promise<{ data: { token: string; row: McpTokenRow } | null; error: string | null }> {
  try {
    const me = await actor();
    if (!me) return { data: null, error: "not_authorized" };
    const name = (input.name ?? "").trim();
    if (name.length < 1 || name.length > NAME_MAX) return { data: null, error: "invalid_name" };
    if (!isExpiryDays(input.expiresInDays)) return { data: null, error: "invalid_expiry" };

    const supabase = await createAdminClient();
    const nowIso = new Date().toISOString();
    const { count, error: cErr } = await supabase
      .from("staff_mcp_tokens")
      .select("id", { count: "exact", head: true })
      .eq("user_id", me.id)
      .is("revoked_at", null)
      .or(`expires_at.is.null,expires_at.gt.${nowIso}`);
    if (cErr) return { data: null, error: isMissingTable(cErr) ? MIGRATION_PENDING : "unexpected" };
    if ((count ?? 0) >= MAX_ACTIVE_TOKENS) return { data: null, error: "too_many_tokens" };

    const token = generateToken();
    const { data, error } = await supabase
      .from("staff_mcp_tokens")
      .insert({
        user_id: me.id,
        name,
        token_hash: hashToken(token),
        token_prefix: tokenPrefix(token),
        expires_at: computeExpiry(input.expiresInDays),
      })
      .select("id, user_id, name, token_prefix, last_used_at, expires_at, revoked_at, created_at")
      .single();
    if (error || !data) {
      return { data: null, error: isMissingTable(error) ? MIGRATION_PENDING : "unexpected" };
    }
    revalidatePath(PATH);
    return {
      data: { token, row: { ...(data as McpTokenRow), owner_name: null, owner_email: null } },
      error: null,
    };
  } catch {
    return { data: null, error: "unexpected" };
  }
}

export async function revokeMcpToken(id: string): Promise<{ data: true | null; error: string | null }> {
  try {
    const me = await actor();
    if (!me) return { data: null, error: "not_authorized" };
    const supabase = await createAdminClient();
    let q = supabase
      .from("staff_mcp_tokens")
      .update({ revoked_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq("id", id)
      .is("revoked_at", null);
    if (!me.isSuper) q = q.eq("user_id", me.id);
    const { data, error } = await q.select("id");
    if (error) return { data: null, error: isMissingTable(error) ? MIGRATION_PENDING : "unexpected" };
    if (!data?.length) return { data: null, error: "not_found" };
    revalidatePath(PATH);
    return { data: true, error: null };
  } catch {
    return { data: null, error: "unexpected" };
  }
}

export async function listMcpAudit(
  opts: { limit?: number } = {}
): Promise<McpListResult<McpAuditRow[]>> {
  try {
    const me = await actor();
    if (!me) return { data: null, error: "not_authorized" };
    const limit = Math.min(Math.max(opts.limit ?? 100, 1), 100);
    const supabase = await createAdminClient();
    let q = supabase
      .from("staff_mcp_audit")
      .select("id, token_id, user_id, tool, ok, error, row_count, duration_ms, created_at")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (!me.isSuper) q = q.eq("user_id", me.id);
    const { data, error } = await q;
    if (error) {
      return isMissingTable(error)
        ? { data: null, error: MIGRATION_PENDING, migrationPending: true }
        : { data: null, error: "unexpected" };
    }
    const rows = (data ?? []) as {
      id: number;
      token_id: string | null;
      user_id: string | null;
      tool: string;
      ok: boolean;
      error: string | null;
      row_count: number | null;
      duration_ms: number | null;
      created_at: string;
    }[];
    const tokenIds = [...new Set(rows.map((r) => r.token_id).filter((v): v is string => !!v))];
    const names = new Map<string, string>();
    if (tokenIds.length) {
      const { data: toks } = await supabase.from("staff_mcp_tokens").select("id, name").in("id", tokenIds);
      for (const tk of (toks ?? []) as { id: string; name: string }[]) names.set(tk.id, tk.name);
    }
    const owners = me.isSuper
      ? await loadOwners(rows.map((r) => r.user_id).filter((v): v is string => !!v))
      : new Map();
    return {
      data: rows.map((r) => ({
        id: r.id,
        tool: r.tool,
        ok: r.ok,
        error: r.error,
        row_count: r.row_count,
        duration_ms: r.duration_ms,
        created_at: r.created_at,
        token_name: r.token_id ? (names.get(r.token_id) ?? null) : null,
        owner_name: r.user_id ? ownerName(owners.get(r.user_id)) : null,
      })),
      error: null,
    };
  } catch {
    return { data: null, error: "unexpected" };
  }
}
