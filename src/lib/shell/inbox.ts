// Server-only (service-role client): import from server code and server actions only.
//
// Reads and marks the staff inbox through the blink-server RPCs (staff_inbox,
// staff_inbox_unread, staff_inbox_mark_read, staff_inbox_mark_all_read). Rows are
// filtered to the kinds the role may see (inbox-kinds.ts) before paging, so a role
// never pages through rows it can't open.
import type { StaffRole } from "@/lib/auth/access";
import { createAdminClient } from "@/lib/supabase/admin";
import { inboxKindsFor } from "./inbox-kinds";
import type { InboxItem, InboxPage, InboxQuery, InboxSeverity, InboxSnapshot } from "./inbox-types";

const BELL_SIZE = 15;
const PAGE_SIZE = 30;

interface Row {
  id: string;
  kind: string;
  severity: string;
  entity_id: string | null;
  params: Record<string, unknown> | null;
  summary: string;
  occurrences: number;
  last_at: string;
  unread: boolean;
}

const SEVERITIES: readonly InboxSeverity[] = ["info", "warning", "critical"];

/** Keeps only string / number params (the copy's ICU arguments). */
function cleanParams(raw: Record<string, unknown> | null): Record<string, string | number> {
  const out: Record<string, string | number> = {};
  for (const [k, v] of Object.entries(raw ?? {})) {
    if (typeof v === "string" || typeof v === "number") out[k] = v;
  }
  return out;
}

function toItem(r: Row): InboxItem {
  return {
    id: r.id,
    kind: r.kind,
    severity: SEVERITIES.includes(r.severity as InboxSeverity) ? (r.severity as InboxSeverity) : "info",
    entityId: r.entity_id,
    params: cleanParams(r.params),
    summary: r.summary,
    count: r.occurrences,
    at: r.last_at,
    unread: r.unread,
  };
}

async function fetchRows(userId: string, role: StaffRole, q: InboxQuery): Promise<InboxItem[]> {
  const kinds = inboxKindsFor(role, q.category);
  if (kinds && kinds.length === 0) return [];
  const db = await createAdminClient();
  const { data, error } = await db.rpc("staff_inbox", {
    p_user: userId,
    p_kinds: kinds,
    p_unread_only: q.unreadOnly ?? false,
    p_limit: q.limit ?? PAGE_SIZE,
    p_before_at: q.before?.at ?? null,
    p_before_id: q.before?.id ?? null,
  });
  if (error) throw new Error(error.message);
  return ((data ?? []) as Row[]).map(toItem);
}

async function unreadCount(userId: string, role: StaffRole): Promise<number> {
  const kinds = inboxKindsFor(role);
  if (kinds && kinds.length === 0) return 0;
  const db = await createAdminClient();
  const { data, error } = await db.rpc("staff_inbox_unread", { p_user: userId, p_kinds: kinds });
  if (error) throw new Error(error.message);
  return typeof data === "number" ? data : 0;
}

/** The bell: latest rows + unread total. Never throws (a failure comes back as `error`). */
export async function getInboxSnapshot(userId: string, role: StaffRole): Promise<InboxSnapshot> {
  try {
    const [items, unread] = await Promise.all([fetchRows(userId, role, { limit: BELL_SIZE }), unreadCount(userId, role)]);
    return { items, unread };
  } catch (e) {
    console.error("[inbox] snapshot failed:", e);
    return { items: [], unread: 0, error: e instanceof Error ? e.message : "inbox unavailable" };
  }
}

/** One page of the /inbox list. Never throws. */
export async function getInboxPage(userId: string, role: StaffRole, q: InboxQuery): Promise<InboxPage> {
  const limit = Math.min(Math.max(q.limit ?? PAGE_SIZE, 1), 100);
  try {
    const items = await fetchRows(userId, role, { ...q, limit });
    return { items, more: items.length === limit };
  } catch (e) {
    console.error("[inbox] page failed:", e);
    return { items: [], more: false, error: e instanceof Error ? e.message : "inbox unavailable" };
  }
}

export async function markInboxRead(userId: string, ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const db = await createAdminClient();
  const { error } = await db.rpc("staff_inbox_mark_read", { p_user: userId, p_ids: ids });
  if (error) throw new Error(error.message);
}

export async function markInboxAllRead(userId: string): Promise<void> {
  const db = await createAdminClient();
  const { error } = await db.rpc("staff_inbox_mark_all_read", { p_user: userId });
  if (error) throw new Error(error.message);
}
