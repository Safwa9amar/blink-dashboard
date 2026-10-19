// Domain types for the packs-management feature.
//
// One row of `store_packs` (blink-server Drizzle schema `merchant.ts`) joined to its
// store and the store's merchant, with its `items` resolved against `store_products`.
// Kept in sync by hand. A free-delivery pack waits in `under_review` until staff
// approve it; staff decisions go through blink-server
// (`PATCH /merchant/admin/packs/{id}/status`), never straight to the DB.
import type { Variant } from "@/components/ui";

export type PackStatus = "active" | "under_review" | "inactive" | "archived";

export const PACK_STATUS: Record<PackStatus, Variant> = {
  active: "success",
  under_review: "warning",
  inactive: "default",
  archived: "default",
};

export const PACK_STATUS_KEYS: PackStatus[] = ["active", "under_review", "inactive", "archived"];

/** One `store_packs.items[]` entry as stored. */
export interface PackItemRow {
  product_id: string;
  quantity: number;
  qty_promo_enabled?: boolean | null;
  buy_qty?: number | null;
  get_qty?: number | null;
}

/** The `store_products` columns a pack item is resolved with. */
export interface PackProductRow {
  id: string;
  store_id: string;
  title: string;
  price: number | string;
  image?: string | null;
  photos?: string[] | null;
  unit?: string | null;
  is_available: boolean | null;
  review_status: string | null;
}

/**
 * Why customers can't buy a pack because of this item — the same checks as
 * blink-server's store-packs.ts (product of this store, available, approved) and
 * pack-pricing.ts (positive whole quantity). Null = the item is sellable.
 */
export type PackItemIssue = "missing" | "other_store" | "unavailable" | "pending_review" | "rejected" | "bad_quantity";

/** The product-level subset of `PackItemIssue` (product of the right store, but not sellable). */
export type ProductIssue = Extract<PackItemIssue, "unavailable" | "pending_review" | "rejected">;

export interface PackItem {
  productId: string;
  /** Null when the product no longer exists. */
  name: string | null;
  image: string | null;
  unit: string | null;
  /** The product's live price; 0 when it is missing. */
  unitPrice: number;
  /** Charged units. */
  quantity: number;
  /** Buy-X-get-Y units given on top, never charged. */
  freeQty: number;
  qtyPromo: boolean;
  buyQty: number;
  getQty: number;
  issue: PackItemIssue | null;
}

export interface Pack {
  id: string;
  storeId: string;
  storeName: string;
  storeDeliveryFee: number;
  /** `stores.status` (active | inactive | under_review); "" when unknown. */
  storeStatus: string;
  merchantName: string | null;
  merchantPhone: string | null;
  name: string;
  description: string | null;
  image: string | null;
  items: PackItem[];
  /** % discount in effect (0 when the discount is switched off). */
  discountPercent: number;
  /** The stored `discount_enabled` switch (the editor shows it as is). */
  discountEnabled: boolean;
  /** The stored `discount_percent`, even while the discount is switched off. */
  discountPercentRaw: number;
  freeDelivery: boolean;
  status: PackStatus;
  /** Why staff rejected / deactivated the pack. */
  reviewNote: string | null;
  /** When staff approved the pack's free delivery. */
  reviewedAt: string | null;
  createdAt: string;
  /**
   * The row's raw `updated_at`, untouched (no Date round-trip: Postgres keeps µs).
   * Sent back with a decision so blink-server can refuse a stale one (409).
   */
  updatedAt: string;
  /** Σ charged units. */
  itemCount: number;
  /** Σ free units. */
  freeCount: number;
  /** Σ unit price × quantity — the items bought separately. */
  originalPrice: number;
  savings: number;
  /** What one pack costs the customer (before delivery). */
  price: number;
  /**
   * Whether customers could buy this pack's contents: at least one item and no
   * item issue (blink-server drops the whole pack from the store page otherwise).
   * Independent of `status` — only `active` packs are listed at all.
   */
  sellable: boolean;
}

/** PostgREST select for a pack + its store + the store's merchant. */
// One literal (not concatenated) so supabase-js can type the select.
export const PACK_SELECT =
  "id, store_id, name, description, image, items, discount_enabled, discount_percent, free_delivery, status, review_note, reviewed_at, created_at, updated_at, store:stores!store_packs_store_id_fkey(id, name, delivery_fee, status, owner:users!stores_owner_id_fkey(first_name, last_name, phone_number))";

/** The product columns a pack's items are resolved (and checked for sellability) with. */
export const PACK_PRODUCT_SELECT = "id, store_id, title, price, image, photos, unit, is_available, review_status";

/** Exact pack counts per status (+ totals) — the "All" pills and headline stats. */
export interface PackCounts {
  total: number;
  freeDeliveryActive: number;
  byStatus: Record<PackStatus, number>;
}

// ─── Staff pack editor ─────────────────────────────────────────────────
// Staff create / edit / delete packs through blink-server
// (POST /merchant/admin/stores/{storeId}/packs, PATCH and DELETE
// /merchant/admin/packs/{packId}); the dashboard never writes `store_packs`.

/** A store the create flow can attach a pack to. */
export interface PackStoreOption {
  id: string;
  name: string;
  /** The store's delivery fee (what the merchant covers on a free-delivery pack). */
  deliveryFee: number;
  /** `stores.status`: active | inactive | under_review. */
  status: string;
  ownerName: string | null;
  ownerPhone: string | null;
}

/** PostgREST select for the store picker (one literal so supabase-js can type it). */
export const PACK_STORE_SELECT =
  "id, name, delivery_fee, status, owner:users!stores_owner_id_fkey(first_name, last_name, phone_number)";

/** One of the store's products, as the product picker lists it. */
export interface PackProductOption {
  id: string;
  title: string;
  /** Live price. */
  price: number;
  image: string | null;
  unit: string | null;
  /** Why it can't go in a pack customers see; null = sellable (selectable). */
  issue: ProductIssue | null;
}

/** What the editor shows for a line's product: live from the store's products, else as the pack resolved it. */
export interface PackLineProduct {
  /** Null when the product no longer exists. */
  title: string | null;
  image: string | null;
  unit: string | null;
  price: number;
  /** `bad_quantity` never shows here: the editor checks quantities itself. */
  issue: Exclude<PackItemIssue, "bad_quantity"> | null;
}

/** Statuses staff can set (`under_review` is only ever left as is). */
export type PackEditStatus = "active" | "inactive" | "archived";
/** A new pack starts live or switched off. */
export const PACK_CREATE_STATUSES = ["active", "inactive"] as const satisfies readonly PackEditStatus[];
export const PACK_EDIT_STATUSES = ["active", "inactive", "archived"] as const satisfies readonly PackEditStatus[];

/** One editor line (camelCase mirror of a `store_packs.items[]` entry). */
export interface PackDraftItem {
  productId: string;
  quantity: number;
  qtyPromo: boolean;
  buyQty: number;
  getQty: number;
}

/** The editor's form state; `status` is `under_review` only for a pack that is (and stays) in review. */
export interface PackDraft {
  name: string;
  description: string;
  image: string;
  items: PackDraftItem[];
  discountEnabled: boolean;
  discountPercent: number;
  freeDelivery: boolean;
  status: PackEditStatus | "under_review";
}

/** The `store_packs` write body blink-server takes (snake_case), every field optional for a PATCH. */
export interface PackWriteBody {
  name?: string;
  description?: string | null;
  image?: string | null;
  items?: { product_id: string; quantity: number; qty_promo_enabled: boolean; buy_qty: number; get_qty: number }[];
  discount_enabled?: boolean;
  discount_percent?: number;
  free_delivery?: boolean;
  status?: PackEditStatus;
}

/** A validation failure — a key under `packs.editor.validation.*`. */
export type PackDraftErrorKey =
  | "name_required"
  | "name_too_long"
  | "description_too_long"
  | "image_invalid"
  | "items_required"
  | "items_too_many"
  | "items_duplicate"
  | "items_invalid"
  | "items_not_in_store"
  | "quantity_range"
  | "promo_range"
  | "discount_range"
  | "status_invalid";

export interface PackDraftErrors {
  name?: PackDraftErrorKey;
  description?: PackDraftErrorKey;
  image?: PackDraftErrorKey;
  items?: PackDraftErrorKey;
  discount?: PackDraftErrorKey;
  status?: PackDraftErrorKey;
  /** Per line, keyed by product id. */
  lines?: Record<string, PackDraftErrorKey>;
}

/** Where staff pack photos go: the public bucket merchant uploads already use, under `packs/`. */
export const PACK_IMAGE_BUCKET = "merchant";
/** Same cap as blink-server's POST /merchant/uploads. */
export const PACK_IMAGE_MAX_BYTES = 8 * 1024 * 1024;
export const PACK_IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
