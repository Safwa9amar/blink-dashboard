// Pure row → queue-item mappers for the verification queue. No I/O: the server
// loaders (src/app/d/verification/data.ts) fetch the rows and hand them here.
// Safe to import from server and client code.
//
// Rows come straight from PostgREST and their jsonb columns (hours, documents,
// gallery…) are whatever the app wrote, so nothing here trusts their shape:
// every read is type-checked, and a store that still fails to map degrades to a
// minimal card instead of taking the whole queue down.
import type { Variant } from "@/components/ui";
import {
  DAY_KEYS,
  STORE_DOC_KEYS,
  STORE_SCAN_KEYS,
  STORE_VIEWS,
  type HoursGroup,
  type OwnerDeletion,
  type QueueCounts,
  type ReviewDocState,
  type ReviewOutcome,
  type StoreDocItem,
  type StoreDocKey,
  type StoreDocReviewEntry,
  type StoreDocSlot,
  type StoreDocState,
  type StoreDocSummary,
  type StoreFilter,
  type StoreIdKey,
  type StoreQueueItem,
  type StoreRow,
  type StoreView,
  type TFn,
  type VerificationQueues,
  type ViewDoc,
} from "./types";

/** Badge colour per review state (documents and rider applications). */
export const STATUS_VARIANT: Record<ReviewDocState, Variant> = {
  pending: "warning",
  verified: "success",
  rejected: "danger",
  missing: "default",
};

/** Badge colour per store filter. */
export const STORE_FILTER_VARIANT: Record<StoreFilter, Variant> = {
  pending: "warning",
  rejected: "danger",
  live: "success",
};

/**
 * Category slugs with a translation under verification.category.*: the
 * marketplace categories (marketplace_categories.slug) and the merchant store
 * types the app offers (blink store/merchant/store-creation-store
 * STORE_CATEGORY_KEYS; blink-server maps them in src/lib/store-categories.ts).
 */
export const STORE_CATEGORY_SLUGS = [
  // Marketplace categories
  "restaurant",
  "supermarket",
  "parcels",
  "pastry",
  "cosmetics",
  "others",
  // Merchant store types (restaurant / supermarket above are both)
  "convenience",
  "grocery",
  "bakery",
  "pharmacy",
  "electronics",
  "clothing",
  "other",
] as const;

// ─── Defensive readers ───────────────────────────────────────────────
type Rec = Record<string, unknown>;

const isRecord = (value: unknown): value is Rec => !!value && typeof value === "object" && !Array.isArray(value);

/** Trimmed text, or null when empty or not a string. */
const text = (value: unknown): string | null => (typeof value === "string" && value.trim()) || null;

const time = (iso: unknown): number => {
  if (typeof iso !== "string") return 0;
  const ms = Date.parse(iso);
  return Number.isNaN(ms) ? 0 : ms;
};

export function fullName(user: unknown): string {
  if (!isRecord(user)) return "";
  return [text(user.first_name), text(user.last_name)].filter(Boolean).join(" ");
}

/** Storage paths and URLs both end in the extension (signed URLs add a query string). */
export function isPdfUrl(url: string): boolean {
  return (url.split("?")[0] ?? "").toLowerCase().endsWith(".pdf");
}

// ─── Untrusted URLs ──────────────────────────────────────────────────
/**
 * Where blink-server puts merchant uploads: getPublicUrl() of the `merchant`
 * bucket (blink-server src/routes/merchant/uploads.ts).
 */
export const MERCHANT_PUBLIC_PATH = "/storage/v1/object/public/merchant/";

/** Our Supabase project's origin, or null when the env var is missing / invalid. */
export function supabaseOrigin(): string | null {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").origin;
  } catch {
    return null;
  }
}

export interface CheckedUrl {
  /** The normalised URL when trusted; the raw value otherwise (show it as text, never load it). */
  url: string;
  trusted: boolean;
}

/**
 * Store URLs are typed by the merchant's app, so any of them could point
 * anywhere. Only a public object in our own `merchant` bucket (https, our
 * Supabase origin, no credentials) is trusted enough to load in an <img> or
 * <iframe> on the dashboard; anything else comes back untrusted. URL parsing
 * resolves `..` / `%2e%2e` segments before the path check. null when empty.
 */
export function checkStoreUrl(raw: unknown, origin: string | null = supabaseOrigin()): CheckedUrl | null {
  const value = text(raw);
  if (!value) return null;
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return { url: value, trusted: false };
  }
  const trusted =
    !!origin &&
    parsed.protocol === "https:" &&
    parsed.origin === origin &&
    !parsed.username &&
    !parsed.password &&
    parsed.pathname.startsWith(MERCHANT_PUBLIC_PATH) &&
    parsed.pathname.length > MERCHANT_PUBLIC_PATH.length;
  return trusted ? { url: parsed.href, trusted } : { url: value, trusted: false };
}

// ─── Document review ─────────────────────────────────────────────────
// A copy of blink-server's rules (src/lib/store-documents.ts: currentDocValue,
// reviewEntry, effectiveDocStatus) — keep them in sync by hand. Uploading a
// document doesn't make it valid: it only counts as verified once Blink staff
// verified that exact value. `stores.document_review` holds each verdict with
// the value staff saw; when the merchant uploads a new scan or edits a number,
// that document is pending again. Malformed jsonb reads as "no verdict".

/** Where each document's current value lives in `stores.documents` (blink-server STORE_DOC_FIELDS). */
export const STORE_DOC_FIELDS: Record<StoreDocKey, string> = {
  commercial_register_front: "commercial_register_front_url",
  commercial_register_back: "commercial_register_back_url",
  nif: "nif",
  nis: "nis",
};

/** The document's current value in `stores.documents` (trimmed), or null when absent / blank. */
export function currentDocValue(documents: unknown, key: StoreDocKey): string | null {
  if (!isRecord(documents)) return null;
  const v = documents[STORE_DOC_FIELDS[key]];
  if (typeof v === "string") return v.trim() || null;
  // A number typed as one (jsonb keeps whatever was sent).
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  return null;
}

/** A well-formed review entry, or null (malformed jsonb is ignored). */
function reviewEntry(review: unknown, key: StoreDocKey): StoreDocReviewEntry | null {
  if (!isRecord(review)) return null;
  const e = review[key];
  if (!isRecord(e)) return null;
  if (e.status !== "verified" && e.status !== "rejected") return null;
  if (typeof e.value !== "string") return null;
  const reason = typeof e.reason === "string" ? e.reason.trim() || null : null;
  return {
    status: e.status,
    reason: e.status === "rejected" ? reason : null,
    value: e.value.trim(),
    reviewed_at: typeof e.reviewed_at === "string" ? e.reviewed_at : "",
    reviewed_by: typeof e.reviewed_by === "string" ? e.reviewed_by : null,
  };
}

/**
 * A document's state: missing (no current value), pending (no verdict on its
 * current value) or staff's verdict (+ the reason when rejected).
 */
export function effectiveDocStatus(documents: unknown, review: unknown, key: StoreDocKey): StoreDocState {
  const value = currentDocValue(documents, key);
  if (value === null) return { status: "missing", reason: null };
  const e = reviewEntry(review, key);
  if (!e || e.value !== value) return { status: "pending", reason: null };
  return { status: e.status, reason: e.status === "rejected" ? e.reason : null };
}

/** One required document as the reviewer sees it (its value is sent back as `expected_value`). */
export function storeDocItem<K extends StoreDocKey>(documents: unknown, review: unknown, key: K): StoreDocItem<K> {
  return { key, value: currentDocValue(documents, key), ...effectiveDocStatus(documents, review, key) };
}

export function docSummary(docs: readonly { status: ReviewDocState }[]): StoreDocSummary {
  const summary: StoreDocSummary = { missing: 0, pending: 0, verified: 0, rejected: 0, total: docs.length };
  for (const d of docs) summary[d.status] += 1;
  return summary;
}

/** A store row with a document waiting on staff (present, no verdict on its current value). */
export function hasDocumentToVerify(row: unknown): boolean {
  if (!isRecord(row)) return false;
  return STORE_DOC_KEYS.some((key) => effectiveDocStatus(row.documents, row.document_review, key).status === "pending");
}

/** Ids of the rows with a document to verify, in row order (duplicates dropped). */
export function storesWithDocumentsToVerify(rows: readonly unknown[]): string[] {
  const ids = new Set<string>();
  for (const row of rows) if (isRecord(row) && row.id != null && hasDocumentToVerify(row)) ids.add(String(row.id));
  return [...ids];
}

// ─── Field mappers ───────────────────────────────────────────────────
/** stores.documents.additional_docs → view-only files carrying the merchant's own names. */
export function additionalFiles(docs: unknown, origin: string | null = supabaseOrigin()): ViewDoc[] {
  const extras = isRecord(docs) && Array.isArray(docs.additional_docs) ? docs.additional_docs : [];
  const files: ViewDoc[] = [];
  extras.forEach((extra: unknown, i) => {
    if (!isRecord(extra)) return;
    const link = checkStoreUrl(extra.url, origin);
    // The index keeps keys unique even when the app repeats an id.
    if (link) files.push({ key: `additional_${i}`, label: text(extra.name), ...link, isPdf: isPdfUrl(link.url) });
  });
  return files;
}

/**
 * stores.hours → consecutive days that share the same shifts, Saturday first.
 * null when no day is set at all (or the column isn't an object). A disabled
 * day, or one without a complete shift, counts as closed.
 */
export function hoursGroups(hours: unknown): HoursGroup[] | null {
  if (!isRecord(hours) || !DAY_KEYS.some((k) => isRecord(hours[k]))) return null;
  const groups: HoursGroup[] = [];
  for (const key of DAY_KEYS) {
    const day = hours[key];
    const shifts: string[] = [];
    if (isRecord(day) && day.enabled === true && Array.isArray(day.shifts)) {
      for (const shift of day.shifts as unknown[]) {
        if (!isRecord(shift)) continue;
        const open = text(shift.open);
        const close = text(shift.close);
        if (open && close) shifts.push(`${open.slice(0, 5)}–${close.slice(0, 5)}`);
      }
    }
    const last = groups[groups.length - 1];
    if (last && last.shifts.join() === shifts.join()) last.to = key;
    else groups.push({ from: key, to: key, shifts });
  }
  return groups;
}

/** A Google Maps link to the store's pin, when it has valid coordinates. */
export function mapsUrl(lat: unknown, lng: unknown): string | null {
  if (typeof lat !== "number" || typeof lng !== "number") return null;
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  if (lat === 0 && lng === 0) return null;
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}

/**
 * Whether the store's owner is leaving Blink: the latest of their `pending` /
 * `completed` account deletion requests (a cancelled one doesn't count) — the
 * same rule blink-server applies before refusing an approval (409 owner_leaving).
 */
export function ownerDeletionOf(user: unknown): OwnerDeletion | null {
  if (!isRecord(user) || !Array.isArray(user.account_deletion_requests)) return null;
  let latest: { status: OwnerDeletion; at: number } | null = null;
  for (const request of user.account_deletion_requests as unknown[]) {
    if (!isRecord(request)) continue;
    const status = request.status;
    if (status !== "pending" && status !== "completed") continue;
    const at = time(request.created_at);
    if (!latest || at >= latest.at) latest = { status, at };
  }
  return latest?.status ?? null;
}

/** Which queue filter a store belongs to; null when it isn't in the queue (inactive without a note). */
export function storeFilterOf(row: Pick<StoreRow, "status" | "review_note">): StoreFilter | null {
  if (row.status === "under_review") return "pending";
  if (row.status === "active") return "live";
  if (row.status === "inactive" && text(row.review_note)) return "rejected";
  return null;
}

/** The fields every card needs — each read on its own can't throw. */
function storeBasics(s: Rec, filter: StoreFilter) {
  const reviewNote = text(s.review_note);
  return {
    id: String(s.id),
    name: text(s.name) ?? "",
    status: s.status as StoreQueueItem["status"],
    filter,
    views: [] as StoreView[],
    reviewNote,
    resubmitted: filter === "pending" && !!reviewNote,
    ownerName: fullName(s.users),
    ownerPhone: isRecord(s.users) ? text(s.users.phone_number) : null,
    ownerDeletion: ownerDeletionOf(s.users),
    submittedAt: text(s.created_at) ?? "",
    /** Sent back verbatim as expected_updated_at, so not trimmed. */
    updatedAt: typeof s.updated_at === "string" ? s.updated_at : "",
  };
}

const ID_KEYS: readonly StoreIdKey[] = ["nif", "nis"];

function toStoreQueueItem(s: Rec, filter: StoreFilter, origin: string | null): StoreQueueItem {
  const docs = isRecord(s.documents) ? s.documents : {};
  // The file shown is the current value itself, so the status, the preview and
  // `expected_value` all describe the same document.
  const documents = STORE_SCAN_KEYS.map((key): StoreDocSlot => {
    const doc = storeDocItem(s.documents, s.document_review, key);
    const link = checkStoreUrl(doc.value, origin);
    return {
      ...doc,
      url: link?.url ?? null,
      trusted: link?.trusted ?? false,
      isPdf: link ? isPdfUrl(link.url) : false,
    };
  });
  const businessIds = ID_KEYS.map((key) => storeDocItem(s.documents, s.document_review, key));
  const required = [...documents, ...businessIds];
  const missing = required.filter((d) => d.status === "missing").map((d) => d.key);

  const logo = checkStoreUrl(s.logo, origin);
  const cover = checkStoreUrl(s.image, origin);
  const media: ViewDoc[] = [];
  if (logo) media.push({ key: "logo", label: null, ...logo, isPdf: false });
  if (cover) media.push({ key: "cover", label: null, ...cover, isPdf: false });
  (Array.isArray(s.gallery) ? (s.gallery as unknown[]) : []).forEach((raw, i) => {
    const link = checkStoreUrl(raw, origin);
    if (link) media.push({ key: `gallery_${i}`, label: null, ...link, isPdf: isPdfUrl(link.url) });
  });

  const products = Array.isArray(s.store_products) && isRecord(s.store_products[0]) ? s.store_products[0].count : 0;
  const categories = Array.isArray(s.category_slugs) ? (s.category_slugs as unknown[]).map(text) : [];

  return {
    ...storeBasics(s, filter),
    phone: text(s.phone),
    whatsapp: text(s.whatsapp),
    email: text(s.email),
    address: text(s.location),
    location: [text(s.city), text(s.wilaya)].filter(Boolean).join(", ") || null,
    mapUrl: mapsUrl(s.latitude, s.longitude),
    categories: categories.filter((c): c is string => !!c),
    description: text(s.description),
    hours: hoursGroups(s.hours),
    productCount: typeof products === "number" && Number.isFinite(products) ? products : 0,
    businessIds,
    // Only a trusted logo is loaded as the avatar; an untrusted one stays in `media`, as text.
    logo: logo?.trusted ? logo.url : null,
    documents,
    files: additionalFiles(docs, origin),
    media,
    missing,
    docSummary: docSummary(required),
    degraded: false,
  };
}

/** A store whose row couldn't be fully read: who and when only, flagged so staff look closer. */
function minimalStoreItem(s: Rec, filter: StoreFilter): StoreQueueItem {
  return {
    ...storeBasics(s, filter),
    phone: null,
    whatsapp: null,
    email: null,
    address: null,
    location: null,
    mapUrl: null,
    categories: [],
    description: null,
    hours: null,
    productCount: 0,
    businessIds: [],
    logo: null,
    documents: [],
    files: [],
    media: [],
    missing: [],
    docSummary: docSummary([]),
    degraded: true,
  };
}

/** The rows loaded for each view of the store queue (PostgREST rows, read defensively). */
export type StoreRowLists = Partial<Record<StoreView, readonly unknown[]>>;

/** Whether a row loaded for `view` really belongs there (lists are read separately, so they may disagree). */
function rowInView(row: Rec, filter: StoreFilter, view: StoreView): boolean {
  if (view !== "documents") return filter === view;
  if (filter !== "live") return false;
  try {
    return hasDocumentToVerify(row);
  } catch {
    return false;
  }
}

/**
 * The stores in the queue, one item per store however many lists loaded
 * it, each tagged with the views whose list it came from (so a capped list
 * shows exactly the rows loaded for it). Rows outside the queue (inactive
 * without a note) are dropped; a row that fails to map degrades to a minimal
 * card. `origin` is the Supabase origin URLs must come from to be previewed
 * (see checkStoreUrl). Order per view: storesInView.
 */
export function buildStoreQueue(lists: StoreRowLists, origin: string | null = supabaseOrigin()): StoreQueueItem[] {
  const byId = new Map<string, StoreQueueItem>();
  for (const view of STORE_VIEWS) {
    for (const row of lists[view] ?? []) {
      if (!isRecord(row) || row.id == null) continue;
      const filter = storeFilterOf(row as Pick<StoreRow, "status" | "review_note">);
      if (!filter) continue;
      const id = String(row.id);
      let item = byId.get(id);
      if (!item) {
        try {
          item = toStoreQueueItem(row, filter, origin);
        } catch {
          item = minimalStoreItem(row, filter);
        }
        byId.set(id, item);
      }
      if (!item.views.includes(view) && rowInView(row, filter, view)) item.views.push(view);
    }
  }
  return [...byId.values()].filter((item) => item.views.length > 0);
}

/**
 * One view's stores: under review and documents to verify oldest store first
 * (nobody waits longest; a verdict doesn't reorder the list), rejected and live
 * most recently changed first.
 */
export function storesInView(items: readonly StoreQueueItem[], view: StoreView): StoreQueueItem[] {
  const oldestFirst = view === "pending" || view === "documents";
  return items
    .filter((s) => s.views.includes(view))
    .sort((a, b) => (oldestFirst ? time(a.submittedAt) - time(b.submittedAt) : time(b.updatedAt) - time(a.updatedAt)));
}

export function queueCounts(q: VerificationQueues): QueueCounts {
  const { pending, documents, rejected, live, resubmitted } = q.stores.counts;
  return {
    stores: pending,
    storesResubmitted: resubmitted,
    storesDocuments: documents,
    storesRejected: rejected,
    storesLive: live,
    // Stores under review and live stores with documents to verify are distinct sets.
    awaiting: pending + documents,
  };
}

// ─── Display helpers ─────────────────────────────────────────────────
/**
 * A date and time in the UI language, on Algiers' clock — a fixed zone so the
 * server render and the browser agree on the day and hour.
 */
export function formatDateTime(iso: string, locale?: string): string {
  if (!iso || Number.isNaN(Date.parse(iso))) return "—";
  return new Date(iso).toLocaleString(locale, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Algiers",
  });
}

/** Separator for a plain list of tags (Arabic uses its own comma). */
export function listSeparator(locale?: string): string {
  return locale?.startsWith("ar") ? "، " : ", ";
}

/** "A, B and C" in the UI language ("A وB وC" in Arabic). */
export function formatList(items: string[], locale?: string): string {
  try {
    return new Intl.ListFormat(locale, { style: "long", type: "conjunction" }).format(items);
  } catch {
    return items.join(listSeparator(locale));
  }
}

export function fileLabel(t: TFn, file: ViewDoc): string {
  if (file.label) return file.label;
  if (file.key.startsWith("gallery_")) return t("doc.gallery", { n: Number(file.key.slice(8)) + 1 });
  if (file.key.startsWith("additional_")) return t("doc.additional");
  return t(`doc.${file.key}`);
}

/** A translated category, or the slug made readable ("home-decor" → "Home decor") when unknown. */
export function categoryLabel(t: TFn, slug: string): string {
  if ((STORE_CATEGORY_SLUGS as readonly string[]).includes(slug)) return t(`category.${slug}`);
  const words = slug.replace(/[-_]+/g, " ").trim();
  return words ? words.charAt(0).toLocaleUpperCase() + words.slice(1) : slug;
}

export function requiredDocLabel(t: TFn, key: StoreDocKey): string {
  return key === "nif" || key === "nis" ? t(`fields.${key}`) : t(`doc.${key}`);
}

/** The outcome's message is translated server-side; the code is the fallback. */
export function reviewErrorText(t: TFn, outcome: Extract<ReviewOutcome, { ok: false }>): string {
  return outcome.message || t(`errors.${outcome.code}`, { detail: "" });
}
