// Domain types for the verification review queue.
//
// Row types mirror blink-server's tables, read with the service-role client in
// src/app/d/verification/data.ts. Kept in sync by hand with the Drizzle schema
// (~/blink-server/src/db/schema). Queue items are the view models the
// components render.
//
// Only the Merchant stores queue is built so far. Riders (rider_profiles +
// private `rider-documents` scans) and Agents (agent_profiles + agent_shops)
// join later — see the partner-4 dashboard review plan (Tasks 6–12): their row
// types, queue items, `VerificationQueues` keys and `ReviewTarget` kinds are
// additive to what is here.
import type { BlinkApiErrorKey } from "@/lib/blink-api-errors";

export type TFn = (key: string, values?: Record<string, string | number>) => string;

// ─── Statuses ────────────────────────────────────────────────────────
export type ReviewDocStatus = "pending" | "verified" | "rejected";
/** A document slot as shown: its review status, or never uploaded. */
export type ReviewDocState = ReviewDocStatus | "missing";

/** stores.status (store_status enum). There is no "rejected": reject = inactive + review_note. */
export type StoreStatus = "active" | "inactive" | "under_review";

/**
 * The store queue's filters:
 * - `pending`  — `under_review` (new, or resubmitted after a rejection when review_note is set)
 * - `rejected` — `inactive` with a review_note (rejected or deactivated by staff; can be re-approved)
 * - `live`     — `active` (can be deactivated, with a note)
 * An `inactive` store without a note was hidden for another reason (e.g. an
 * account deletion request) and isn't in the queue.
 */
export const STORE_FILTERS = ["pending", "rejected", "live"] as const;
export type StoreFilter = (typeof STORE_FILTERS)[number];

/**
 * The store queue's views (its filter pills): the three status filters, plus
 * `documents` — live stores with a document nobody at Blink has verified in its
 * current form (`pending`, see StoreDocStatus). Stores under review aren't in
 * it: `pending` already lists them.
 */
export const STORE_VIEWS = ["pending", "documents", "rejected", "live"] as const;
export type StoreView = (typeof STORE_VIEWS)[number];

// ─── Opening hours (stores.hours jsonb) ──────────────────────────────
/** Algerian week order — mirrors the app's WeekHours keys. */
export const DAY_KEYS = ["sat", "sun", "mon", "tue", "wed", "thu", "fri"] as const;
export type DayKey = (typeof DAY_KEYS)[number];

export interface StoreShiftRow {
  open?: string | null; // "HH:MM"
  close?: string | null;
}

export type StoreHoursRow = Partial<
  Record<DayKey, { enabled?: boolean | null; shifts?: StoreShiftRow[] | null } | null>
>;

/** Consecutive days sharing the same shifts. Empty `shifts` = closed. */
export interface HoursGroup {
  from: DayKey;
  to: DayKey;
  /** "08:00–22:00" per shift. */
  shifts: string[];
}

// ─── DB rows (snake_case, as PostgREST returns them) ────────────────
export interface UserRef {
  first_name: string | null;
  last_name: string | null;
  phone_number: string | null;
  /** `account_deletion_requests` embed (user_id fkey) — the owner's deletion requests, any status. */
  account_deletion_requests?: AccountDeletionRequestRef[] | null;
}

/** account_deletion_requests.status. */
export type AccountDeletionStatus = "pending" | "completed" | "cancelled";

export interface AccountDeletionRequestRef {
  status: AccountDeletionStatus;
  created_at: string;
}

/**
 * The owner is leaving Blink: their latest account deletion request is
 * `pending` (filed, not processed yet) or `completed` (account anonymised).
 * blink-server refuses to approve their stores (409 owner_leaving).
 */
export type OwnerDeletion = Exclude<AccountDeletionStatus, "cancelled">;

/** stores.documents / agent_shops.documents (StoreDocuments) — public URLs in the `merchant` / `agent` buckets. */
export interface BusinessDocumentsRow {
  commercial_register_front_url?: string | null;
  commercial_register_back_url?: string | null;
  nif?: string | null;
  nis?: string | null;
  additional_docs?: { id: string; name: string; url: string }[] | null;
}

// ─── Store document review (stores.document_review jsonb) ───────────
// Mirrors blink-server src/lib/store-documents.ts — keep in sync by hand.

/** The documents Blink verifies, in display order (blink-server STORE_DOC_KEYS). */
export const STORE_DOC_KEYS = ["commercial_register_front", "commercial_register_back", "nif", "nis"] as const;
export type StoreDocKey = (typeof STORE_DOC_KEYS)[number];

/** The scanned ones (a file); the others are numbers the merchant typed. */
export const STORE_SCAN_KEYS = ["commercial_register_front", "commercial_register_back"] as const;
export type StoreScanKey = (typeof STORE_SCAN_KEYS)[number];
export type StoreIdKey = Exclude<StoreDocKey, StoreScanKey>;

/** Staff's verdict on one document. */
export type DocumentVerdict = "verified" | "rejected";

/** One entry of `stores.document_review` — what blink-server writes (read defensively). */
export interface StoreDocReviewEntry {
  status: DocumentVerdict;
  /** Why it was rejected (shown to the merchant); null when verified. */
  reason: string | null;
  /** The document value staff looked at. The verdict only counts while it's still the current value. */
  value: string;
  reviewed_at: string;
  reviewed_by: string | null;
}

export type StoreDocumentReview = Partial<Record<StoreDocKey, StoreDocReviewEntry>>;

/**
 * missing: no current value; pending: present but not verified in its current
 * form (never reviewed, or changed since); verified / rejected: staff's verdict
 * on the current value.
 */
export type StoreDocStatus = ReviewDocState;

export interface StoreDocState {
  status: StoreDocStatus;
  /** Staff's reason when rejected; null otherwise. */
  reason: string | null;
}

export interface StoreRow {
  id: string;
  owner_id: string | null;
  name: string;
  status: StoreStatus;
  /** Why staff rejected / deactivated it. Kept on resubmission, cleared on approval. */
  review_note: string | null;
  logo: string | null;
  /** Cover photo ("" when unset). */
  image: string | null;
  gallery: string[] | null;
  /** Street address. */
  location: string | null;
  city: string | null;
  wilaya: string | null;
  latitude: number | null;
  longitude: number | null;
  category_slugs: string[] | null;
  description: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  /** jsonb columns: the shape the app writes, not a guarantee — queue.ts reads them defensively. */
  hours: StoreHoursRow | null;
  documents: BusinessDocumentsRow | null;
  /** Staff's verdict per document, against the value they saw (see effectiveDocStatus). */
  document_review: StoreDocumentReview | null;
  created_at: string;
  /** Sent back verbatim as `expected_updated_at`, so keep the raw string. */
  updated_at: string;
  users: UserRef | null;
  /** `store_products(count)` embed. */
  store_products?: { count: number }[] | null;
}

// ─── View models ─────────────────────────────────────────────────────
/** A reviewable document slot (rider licence / ID, agent commercial register). */
export interface ReviewDoc<K extends string = string> {
  key: K;
  /** Signed (riders) or public (agents) URL; null when missing or unsignable. */
  url: string | null;
  /** `url` points at our own storage, so it may be previewed inline. */
  trusted: boolean;
  status: ReviewDocState;
  /** Staff note from the last rejection. */
  note: string | null;
  isPdf: boolean;
}

/** A view-only file (shop photo, store logo, register scan on a shop / store). */
export interface ViewDoc {
  /** Translation key under verification.doc.* — unless `label` is set. */
  key: string;
  /** Merchant-named extra documents carry their own name. */
  label: string | null;
  url: string;
  /**
   * `url` is a public object in our Supabase project's `merchant` bucket, so it
   * may be previewed inline. Anything else is shown as plain text, never loaded.
   */
  trusted: boolean;
  isPdf: boolean;
}

/** A required business document as the reviewer sees it: its current value and Blink's verdict on it. */
export interface StoreDocItem<K extends StoreDocKey = StoreDocKey> extends StoreDocState {
  key: K;
  /**
   * The current value in `stores.documents` (trimmed): the scan URL as stored,
   * or the NIF / NIS number. null when missing. Sent back as `expected_value`,
   * so it's never normalised.
   */
  value: string | null;
}

/** A register scan: its review, plus how to show the file. */
export interface StoreDocSlot extends StoreDocItem<StoreScanKey> {
  /** The file to show (see checkStoreUrl); null when missing. */
  url: string | null;
  /** See ViewDoc.trusted. */
  trusted: boolean;
  isPdf: boolean;
}

/** How many of a store's required documents are in each state. */
export type StoreDocSummary = Record<StoreDocStatus, number> & { total: number };

export interface StoreQueueItem {
  id: string;
  name: string;
  status: StoreStatus;
  filter: StoreFilter;
  /** The queue views listing this store (its status filter, plus `documents` when it's there). */
  views: StoreView[];
  /** The staff note from the last rejection / deactivation. */
  reviewNote: string | null;
  /** Under review again after a rejection (it still carries the earlier note). */
  resubmitted: boolean;
  ownerName: string;
  ownerPhone: string | null;
  /** The owner is deleting (or deleted) their account: the store can't be approved. */
  ownerDeletion: OwnerDeletion | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  /** Street address. */
  address: string | null;
  /** "City, Wilaya". */
  location: string | null;
  /** Google Maps link from latitude / longitude. */
  mapUrl: string | null;
  categories: string[];
  description: string | null;
  /** null = no opening hours set. */
  hours: HoursGroup[] | null;
  productCount: number;
  /** NIF and NIS. */
  businessIds: StoreDocItem<StoreIdKey>[];
  /** Trusted logo URL only (an untrusted one is listed in `media`, unloaded). */
  logo: string | null;
  /** Commercial register front / back. */
  documents: StoreDocSlot[];
  /** Merchant-named extra documents (not reviewed one by one). */
  files: ViewDoc[];
  /** Logo, cover and gallery photos. */
  media: ViewDoc[];
  /** Required business documents that are missing. */
  missing: StoreDocKey[];
  /** The required documents per state (all zero when `degraded`). */
  docSummary: StoreDocSummary;
  submittedAt: string;
  /** The row's raw `updated_at` — the version the reviewer saw (expected_updated_at). */
  updatedAt: string;
  /** Part of the row was malformed, so only the basics are shown. */
  degraded: boolean;
}

export interface QueueLoad<T> {
  items: T[];
  error: string | null;
}

/**
 * Exact store counts per view (each list is capped), plus resubmissions within
 * `pending`. `documents` is counted over the live stores checked: all of them
 * when `documentsComplete`, else the `documentsChecked` oldest.
 */
export type StoreCounts = Record<StoreView, number> & {
  resubmitted: number;
  documentsChecked: number;
  documentsComplete: boolean;
};

export interface StoreQueueLoad extends QueueLoad<StoreQueueItem> {
  counts: StoreCounts;
}

/**
 * Everything /verification loads, keyed by tab. Riders and agents add
 * `riders: QueueLoad<RiderQueueItem>` and `agents: QueueLoad<AgentQueueItem>`
 * here with their tabs.
 */
export interface VerificationQueues {
  stores: StoreQueueLoad;
}

export type VerificationTab = keyof VerificationQueues;

export interface QueueCounts {
  /** Stores waiting on staff (under review). */
  stores: number;
  storesResubmitted: number;
  /** Live stores with a document to verify. */
  storesDocuments: number;
  storesRejected: number;
  storesLive: number;
  /** Items waiting on staff across every queue. */
  awaiting: number;
}

// ─── Review actions (dashboard → blink-server staff endpoints) ──────
/** `deactivate` takes a live store down; like `reject` it needs a note. */
export type ReviewDecision = "approve" | "reject" | "deactivate";

/** What a decision applies to. Riders / agents add `rider_document`, `agent_document` and `agent_shop`. */
export type ReviewTarget = {
  kind: "merchant_store";
  storeId: string;
  /** The store row's `updated_at` as loaded — blink-server answers 409 if it changed since. */
  expectedUpdatedAt?: string | null;
};

/** One document verdict (PATCH /merchant/admin/stores/{id}/documents). */
export interface DocumentReviewTarget {
  storeId: string;
  document: StoreDocKey;
  /** The document value the reviewer saw (StoreDocItem.value) — blink-server answers 409 if it changed since. */
  expectedValue: string;
}

export type ReviewErrorCode =
  | "invalid_target"
  | "note_required"
  | "note_too_long"
  /** 409: the owner is deleting their account, so the store can't be approved. */
  | "owner_leaving"
  /** 409 on a document verdict: the document (or the store) changed since it was loaded. */
  | "stale"
  /** 400 on a document verdict: the merchant removed that document. */
  | "document_missing"
  | BlinkApiErrorKey;

/** `message` is translated server-side, ready to show. */
export type ReviewOutcome = { ok: true } | { ok: false; code: ReviewErrorCode; message: string };
