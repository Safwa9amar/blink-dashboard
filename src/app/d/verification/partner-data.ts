import { cache } from "react";
import { getTranslations } from "next-intl/server";
import { requirePathAccess } from "@/lib/auth/staff";
import { createAdminClient, hasServiceRole } from "@/lib/supabase/admin";
import {
  agentViewCounts,
  buildAgentQueue,
  buildRiderQueue,
  RIDER_DOC_KEYS,
  riderPathsToSign,
  type AgentQueueLoad,
  type RiderQueueLoad,
  type RiderView,
} from "@/features/verification";

// Server-only reads for /riders/verification and /agents/verification, through
// the service-role client (rider_profiles.documents is service-role only, and
// agent shops under review are hidden by RLS). Each load gates on its own
// section first (/riders, /agents). Nothing is written here — see partner-action.ts.

/** Rows loaded per rider view; the exact totals come back alongside. */
const QUEUE_LIMIT = 100;
/** Signed preview links live this long — long enough to review, short enough not to be shared. */
const SIGNED_URL_TTL = 600;
const RIDER_BUCKET = "rider-documents";

type Admin = Awaited<ReturnType<typeof createAdminClient>>;

const USER = "users!{fk}(first_name, last_name, phone_number)";
const RIDER_SELECT = `user_id, rider_id, vehicle_type, documents, verification_status, created_at, updated_at, ${USER.replace("{fk}", "rider_profiles_user_id_fkey")}`;
const AGENT_PROFILE_SELECT = `user_id, agent_id, documents, created_at, updated_at, ${USER.replace("{fk}", "agent_profiles_user_id_fkey")}`;
const AGENT_SHOP_SELECT = `id, user_id, shop_name, phone_number, address, description, shop_image_url, documents, review_status, created_at, ${USER.replace("{fk}", "agent_shops_user_id_fkey")}`;

const NO_RIDERS: RiderQueueLoad = { items: [], error: null, counts: { pending: 0, replacements: 0, rejected: 0 } };
const NO_AGENTS: AgentQueueLoad = { items: [], error: null, counts: { pending: 0, rejected: 0 } };

const RIDER_DOCS: readonly string[] = RIDER_DOC_KEYS;
/** PostgREST `or` filter: any rider document is waiting on staff. */
const ANY_DOC_PENDING = RIDER_DOCS.map((k) => `documents->${k}->>status.eq.pending`).join(",");

async function loadRiders(db: Admin): Promise<RiderQueueLoad> {
  const list = () => db.from("rider_profiles").select(RIDER_SELECT, { count: "exact" });
  const [pending, rejected, replacements] = await Promise.all([
    list().eq("verification_status", "pending").order("created_at", { ascending: true }).limit(QUEUE_LIMIT),
    list().eq("verification_status", "rejected").order("updated_at", { ascending: false }).limit(QUEUE_LIMIT),
    // Approved riders stay approved while a replacement document waits for review.
    list()
      .eq("verification_status", "approved")
      .or(ANY_DOC_PENDING)
      .order("updated_at", { ascending: true })
      .limit(QUEUE_LIMIT),
  ]);
  const failed = pending.error ?? rejected.error ?? replacements.error;
  if (failed) return { ...NO_RIDERS, error: failed.message };

  const rows: unknown[] = [...(pending.data ?? []), ...(replacements.data ?? []), ...(rejected.data ?? [])];

  // The bucket is private: sign each object server-side. A failure only costs
  // that preview (the tile says "Preview unavailable"); legacy rows holding a
  // full URL in `path` are skipped here and shown as links.
  const signed = new Map<string, string>();
  const paths = riderPathsToSign(rows);
  if (paths.length > 0) {
    const { data } = await db.storage.from(RIDER_BUCKET).createSignedUrls(paths, SIGNED_URL_TTL);
    for (const entry of data ?? []) {
      if (entry.path && entry.signedUrl && !entry.error) signed.set(entry.path, entry.signedUrl);
    }
  }

  const counts: Record<RiderView, number> = {
    pending: pending.count ?? 0,
    replacements: replacements.count ?? 0,
    rejected: rejected.count ?? 0,
  };
  return { items: buildRiderQueue(rows, signed), error: null, counts };
}

const SHOP_STATUSES = ["under_review", "rejected"];
const DOC_STATUSES = ["pending", "rejected"];
/** An agent register scan is pending / rejected. */
const AGENT_DOC_FILTER = ["commercial_register_front", "commercial_register_back"]
  .flatMap((k) => DOC_STATUSES.map((s) => `documents->${k}->>status.eq.${s}`))
  .join(",");

async function loadAgents(db: Admin): Promise<AgentQueueLoad> {
  // Which agents have something to look at: a register scan pending / rejected, or a shop under review / rejected.
  const [withDocs, withShops] = await Promise.all([
    db.from("agent_profiles").select("user_id").or(AGENT_DOC_FILTER).order("updated_at", { ascending: true }).limit(QUEUE_LIMIT),
    db
      .from("agent_shops")
      .select("user_id")
      .in("review_status", SHOP_STATUSES)
      .order("created_at", { ascending: true })
      .limit(QUEUE_LIMIT),
  ]);
  const failed = withDocs.error ?? withShops.error;
  if (failed) return { ...NO_AGENTS, error: failed.message };

  const ids = [...new Set([...(withDocs.data ?? []), ...(withShops.data ?? [])].map((r) => r.user_id as string))];
  if (ids.length === 0) return NO_AGENTS;

  // Everything the cards show, for exactly those agents.
  const [profiles, shops] = await Promise.all([
    db.from("agent_profiles").select(AGENT_PROFILE_SELECT).in("user_id", ids),
    db.from("agent_shops").select(AGENT_SHOP_SELECT).in("user_id", ids).in("review_status", SHOP_STATUSES),
  ]);
  const failed2 = profiles.error ?? shops.error;
  if (failed2) return { ...NO_AGENTS, error: failed2.message };

  const items = buildAgentQueue(profiles.data ?? [], shops.data ?? []);
  return { items, error: null, counts: agentViewCounts(items) };
}

export const getRiderQueue = cache(async (): Promise<RiderQueueLoad> => {
  await requirePathAccess("/riders");
  if (!hasServiceRole()) return { ...NO_RIDERS, error: (await getTranslations("verification"))("service_role_missing") };
  return loadRiders(await createAdminClient());
});

export const getAgentQueue = cache(async (): Promise<AgentQueueLoad> => {
  await requirePathAccess("/agents");
  if (!hasServiceRole()) return { ...NO_AGENTS, error: (await getTranslations("verification"))("service_role_missing") };
  return loadAgents(await createAdminClient());
});
