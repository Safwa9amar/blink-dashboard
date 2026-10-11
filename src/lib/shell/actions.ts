"use server";

import { getCurrentStaffRole } from "@/lib/auth/staff";
import type { AttentionCounts } from "@/lib/nav/modules";
import { getAttentionCounts } from "./attention";
import { loadRecord, searchAll } from "./search";
import type { RecordDetail, RecordKind, SearchGroup } from "./search-types";

// Every action re-resolves the staff role: the client is never trusted.

export async function refreshAttention(): Promise<AttentionCounts> {
  const role = await getCurrentStaffRole();
  if (!role) return {};
  return getAttentionCounts(role);
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
