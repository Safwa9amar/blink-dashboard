import { freeUnits, pricePack } from "./pricing";
import type {
  Pack,
  PackItem,
  PackItemIssue,
  PackItemRow,
  PackProductOption,
  PackProductRow,
  PackStatus,
  PackStoreOption,
  ProductIssue,
} from "./types";

// Pricing lives in pricing.ts (mirror of blink-server's src/lib/pack-pricing.ts),
// shared with the live editor summary.

type OwnerEmbed = { first_name?: string | null; last_name?: string | null; phone_number?: string | null };
type StoreEmbed = {
  id?: string;
  name?: string | null;
  delivery_fee?: number | string | null;
  status?: string | null;
  owner?: unknown;
};

// A to-one embed can come back from PostgREST as a one-element array.
function one<T extends object>(value: unknown): Partial<T> {
  const v = value as T | T[] | null | undefined;
  return (Array.isArray(v) ? v[0] : v) ?? {};
}

const num = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** A Postgres uuid (pack, store and product ids). */
export const isUuid = (v: unknown): v is string => typeof v === "string" && UUID.test(v);

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

const itemRows = (row: Record<string, unknown>): PackItemRow[] =>
  Array.isArray(row.items) ? (row.items as PackItemRow[]) : [];

/** Every product id the packs' items point at (valid uuids only, for an `in()` filter). */
export function packProductIds(rows: Record<string, unknown>[]): string[] {
  const ids = new Set<string>();
  for (const row of rows) for (const item of itemRows(row)) if (UUID.test(item?.product_id ?? "")) ids.add(item.product_id);
  return [...ids];
}

/**
 * Why customers can't get this product in a pack, or null when it is sellable:
 * blink-server's loadVisiblePacks() only resolves available, approved products.
 */
export function productIssue(product: Pick<PackProductRow, "is_available" | "review_status">): ProductIssue | null {
  if (product.is_available !== true) return "unavailable";
  if (product.review_status !== "approved") return product.review_status === "rejected" ? "rejected" : "pending_review";
  return null;
}

/**
 * The first reason this item keeps the pack off the store page, or null — mirrors
 * blink-server: loadVisiblePacks() only resolves products of the pack's store that
 * are available and approved, and pricePack() drops the pack when any item's product
 * is unresolved or its quantity isn't a positive integer.
 */
function itemIssue(item: PackItemRow, product: PackProductRow | undefined, storeId: unknown): PackItemIssue | null {
  if (!product) return "missing";
  if (product.store_id !== storeId) return "other_store";
  const issue = productIssue(product);
  if (issue) return issue;
  const quantity = Number(item.quantity);
  if (!Number.isInteger(quantity) || quantity <= 0) return "bad_quantity";
  return null;
}

/** A `PACK_PRODUCT_SELECT` row as a product-picker option. */
export function toProductOption(product: PackProductRow): PackProductOption {
  return {
    id: product.id,
    title: product.title || "—",
    price: num(product.price),
    image: product.image || product.photos?.[0] || null,
    unit: product.unit || null,
    issue: productIssue(product),
  };
}

/** A `PACK_STORE_SELECT` row as a store-picker option. */
export function toStoreOption(row: Record<string, unknown>): PackStoreOption {
  const owner = one<OwnerEmbed>(row.owner);
  return {
    id: row.id as string,
    name: (row.name as string | null) || "—",
    deliveryFee: num(row.delivery_fee),
    status: typeof row.status === "string" ? row.status : "",
    ownerName: [owner.first_name, owner.last_name].filter(Boolean).join(" ") || null,
    ownerPhone: owner.phone_number ?? null,
  };
}

/** Maps a `PACK_SELECT` row to the view row, resolving items against `products`. */
export function toPack(row: Record<string, unknown>, products: ReadonlyMap<string, PackProductRow>): Pack {
  const store = one<StoreEmbed>(row.store);
  const owner = one<OwnerEmbed>(store.owner);

  const items: PackItem[] = itemRows(row).map((item) => {
    const product = products.get(item.product_id);
    const line = {
      unitPrice: product ? num(product.price) : 0,
      quantity: num(item.quantity),
      qtyPromo: !!item.qty_promo_enabled,
      buyQty: num(item.buy_qty),
      getQty: num(item.get_qty),
    };
    return {
      ...line,
      productId: item.product_id,
      name: product?.title ?? null,
      image: product?.image || product?.photos?.[0] || null,
      unit: product?.unit ?? null,
      freeQty: freeUnits(line),
      issue: itemIssue(item, product, row.store_id),
    };
  });

  const discountPercentRaw = num(row.discount_percent);
  const pricing = pricePack(items, !!row.discount_enabled, discountPercentRaw);

  return {
    id: row.id as string,
    storeId: row.store_id as string,
    storeName: store.name || "—",
    storeDeliveryFee: num(store.delivery_fee),
    storeStatus: typeof store.status === "string" ? store.status : "",
    merchantName: [owner.first_name, owner.last_name].filter(Boolean).join(" ") || null,
    merchantPhone: owner.phone_number ?? null,
    name: (row.name as string) || "—",
    description: (row.description as string | null) || null,
    image: (row.image as string | null) || null,
    items,
    discountPercent: pricing.discountPercent,
    discountEnabled: !!row.discount_enabled,
    discountPercentRaw,
    freeDelivery: !!row.free_delivery,
    status: row.status as PackStatus,
    reviewNote: (row.review_note as string | null) || null,
    reviewedAt: (row.reviewed_at as string | null) ?? null,
    createdAt: row.created_at as string,
    updatedAt: (row.updated_at as string | null) ?? (row.created_at as string),
    itemCount: pricing.itemCount,
    freeCount: pricing.freeCount,
    originalPrice: pricing.originalPrice,
    savings: pricing.savings,
    price: pricing.price,
    sellable: items.length > 0 && items.every((i) => i.issue === null),
  };
}
