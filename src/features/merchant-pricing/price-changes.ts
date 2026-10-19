// Price-change history (blink-server `GET /merchant/admin/price-changes`, tag
// `admin-merchant`). The dashboard only displays what the server recorded; the
// helpers here map the snake_case rows to the view model, build the query and
// work out the % move for display.
import type { Variant } from "@/components/ui";

export const PRICE_SOURCES = ["created", "merchant", "staff", "library", "system", "baseline"] as const;
export type PriceSource = (typeof PRICE_SOURCES)[number];

export const PRICE_SOURCE_VARIANT: Record<PriceSource, Variant> = {
  created: "info",
  merchant: "default",
  staff: "primary",
  library: "info",
  system: "warning",
  baseline: "default",
};

/** Server page size of the log page; the modals ask for the latest `MODAL_LIMIT`. */
export const PAGE_LIMIT = 50;
export const MODAL_LIMIT = 20;

export interface PriceChange {
  id: string;
  productId: string;
  productTitle: string;
  storeId: string;
  storeName: string;
  /** `null` = no earlier price (created / baseline). */
  oldPrice: number | null;
  newPrice: number;
  oldBlinkPrice: number | null;
  newBlinkPrice: number;
  source: PriceSource;
  changedAt: string;
  changedBy: { id: string; name: string | null } | null;
}

export interface PriceChangePage {
  changes: PriceChange[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const num = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};
const numOrNull = (v: unknown) => (v == null ? null : num(v));

/** Maps an `AdminPriceChange` (snake_case) to the view row. */
export function toPriceChange(row: Record<string, unknown>): PriceChange {
  const by = row.changed_by as { id?: unknown; name?: unknown } | null | undefined;
  const source = PRICE_SOURCES.includes(row.source as PriceSource) ? (row.source as PriceSource) : "system";
  return {
    id: String(row.id),
    productId: String(row.product_id),
    productTitle: (row.product_title as string | null) || "—",
    storeId: String(row.store_id),
    storeName: (row.store_name as string | null) || "—",
    oldPrice: numOrNull(row.old_price),
    newPrice: num(row.new_price),
    oldBlinkPrice: numOrNull(row.old_blink_price),
    newBlinkPrice: num(row.new_blink_price),
    source,
    changedAt: String(row.changed_at),
    changedBy: by && by.id ? { id: String(by.id), name: (by.name as string | null) ?? null } : null,
  };
}

/** Maps an `AdminPriceChangeListResponse` body. `total_pages` isn't in the contract: derived. */
export function toPriceChangePage(body: unknown): PriceChangePage {
  const b = (body ?? {}) as { changes?: Record<string, unknown>[]; pagination?: Record<string, unknown> };
  const limit = Math.max(1, num(b.pagination?.limit) || PAGE_LIMIT);
  const total = num(b.pagination?.total);
  return {
    changes: (b.changes ?? []).map(toPriceChange),
    page: Math.max(1, num(b.pagination?.page) || 1),
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

/** Signed % move from the old price; `null` when there's no usable earlier price. */
export function percentChange(oldPrice: number | null, newPrice: number): number | null {
  if (oldPrice === null || oldPrice <= 0) return null;
  return ((newPrice - oldPrice) / oldPrice) * 100;
}

export type PriceDirection = "up" | "down" | "same" | "none";
export function priceDirection(oldPrice: number | null, newPrice: number): PriceDirection {
  if (oldPrice === null) return "none";
  return newPrice > oldPrice ? "up" : newPrice < oldPrice ? "down" : "same";
}

/** The Blink reference price moved (and had an earlier value). */
export const blinkMoved = (c: Pick<PriceChange, "oldBlinkPrice" | "newBlinkPrice">) =>
  c.oldBlinkPrice !== null && c.oldBlinkPrice !== c.newBlinkPrice;

export interface PriceChangeFilters {
  page: number;
  storeId?: string;
  source?: PriceSource;
  /** yyyy-mm-dd, Algiers calendar day (inclusive). */
  from?: string;
  /** yyyy-mm-dd, Algiers calendar day (inclusive in the UI; sent as the next day, exclusive). */
  to?: string;
}

const DAY = /^\d{4}-\d{2}-\d{2}$/;
const ID = /^[\w-]{1,64}$/;

const str = (v: string | string[] | undefined) => (typeof v === "string" ? v : undefined);

/** Validates URL search params into filters (anything invalid is dropped). */
export function parseFilters(sp: Record<string, string | string[] | undefined>): PriceChangeFilters {
  const page = Number(str(sp.page));
  const source = str(sp.source);
  const store = str(sp.store);
  const from = str(sp.from);
  const to = str(sp.to);
  const validDay = (d?: string) => (d && DAY.test(d) && !Number.isNaN(Date.parse(d)) ? d : undefined);
  return {
    page: Number.isInteger(page) && page > 0 ? page : 1,
    storeId: store && ID.test(store) ? store : undefined,
    source: PRICE_SOURCES.includes(source as PriceSource) ? (source as PriceSource) : undefined,
    from: validDay(from),
    to: validDay(to),
  };
}

/** Algeria is UTC+1 all year (no DST): the start of an Algiers day as an ISO instant. */
export function algiersDayStart(day: string, addDays = 0): string {
  const d = new Date(`${day}T00:00:00+01:00`);
  d.setUTCDate(d.getUTCDate() + addDays);
  return d.toISOString();
}

/** Query string for the server call (`from` inclusive, `to` exclusive). */
export function buildPriceChangesQuery(
  f: PriceChangeFilters & { productId?: string },
  limit: number = PAGE_LIMIT
): string {
  const q = new URLSearchParams({ page: String(f.page), limit: String(limit) });
  if (f.storeId) q.set("store_id", f.storeId);
  if (f.productId) q.set("product_id", f.productId);
  if (f.source) q.set("source", f.source);
  if (f.from) q.set("from", algiersDayStart(f.from));
  if (f.to) q.set("to", algiersDayStart(f.to, 1));
  return q.toString();
}
