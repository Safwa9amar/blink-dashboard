// Server-only (service-role client): import from server code and server actions only.
import { canAccessPath, type StaffRole } from "@/lib/auth/access";
import { MODULES, type AttentionCounts, type AttentionKey } from "@/lib/nav/modules";
import { createAdminClient } from "@/lib/supabase/admin";
import { getMerchantDues } from "@/app/d/blink-cash/data";

type Admin = Awaited<ReturnType<typeof createAdminClient>>;

const HEAD = { count: "exact", head: true } as const;

async function countOf(q: PromiseLike<{ count: number | null; error: { message: string } | null }>): Promise<number> {
  const { count, error } = await q;
  if (error) throw new Error(error.message);
  return count ?? 0;
}

const SOURCES: Record<AttentionKey, (db: Admin) => Promise<number>> = {
  storesPending: (db) => countOf(db.from("stores").select("id", HEAD).eq("status", "under_review")),
  productsPending: (db) => countOf(db.from("store_products").select("id", HEAD).eq("review_status", "pending")),
  packsPending: (db) => countOf(db.from("store_packs").select("id", HEAD).eq("status", "under_review")),
  deletionPending: (db) => countOf(db.from("account_deletion_requests").select("id", HEAD).eq("status", "pending")),
  supportUnread: (db) => countOf(db.from("support_conversations").select("id", HEAD).gt("unread_for_staff", 0)),
  alertsOpen: (db) => countOf(db.from("alert_events").select("id", HEAD).is("resolved_at", null)),
  duesOutstanding: async () => {
    const { summary, error } = await getMerchantDues();
    if (!summary) throw new Error(error ?? "dues unavailable");
    return summary.owing.filter((d) => d.outstanding > 0).length;
  },
};

/** Which attention keys the role may see: those whose page it can open. */
export function attentionKeysFor(role: StaffRole): AttentionKey[] {
  const keys = new Set<AttentionKey>();
  for (const m of MODULES) for (const p of m.pages) if (p.attention && canAccessPath(role, p.href)) p.attention.forEach((k) => keys.add(k));
  return [...keys];
}

/** Counts of work waiting on staff. A failing source leaves its key undefined (no badge). */
export async function getAttentionCounts(role: StaffRole): Promise<AttentionCounts> {
  const keys = attentionKeysFor(role);
  if (keys.length === 0) return {};
  const db = await createAdminClient();
  const settled = await Promise.allSettled(keys.map((k) => SOURCES[k](db)));
  const out: AttentionCounts = {};
  settled.forEach((r, i) => {
    if (r.status === "fulfilled") out[keys[i]] = r.value;
    else console.error(`[attention] ${keys[i]} failed:`, r.reason);
  });
  return out;
}
