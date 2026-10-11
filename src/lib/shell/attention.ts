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

/** PostgREST `or` filter: an agent's commercial register scan is waiting on staff. */
const AGENT_DOC_PENDING = ["commercial_register_front", "commercial_register_back"]
  .map((k) => `documents->${k}->>status.eq.pending`)
  .join(",");

/**
 * Agents waiting on staff, the same definition as the agents verification
 * queue ("pending" view): a register scan pending, or a shop under review.
 * One agent with both counts once, so the user ids are unioned.
 */
async function agentsWaiting(db: Admin): Promise<number> {
  const [docs, shops] = await Promise.all([
    db.from("agent_profiles").select("user_id").or(AGENT_DOC_PENDING),
    db.from("agent_shops").select("user_id").eq("review_status", "under_review"),
  ]);
  const failed = docs.error ?? shops.error;
  if (failed) throw new Error(failed.message);
  return new Set([...(docs.data ?? []), ...(shops.data ?? [])].map((r) => r.user_id as string)).size;
}

const SOURCES: Record<AttentionKey, (db: Admin) => Promise<number>> = {
  storesPending: (db) => countOf(db.from("stores").select("id", HEAD).eq("status", "under_review")),
  ridersPending: (db) => countOf(db.from("rider_profiles").select("user_id", HEAD).eq("verification_status", "pending")),
  agentsPending: agentsWaiting,
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
