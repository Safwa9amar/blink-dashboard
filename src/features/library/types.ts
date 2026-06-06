// Domain types for the Blink Library feature — the platform-curated master
// product catalog that merchants browse and pull items from into their stores.
// Backed by the `library_products` / `library_categories` Supabase tables
// (blink-server/src/db/schema/library-*.ts). These local types are kept in sync
// with the Drizzle schema BY HAND (per the Blink golden rule — no shared package).
import type { Lang } from "@/components/ui";

export type TFn = (k: string, v?: Record<string, string | number>) => string;

// Per-language text (en/fr/ar). Translatable fields (product/category name and
// product description) are entered in all three languages by the admin and stored
// one column per language in Postgres (name_en/name_fr/name_ar, …). The DB row
// types below expose those flat snake_case columns; the view types use this record.
export type LangText = Record<Lang, string>;

// A catalog item can carry up to this many photos; photos[0] is the cover.
export const MAX_PRODUCT_PHOTOS = 5;

// Admin lifecycle for a catalog entry. Only `published` items surface to
// merchants in the app's "Blink Library" picker.
export type LibraryStatus = "published" | "draft" | "archived";

// Categories are admin-managed rows (not a fixed union) so the Categories tab can
// add/rename/retire them. Products reference a category by its English name
// (name.en) — the language-stable key kept in sync on rename (see library/action.ts).
export type CategoryStatus = "active" | "inactive";

// ─── View types (camelCase) used throughout the dashboard UI ─────────────────
export interface LibraryCategory {
  id: string;
  name: LangText; // per-language display name; name.en is the value products reference
  slug: string;
  icon: string; // DashIcon name
  status: CategoryStatus;
  sortOrder: number;
  createdAt?: string;
}

export interface LibraryProduct {
  id: string;
  name: LangText; // per-language product name
  description: LangText; // per-language description
  barcode: string; // EAN-13 — Algeria's GS1 prefix is 613
  brand: string;
  category: string; // references LibraryCategory.name.en
  unit: string; // e.g. "1L Bottle", "125g", "piece"
  photos: string[]; // public URLs in the `library` Storage bucket (or pasted URLs); up to MAX_PRODUCT_PHOTOS
  status: LibraryStatus;
  /** How many merchant stores currently stock this catalog item (read-only metric). */
  storeCount: number;
  createdAt?: string;
}

// ─── DB row shapes (snake_case) as returned by supabase-js / PostgREST ────────
// One column per language for translatable text (see 00008_library_i18n.sql).
export interface LibraryCategoryRow {
  id: string;
  name_en: string;
  name_fr: string;
  name_ar: string;
  slug: string;
  icon: string;
  status: CategoryStatus;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface LibraryProductRow {
  id: string;
  name_en: string;
  name_fr: string;
  name_ar: string;
  description_en: string;
  description_fr: string;
  description_ar: string;
  barcode: string;
  brand: string;
  category: string;
  unit: string;
  photos: string[]; // Postgres text[] of public URLs
  status: LibraryStatus;
  store_count: number;
  created_at: string;
  updated_at: string;
}

// Form input types — id/createdAt and derived metrics are assigned server-side.
export type NewLibraryProductInput = Omit<LibraryProduct, "id" | "createdAt" | "storeCount">;
export type NewLibraryCategoryInput = Omit<LibraryCategory, "id" | "createdAt">;
