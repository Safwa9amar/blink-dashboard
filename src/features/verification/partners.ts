// Riders and agents in the verification queue: view models, pure row mappers and
// display helpers. No I/O — the server loaders (src/app/d/verification/partner-data.ts)
// fetch the rows and hand them here. Safe to import from server and client code.
//
// Rows come straight from PostgREST and their jsonb columns are whatever the
// app wrote, so every read is type-checked.
import type { ReviewDocState, TFn } from "./types";

// ─── Rider documents (rider_profiles.documents) ──────────────────────
// Mirrors blink-server src/lib/rider-verification.ts — keep in sync by hand.
export const RIDER_DOC_KEYS = [
  "license_front",
  "license_back",
  "id_front",
  "id_back",
  "gray_card_front",
  "gray_card_back",
  "insurance",
] as const;
export type RiderDocKey = (typeof RIDER_DOC_KEYS)[number];

export type RiderDocGroup = "identity" | "licence" | "vehicle";
/** Display order of the tile groups. */
export const RIDER_DOC_GROUPS: readonly RiderDocGroup[] = ["identity", "licence", "vehicle"];

export function riderDocGroup(key: RiderDocKey): RiderDocGroup {
  if (key.startsWith("id_")) return "identity";
  if (key.startsWith("license_")) return "licence";
  return "vehicle";
}

/** A bicycle rider only needs the national ID; every other vehicle needs all documents. */
export function isRiderDocRequired(vehicleType: string | null, key: RiderDocKey): boolean {
  return vehicleType === "bicycle" ? riderDocGroup(key) === "identity" : true;
}

/** rider_profiles.verification_status values the queue reads. */
export type RiderVerificationStatus = "not_submitted" | "pending" | "approved" | "rejected";

/**
 * The rider queue's views (filter pills):
 * - `pending`      — every document is in, none decided yet / some still to decide
 * - `replacements` — an approved rider whose replacement document awaits review
 * - `rejected`     — a document was rejected; the rider has to upload a new one
 */
export const RIDER_VIEWS = ["pending", "replacements", "rejected"] as const;
export type RiderView = (typeof RIDER_VIEWS)[number];

/** A rider's rejection note is capped by blink-server (reviewRiderDocumentSchema). */
export const RIDER_NOTE_MAX = 200;
/** An agent's document rejection reason is capped by blink-server (reviewAgentDocumentSchema). */
export const AGENT_REASON_MAX = 300;

export interface RiderDocSlot {
  key: RiderDocKey;
  /** The stored object path (or a legacy full URL) the reviewer is looking at — sent back with the verdict. null when not uploaded. */
  path: string | null;
  /** Signed (short-lived) URL for a private object; the legacy URL itself otherwise; null when missing or unsignable. */
  url: string | null;
  /** `url` is a signed URL from our own storage, so it may be previewed inline. */
  trusted: boolean;
  isPdf: boolean;
  status: ReviewDocState;
  note: string | null;
  uploadedAt: string | null;
  group: RiderDocGroup;
  /** false for a bicycle rider's licence and vehicle documents (they only need the national ID). */
  required: boolean;
}

export interface RiderQueueItem {
  /** The rider's user id (the staff endpoint's `{id}`). */
  id: string;
  /** Display id, e.g. "BK-RR-100001". */
  riderId: string;
  name: string;
  phone: string | null;
  vehicle: string | null;
  view: RiderView;
  status: RiderVerificationStatus;
  docs: RiderDocSlot[];
  submittedAt: string;
  updatedAt: string;
}

export interface RiderQueueLoad {
  items: RiderQueueItem[];
  error: string | null;
  /** Exact totals per view (each list is capped). */
  counts: Record<RiderView, number>;
}

// ─── Agents (agent_profiles + agent_shops) ───────────────────────────
export const AGENT_VIEWS = ["pending", "rejected"] as const;
export type AgentView = (typeof AGENT_VIEWS)[number];

export const AGENT_DOC_KEYS = ["commercial_register_front", "commercial_register_back"] as const;
export type AgentDocKey = (typeof AGENT_DOC_KEYS)[number];

export type AgentShopStatus = "under_review" | "active" | "rejected";

export interface AgentDocSlot {
  key: AgentDocKey;
  url: string | null;
  /** A public object in our `agent` bucket, so it may be previewed inline. */
  trusted: boolean;
  isPdf: boolean;
  status: ReviewDocState;
  reason: string | null;
}

/** A view-only file (shop photo, shop register scan). */
export interface AgentShopFile {
  /** Translation key under verification.partners.shop_file.* */
  key: string;
  url: string;
  trusted: boolean;
  isPdf: boolean;
}

export interface AgentShopItem {
  id: string;
  name: string;
  status: Exclude<AgentShopStatus, "active">;
  phone: string | null;
  address: string | null;
  description: string | null;
  nif: string | null;
  nis: string | null;
  files: AgentShopFile[];
  submittedAt: string;
}

export interface AgentQueueItem {
  /** The agent's user id (the staff endpoint's `{id}` for documents). */
  id: string;
  /** Display id, e.g. "BK-AG-100023". null when the agent has no profile row yet. */
  agentId: string | null;
  name: string;
  phone: string | null;
  view: AgentView;
  docs: AgentDocSlot[];
  nif: string | null;
  nis: string | null;
  /** Shops under review or rejected. */
  shops: AgentShopItem[];
  submittedAt: string;
  updatedAt: string;
}

export interface AgentQueueLoad {
  items: AgentQueueItem[];
  error: string | null;
  counts: Record<AgentView, number>;
}

export interface PartnerQueues {
  riders: RiderQueueLoad;
  agents: AgentQueueLoad;
}

// ─── Review actions ──────────────────────────────────────────────────
export type PartnerVerdict = "verified" | "rejected";

export interface RiderDocTarget {
  riderId: string;
  document: RiderDocKey;
  /** The stored path the reviewer saw — blink-server answers 409 `stale_review` if the rider replaced it since. */
  path: string;
}

export interface AgentDocTarget {
  agentId: string;
  document: AgentDocKey;
}

export type ShopDecision = "approve" | "reject";

// ─── Defensive readers ───────────────────────────────────────────────
type Rec = Record<string, unknown>;
const isRecord = (v: unknown): v is Rec => !!v && typeof v === "object" && !Array.isArray(v);
const text = (v: unknown): string | null => (typeof v === "string" && v.trim()) || null;
const time = (iso: unknown): number => {
  const ms = typeof iso === "string" ? Date.parse(iso) : NaN;
  return Number.isNaN(ms) ? 0 : ms;
};
const docStatus = (v: unknown): ReviewDocState =>
  v === "verified" || v === "rejected" || v === "pending" ? v : "pending";
const isPdf = (url: string) => (url.split("?")[0] ?? "").toLowerCase().endsWith(".pdf");
const isFullUrl = (v: string) => /^https?:\/\//i.test(v);

function userName(user: unknown): string {
  if (!isRecord(user)) return "";
  return [text(user.first_name), text(user.last_name)].filter(Boolean).join(" ");
}
const userPhone = (user: unknown): string | null => (isRecord(user) ? text(user.phone_number) : null);

/** A public object in `bucket` of our own Supabase project (https, our origin, no credentials). */
export function checkPublicUrl(
  raw: unknown,
  bucket: string,
  origin: string | null = supabaseOrigin()
): { url: string; trusted: boolean } | null {
  const value = text(raw);
  if (!value) return null;
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return { url: value, trusted: false };
  }
  const prefix = `/storage/v1/object/public/${bucket}/`;
  const trusted =
    !!origin &&
    parsed.protocol === "https:" &&
    parsed.origin === origin &&
    !parsed.username &&
    !parsed.password &&
    parsed.pathname.startsWith(prefix) &&
    parsed.pathname.length > prefix.length;
  return trusted ? { url: parsed.href, trusted } : { url: value, trusted: false };
}

function supabaseOrigin(): string | null {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").origin;
  } catch {
    return null;
  }
}

// ─── Riders ──────────────────────────────────────────────────────────
/** Object paths to sign for these rows (legacy full URLs are skipped — they're shown as links). */
export function riderPathsToSign(rows: readonly unknown[]): string[] {
  const paths = new Set<string>();
  for (const row of rows) {
    const docs = isRecord(row) && isRecord(row.documents) ? row.documents : {};
    for (const key of RIDER_DOC_KEYS) {
      const entry = docs[key];
      const path = isRecord(entry) ? text(entry.path) : null;
      if (path && !isFullUrl(path)) paths.add(path);
    }
  }
  return [...paths];
}

/** The view a rider row belongs in, or null when it isn't reviewable. */
export function riderViewOf(status: unknown, docs: readonly Pick<RiderDocSlot, "status">[]): RiderView | null {
  if (status === "rejected") return "rejected";
  if (status === "pending") return "pending";
  if (status === "approved" && docs.some((d) => d.status === "pending")) return "replacements";
  return null;
}

/**
 * Rider rows → queue items. `signed` maps an object path to its signed URL
 * (missing = couldn't be signed → no preview). A malformed row is dropped
 * rather than taking the queue down.
 */
export function buildRiderQueue(rows: readonly unknown[], signed: ReadonlyMap<string, string>): RiderQueueItem[] {
  const items: RiderQueueItem[] = [];
  for (const row of rows) {
    if (!isRecord(row) || typeof row.user_id !== "string") continue;
    const stored = isRecord(row.documents) ? row.documents : {};
    const vehicle = text(row.vehicle_type);
    const docs: RiderDocSlot[] = RIDER_DOC_KEYS.map((key) => {
      const required = isRiderDocRequired(vehicle, key);
      const group = riderDocGroup(key);
      const entry = stored[key];
      const path = isRecord(entry) ? text(entry.path) : null;
      if (!isRecord(entry) || !path) {
        return { key, group, path: null, url: null, trusted: false, isPdf: false, status: "missing", note: null, uploadedAt: null, required };
      }
      const legacy = isFullUrl(path);
      const url = legacy ? path : (signed.get(path) ?? null);
      const status = docStatus(entry.status);
      return {
        key,
        group,
        path,
        url,
        trusted: !legacy && !!url,
        isPdf: isPdf(path),
        status,
        note: status === "rejected" ? text(entry.note) : null,
        uploadedAt: text(entry.uploaded_at),
        required,
      };
    });
    const status = (row.verification_status as RiderVerificationStatus) ?? "not_submitted";
    const view = riderViewOf(status, docs);
    if (!view) continue;
    items.push({
      id: row.user_id,
      riderId: text(row.rider_id) ?? "",
      name: userName(row.users),
      phone: userPhone(row.users),
      vehicle,
      view,
      status,
      docs,
      submittedAt: text(row.created_at) ?? "",
      updatedAt: text(row.updated_at) ?? "",
    });
  }
  return items;
}

/** Oldest first for work waiting on staff, latest first for the rejected list. */
export function ridersInView(items: readonly RiderQueueItem[], view: RiderView): RiderQueueItem[] {
  return items
    .filter((r) => r.view === view)
    .sort((a, b) => (view === "rejected" ? time(b.updatedAt) - time(a.updatedAt) : time(a.submittedAt) - time(b.submittedAt)));
}

// ─── Agents ──────────────────────────────────────────────────────────
function shopFiles(row: Rec): AgentShopFile[] {
  const files: AgentShopFile[] = [];
  const push = (key: string, raw: unknown) => {
    const checked = checkPublicUrl(raw, "agent");
    if (checked) files.push({ key, url: checked.url, trusted: checked.trusted, isPdf: isPdf(checked.url) });
  };
  push("photo", row.shop_image_url);
  const docs = isRecord(row.documents) ? row.documents : {};
  push("commercial_register_front", docs.commercial_register_front_url);
  push("commercial_register_back", docs.commercial_register_back_url);
  return files;
}

function buildAgentShop(row: unknown): AgentShopItem | null {
  if (!isRecord(row) || typeof row.id !== "string") return null;
  if (row.review_status !== "under_review" && row.review_status !== "rejected") return null;
  const docs = isRecord(row.documents) ? row.documents : {};
  return {
    id: row.id,
    name: text(row.shop_name) ?? "",
    status: row.review_status,
    phone: text(row.phone_number),
    address: text(row.address),
    description: text(row.description),
    nif: text(docs.nif),
    nis: text(docs.nis),
    files: shopFiles(row),
    submittedAt: text(row.created_at) ?? "",
  };
}

/** Agent profile rows (documents) + agent shop rows → one item per agent that has something to review. */
export function buildAgentQueue(profiles: readonly unknown[], shops: readonly unknown[]): AgentQueueItem[] {
  interface Acc {
    profile: Rec | null;
    shops: AgentShopItem[];
    user: unknown;
  }
  const byUser = new Map<string, Acc>();
  const acc = (id: string): Acc => {
    let a = byUser.get(id);
    if (!a) byUser.set(id, (a = { profile: null, shops: [], user: null }));
    return a;
  };
  for (const row of profiles) {
    if (!isRecord(row) || typeof row.user_id !== "string") continue;
    const a = acc(row.user_id);
    a.profile = row;
    a.user = row.users ?? a.user;
  }
  for (const row of shops) {
    if (!isRecord(row) || typeof row.user_id !== "string") continue;
    const shop = buildAgentShop(row);
    if (!shop) continue;
    const a = acc(row.user_id);
    a.shops.push(shop);
    a.user = a.user ?? row.users;
  }

  const items: AgentQueueItem[] = [];
  for (const [id, a] of byUser) {
    const stored = a.profile && isRecord(a.profile.documents) ? a.profile.documents : {};
    const docs: AgentDocSlot[] = AGENT_DOC_KEYS.map((key) => {
      const entry = stored[key];
      const checked = isRecord(entry) ? checkPublicUrl(entry.url, "agent") : null;
      if (!isRecord(entry) || !checked) {
        return { key, url: null, trusted: false, isPdf: false, status: "missing", reason: null };
      }
      const status = docStatus(entry.status);
      return {
        key,
        url: checked.url,
        trusted: checked.trusted,
        isPdf: isPdf(checked.url),
        status,
        reason: status === "rejected" ? text(entry.reason) : null,
      };
    });
    const waiting = docs.some((d) => d.status === "pending") || a.shops.some((s) => s.status === "under_review");
    const rejected = docs.some((d) => d.status === "rejected") || a.shops.some((s) => s.status === "rejected");
    if (!waiting && !rejected) continue;
    const dates = [
      ...(a.profile ? [text(a.profile.created_at)] : []),
      ...a.shops.map((s) => s.submittedAt),
    ].filter((d): d is string => !!d);
    const updated = a.profile ? text(a.profile.updated_at) : null;
    items.push({
      id,
      agentId: a.profile ? text(a.profile.agent_id) : null,
      name: userName(a.user),
      phone: userPhone(a.user),
      view: waiting ? "pending" : "rejected",
      docs,
      nif: text(stored.nif),
      nis: text(stored.nis),
      shops: a.shops.sort((x, y) => time(x.submittedAt) - time(y.submittedAt)),
      submittedAt: dates.sort((x, y) => time(x) - time(y))[0] ?? "",
      updatedAt: updated ?? dates.sort((x, y) => time(y) - time(x))[0] ?? "",
    });
  }
  return items;
}

export function agentsInView(items: readonly AgentQueueItem[], view: AgentView): AgentQueueItem[] {
  return items
    .filter((a) => a.view === view)
    .sort((a, b) => (view === "rejected" ? time(b.updatedAt) - time(a.updatedAt) : time(a.submittedAt) - time(b.submittedAt)));
}

export function agentViewCounts(items: readonly AgentQueueItem[]): Record<AgentView, number> {
  return { pending: items.filter((a) => a.view === "pending").length, rejected: items.filter((a) => a.view === "rejected").length };
}

/** Items waiting on staff across the rider and agent queues (rejected ones wait on the partner). */
export function partnerAwaiting(q: PartnerQueues): number {
  return q.riders.counts.pending + q.riders.counts.replacements + q.agents.counts.pending;
}

// ─── Display helpers ─────────────────────────────────────────────────
export function riderDocLabel(t: TFn, key: RiderDocKey): string {
  return t(`partners.doc.${key}`);
}

export function agentDocLabel(t: TFn, key: AgentDocKey): string {
  return t(`doc.${key}`);
}
