"use server";

import { getCurrentStaff, getCurrentStaffRole } from "@/lib/auth/staff";
import type { AttentionCounts } from "@/lib/nav/modules";
import { getAttentionCounts } from "./attention";
import { getInboxPage, getInboxSnapshot, markInboxAllRead, markInboxRead } from "./inbox";
import { INBOX_CATEGORIES } from "./inbox-kinds";
import type { InboxPage, InboxQuery, InboxSnapshot } from "./inbox-types";
import { loadRecord, searchAll } from "./search";
import type { RecordDetail, RecordKind, SearchGroup } from "./search-types";

// Every action re-resolves the staff role: the client is never trusted.

export async function refreshAttention(): Promise<AttentionCounts> {
  const role = await getCurrentStaffRole();
  if (!role) return {};
  return getAttentionCounts(role);
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function refreshInbox(): Promise<InboxSnapshot> {
  const staff = await getCurrentStaff();
  if (!staff) return { items: [], unread: 0 };
  return getInboxSnapshot(staff.id, staff.role);
}

export async function loadInboxPage(q: InboxQuery): Promise<InboxPage> {
  const staff = await getCurrentStaff();
  if (!staff) return { items: [], more: false };
  const before =
    q.before && typeof q.before.at === "string" && !Number.isNaN(Date.parse(q.before.at)) && UUID.test(q.before.id)
      ? { at: q.before.at, id: q.before.id }
      : undefined;
  return getInboxPage(staff.id, staff.role, {
    category: INBOX_CATEGORIES.find((c) => c === q.category),
    unreadOnly: q.unreadOnly === true,
    limit: typeof q.limit === "number" ? q.limit : undefined,
    before,
  });
}

export async function markNotificationsRead(ids: string[]): Promise<{ ok: boolean }> {
  const staff = await getCurrentStaff();
  if (!staff || !Array.isArray(ids)) return { ok: false };
  try {
    await markInboxRead(staff.id, ids.filter((id) => typeof id === "string" && UUID.test(id)).slice(0, 200));
    return { ok: true };
  } catch (e) {
    console.error("[inbox] mark read failed:", e);
    return { ok: false };
  }
}

export async function markAllNotificationsRead(): Promise<{ ok: boolean }> {
  const staff = await getCurrentStaff();
  if (!staff) return { ok: false };
  try {
    await markInboxAllRead(staff.id);
    return { ok: true };
  } catch (e) {
    console.error("[inbox] mark all read failed:", e);
    return { ok: false };
  }
}

export async function searchRecords(q: string): Promise<SearchGroup[]> {
  const role = await getCurrentStaffRole();
  if (!role || typeof q !== "string") return [];
  return searchAll(role, q.slice(0, 100));
}

const KINDS: readonly RecordKind[] = ["order", "transaction", "person", "store"];

export async function getRecord(kind: RecordKind, id: string): Promise<RecordDetail | null> {
  const role = await getCurrentStaffRole();
  if (!role || !KINDS.includes(kind) || typeof id !== "string") return null;
  return loadRecord(role, kind, id);
}
