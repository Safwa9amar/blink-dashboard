import type { Lang, Variant } from "@/components/ui";
import type {
  LangText,
  LibraryStatus,
  CategoryStatus,
  LibraryCategory,
  LibraryProduct,
  LibraryCategoryRow,
  LibraryProductRow,
  NewLibraryProductInput,
  NewLibraryCategoryInput,
} from "./types";

export type {
  TFn,
  LangText,
  LibraryStatus,
  CategoryStatus,
  LibraryCategory,
  LibraryProduct,
  LibraryCategoryRow,
  LibraryProductRow,
  NewLibraryProductInput,
  NewLibraryCategoryInput,
} from "./types";

export { MAX_PRODUCT_PHOTOS } from "./types";

// Resolve a per-language field to a display string for the active locale, falling
// back to whichever language is filled (en → fr → ar) so a half-translated row
// never renders blank.
export function pickLang(field: LangText | undefined, locale: string): string {
  const l = (locale === "fr" || locale === "ar" ? locale : "en") as Lang;
  return field?.[l]?.trim() || field?.en?.trim() || field?.fr?.trim() || field?.ar?.trim() || "";
}

export const LIBRARY_STATUS: Record<LibraryStatus, Variant> = {
  published: "success",
  draft: "warning",
  archived: "default",
};
export const LIBRARY_STATUS_KEYS: LibraryStatus[] = ["published", "draft", "archived"];

export const CATEGORY_STATUS: Record<CategoryStatus, Variant> = {
  active: "success",
  inactive: "default",
};
export const CATEGORY_STATUS_KEYS: CategoryStatus[] = ["active", "inactive"];

// Build a per-language record from the three snake_case language columns,
// tolerating nulls from rows written before the i18n migration backfilled them.
function langFromRow(en?: string | null, fr?: string | null, ar?: string | null): LangText {
  return { en: en ?? "", fr: fr ?? "", ar: ar ?? "" };
}

// ─── Row (snake_case DB) → view (camelCase) mappers ──────────────────────────
export function mapCategoryRow(r: LibraryCategoryRow): LibraryCategory {
  return {
    id: r.id,
    name: langFromRow(r.name_en, r.name_fr, r.name_ar),
    slug: r.slug,
    icon: r.icon,
    status: r.status,
    sortOrder: r.sort_order,
    createdAt: r.created_at,
  };
}

export function mapProductRow(r: LibraryProductRow): LibraryProduct {
  return {
    id: r.id,
    name: langFromRow(r.name_en, r.name_fr, r.name_ar),
    description: langFromRow(r.description_en, r.description_fr, r.description_ar),
    barcode: r.barcode,
    brand: r.brand,
    category: r.category,
    unit: r.unit,
    photos: Array.isArray(r.photos) ? r.photos.filter(Boolean) : [],
    status: r.status,
    storeCount: r.store_count,
    createdAt: r.created_at,
  };
}

// ─── View (camelCase) → DB insert/update payload (snake_case) ─────────────────
// Per-language fields fan out into one column per language; only keys present on
// the input are written, so partial PATCH updates stay partial.
export function toProductPayload(input: Partial<NewLibraryProductInput>) {
  const p: Record<string, unknown> = {};
  if (input.name !== undefined) {
    p.name_en = input.name.en ?? "";
    p.name_fr = input.name.fr ?? "";
    p.name_ar = input.name.ar ?? "";
  }
  if (input.description !== undefined) {
    p.description_en = input.description.en ?? "";
    p.description_fr = input.description.fr ?? "";
    p.description_ar = input.description.ar ?? "";
  }
  if (input.barcode !== undefined) p.barcode = input.barcode;
  if (input.brand !== undefined) p.brand = input.brand;
  if (input.category !== undefined) p.category = input.category;
  if (input.unit !== undefined) p.unit = input.unit;
  if (input.photos !== undefined) p.photos = input.photos;
  if (input.status !== undefined) p.status = input.status;
  return p;
}

export function toCategoryPayload(input: Partial<NewLibraryCategoryInput>) {
  const p: Record<string, unknown> = {};
  if (input.name !== undefined) {
    p.name_en = input.name.en ?? "";
    p.name_fr = input.name.fr ?? "";
    p.name_ar = input.name.ar ?? "";
  }
  if (input.slug !== undefined) p.slug = input.slug;
  if (input.icon !== undefined) p.icon = input.icon;
  if (input.status !== undefined) p.status = input.status;
  if (input.sortOrder !== undefined) p.sort_order = input.sortOrder;
  return p;
}

export interface LibraryStats {
  totalProducts: number;
  published: number;
  categories: number;
  stockedByStores: number;
}

// Count how many catalog items reference a given category (by its English name).
export function productCountFor(products: LibraryProduct[], categoryName: string) {
  return products.filter((p) => p.category === categoryName).length;
}

// Headline stats for the catalog header — derived from the already-fetched rows
// (both list views load products + categories, so no extra query is needed).
export function deriveLibraryStats(
  products: LibraryProduct[],
  categories: LibraryCategory[]
): LibraryStats {
  return {
    totalProducts: products.length,
    published: products.filter((p) => p.status === "published").length,
    categories: categories.length,
    stockedByStores: products.reduce((a, p) => a + (p.storeCount ?? 0), 0),
  };
}
