// Domain types for the catalog-review feature (route `/merchant-pricing`).
//
// One row of `store_products` (blink-server Drizzle schema `marketplace.ts`)
// joined to its store and the store's merchant. Kept in sync by hand. Two
// things land here for staff review:
//   • price suggestions — `suggestion_status = 'pending'`: a merchant proposed
//     a price outside the ±20% tolerance of the reference price;
//   • new products      — `review_status = 'pending'`: a manual (non-library)
//     product the merchant created.
// `suggestion_status = 'accepted'` is NOT always a staff decision: blink-server
// applies a merchant's price change within ±20% by itself and marks it accepted
// too — so the UI calls it "price applied", never "approved by staff".
// Decisions are written through blink-server (`PATCH /merchant/admin/products/{id}/review`),
// which notifies the merchant.
import type { Variant } from "@/components/ui";

export type SuggestionStatus = "pending" | "accepted" | "rejected";
export type ReviewStatus = "approved" | "pending" | "rejected";

/** ±20% from the reference price — same rule as blink-server's PRICE_TOLERANCE. */
export const PRICE_TOLERANCE = 0.2;

export const SUGGESTION_STATUS: Record<SuggestionStatus, Variant> = {
  pending: "warning",
  accepted: "success",
  rejected: "danger",
};

export const REVIEW_STATUS: Record<ReviewStatus, Variant> = {
  approved: "success",
  pending: "warning",
  rejected: "danger",
};

export interface CatalogProduct {
  id: string;
  storeId: string;
  storeName: string;
  merchantName: string | null;
  merchantPhone: string | null;
  title: string;
  description: string | null;
  brand: string;
  barcode: string;
  category: string;
  unit: string | null;
  stock: number;
  /** Cover first (`image`), then the rest of `photos`, de-duplicated. */
  photos: string[];
  /** The live selling price (DZD). */
  price: number;
  /** Blink's reference price; 0 when none is set. */
  blinkPrice: number;
  suggestedPrice: number | null;
  suggestionStatus: SuggestionStatus | null;
  reviewStatus: ReviewStatus;
  /** Why staff rejected the product or the price suggestion. */
  reviewNote: string | null;
  /** Picked from the Blink library (vs. created by hand). */
  fromLibrary: boolean;
  isAvailable: boolean;
  createdAt: string;
  /**
   * The row's raw `updated_at`, untouched (no Date round-trip: Postgres keeps µs).
   * Sent back with product decisions so blink-server can refuse a stale one (409).
   */
  updatedAt: string;
  /** What the suggestion is measured against: `blink_price`, else the current price (as blink-server does). */
  referencePrice: number;
  /** % gap between the suggested and the reference price; null when there is nothing to compare. */
  deviation: number | null;
}

/** PostgREST select for a product + its store + the store's merchant. */
// One literal (not concatenated) so supabase-js can type the select.
export const CATALOG_PRODUCT_SELECT =
  "id, store_id, title, description, price, blink_price, suggested_price, suggestion_status, review_status, review_note, photos, image, brand, barcode, category, unit, stock, library_product_id, is_available, created_at, updated_at, store:stores!store_products_store_id_fkey(id, name, owner:users!stores_owner_id_fkey(first_name, last_name, phone_number))";
