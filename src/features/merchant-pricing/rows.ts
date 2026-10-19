import {
  PRICE_TOLERANCE,
  type CatalogProduct,
  type ReviewStatus,
  type SuggestionStatus,
} from "./types";

type OwnerEmbed = { first_name?: string | null; last_name?: string | null; phone_number?: string | null };
type StoreEmbed = { id?: string; name?: string | null; owner?: unknown };

// A to-one embed can come back from PostgREST as a one-element array.
function one<T extends object>(value: unknown): Partial<T> {
  const v = value as T | T[] | null | undefined;
  return (Array.isArray(v) ? v[0] : v) ?? {};
}

const num = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const fullName = (u: Partial<OwnerEmbed>) => [u.first_name, u.last_name].filter(Boolean).join(" ") || null;

/** "1,250 Da" — fixed en-US grouping so server and client render the same string. */
export function formatDa(n: number): string {
  return `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(n)} Da`;
}

/**
 * A date in the UI language, on Algiers' calendar — a fixed zone so the server
 * render and the browser hydrate the same day.
 */
export function formatDate(iso: string, locale: string): string {
  return new Date(iso).toLocaleDateString(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "Africa/Algiers",
  });
}

/** Date + time in the UI language, on Algiers' clock (fixed zone: same string on server and client). */
export function formatDateTime(iso: string, locale: string): string {
  return new Date(iso).toLocaleString(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Africa/Algiers",
  });
}

export const isOverTolerance = (deviation: number | null) =>
  deviation !== null && Math.abs(deviation) > PRICE_TOLERANCE * 100;

/** Maps a `CATALOG_PRODUCT_SELECT` row to the view row. */
export function toCatalogProduct(row: Record<string, unknown>): CatalogProduct {
  const store = one<StoreEmbed>(row.store);
  const owner = one<OwnerEmbed>(store.owner);

  const image = (row.image as string | null) || "";
  const photos = [image, ...((row.photos as string[] | null) ?? [])].filter(
    (src, i, all) => !!src && all.indexOf(src) === i
  );

  const price = num(row.price);
  const blinkPrice = num(row.blink_price);
  const suggestedPrice = row.suggested_price == null ? null : num(row.suggested_price);
  const referencePrice = blinkPrice > 0 ? blinkPrice : price;
  const deviation =
    suggestedPrice !== null && referencePrice > 0
      ? ((suggestedPrice - referencePrice) / referencePrice) * 100
      : null;

  return {
    id: row.id as string,
    storeId: row.store_id as string,
    storeName: store.name || "—",
    merchantName: fullName(owner),
    merchantPhone: owner.phone_number ?? null,
    title: (row.title as string) || "—",
    description: (row.description as string | null) || null,
    brand: (row.brand as string) || "",
    barcode: (row.barcode as string) || "",
    category: (row.category as string) || "",
    unit: (row.unit as string | null) || null,
    stock: num(row.stock),
    photos,
    price,
    blinkPrice,
    suggestedPrice,
    suggestionStatus: (row.suggestion_status as SuggestionStatus | null) ?? null,
    reviewStatus: ((row.review_status as ReviewStatus | null) ?? "approved") as ReviewStatus,
    reviewNote: (row.review_note as string | null) || null,
    fromLibrary: !!row.library_product_id,
    isAvailable: row.is_available !== false,
    createdAt: row.created_at as string,
    updatedAt: (row.updated_at as string | null) ?? (row.created_at as string),
    referencePrice,
    deviation,
  };
}
