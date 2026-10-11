import type { Pack, PackItem, PackItemIssue, PackItemRow, PackProductRow, PackStatus } from "./types";

// Pricing mirrors blink-server's src/lib/pack-pricing.ts (what the customer is
// charged): original = Σ live price × qty, minus the % discount when enabled;
// buy-X-get-Y free units are given on top and never charged.

type OwnerEmbed = { first_name?: string | null; last_name?: string | null; phone_number?: string | null };
type StoreEmbed = { id?: string; name?: string | null; delivery_fee?: number | string | null; owner?: unknown };

// A to-one embed can come back from PostgREST as a one-element array.
function one<T extends object>(value: unknown): Partial<T> {
  const v = value as T | T[] | null | undefined;
  return (Array.isArray(v) ? v[0] : v) ?? {};
}

const num = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const round2 = (n: number) => Math.round(n * 100) / 100;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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

/** Buy-X-get-Y: free units given on top of `quantity`. */
function freeUnits(item: PackItemRow): number {
  const buy = num(item.buy_qty);
  const get = num(item.get_qty);
  if (!item.qty_promo_enabled || !(buy > 0) || !(get > 0)) return 0;
  return Math.floor(num(item.quantity) / buy) * get;
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
  if (product.is_available !== true) return "unavailable";
  if (product.review_status !== "approved") return product.review_status === "rejected" ? "rejected" : "pending_review";
  const quantity = Number(item.quantity);
  if (!Number.isInteger(quantity) || quantity <= 0) return "bad_quantity";
  return null;
}

/** Maps a `PACK_SELECT` row to the view row, resolving items against `products`. */
export function toPack(row: Record<string, unknown>, products: ReadonlyMap<string, PackProductRow>): Pack {
  const store = one<StoreEmbed>(row.store);
  const owner = one<OwnerEmbed>(store.owner);

  const items: PackItem[] = itemRows(row).map((item) => {
    const product = products.get(item.product_id);
    return {
      productId: item.product_id,
      name: product?.title ?? null,
      image: product?.image || product?.photos?.[0] || null,
      unit: product?.unit ?? null,
      unitPrice: product ? num(product.price) : 0,
      quantity: num(item.quantity),
      freeQty: freeUnits(item),
      qtyPromo: !!item.qty_promo_enabled,
      buyQty: num(item.buy_qty),
      getQty: num(item.get_qty),
      issue: itemIssue(item, product, row.store_id),
    };
  });

  const pct = num(row.discount_percent);
  const discountPercent = row.discount_enabled && pct > 0 ? pct : 0;
  const originalPrice = round2(items.reduce((s, i) => s + i.unitPrice * i.quantity, 0));
  const savings = discountPercent > 0 ? Math.round((originalPrice * discountPercent) / 100) : 0;

  return {
    id: row.id as string,
    storeId: row.store_id as string,
    storeName: store.name || "—",
    storeDeliveryFee: num(store.delivery_fee),
    merchantName: [owner.first_name, owner.last_name].filter(Boolean).join(" ") || null,
    merchantPhone: owner.phone_number ?? null,
    name: (row.name as string) || "—",
    description: (row.description as string | null) || null,
    image: (row.image as string | null) || null,
    items,
    discountPercent,
    freeDelivery: !!row.free_delivery,
    status: row.status as PackStatus,
    reviewNote: (row.review_note as string | null) || null,
    reviewedAt: (row.reviewed_at as string | null) ?? null,
    createdAt: row.created_at as string,
    updatedAt: (row.updated_at as string | null) ?? (row.created_at as string),
    itemCount: items.reduce((s, i) => s + i.quantity, 0),
    freeCount: items.reduce((s, i) => s + i.freeQty, 0),
    originalPrice,
    savings,
    price: round2(originalPrice - savings),
    sellable: items.length > 0 && items.every((i) => i.issue === null),
  };
}
