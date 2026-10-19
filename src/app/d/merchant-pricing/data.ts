import { cache } from "react";
import { requirePathAccess } from "@/lib/auth/staff";
import { createAdminClient } from "@/lib/supabase/admin";
import { blinkApi } from "@/lib/blink-api";
import type { StaffRole } from "@/lib/auth/access";
import {
  CATALOG_PRODUCT_SELECT,
  buildPriceChangesQuery,
  toCatalogProduct,
  toPriceChangePage,
  type CatalogProduct,
  type PriceChangeFilters,
  type PriceChangePage,
} from "@/features/merchant-pricing";

// Catalog review reads, with the service-role client (RLS hides other stores'
// products from a staff session). Every loader gates on the section first, so a
// staff role without /merchant-pricing never gets merchant rows in its payload.
const SECTION = "/merchant-pricing";

export type CatalogView = "prices" | "products" | "history";

/** Rows loaded per tab; the exact total is returned alongside so the UI can say so. */
const LIMIT: Record<CatalogView, number> = { prices: 200, products: 200, history: 100 };

/** Tab badges + headline stats (exact counts). Cached: the layout and pages share it. */
export const getCatalogCounts = cache(async () => {
  await requirePathAccess(SECTION);
  const supabase = await createAdminClient();
  const count = () => supabase.from("store_products").select("id", { count: "exact", head: true });
  const [prices, products, applied, rejected] = await Promise.all([
    // Same filter as the price queue below.
    count().eq("suggestion_status", "pending").neq("review_status", "rejected"),
    count().eq("review_status", "pending"),
    count().eq("suggestion_status", "accepted"),
    count().or("suggestion_status.eq.rejected,review_status.eq.rejected"),
  ]);
  return {
    prices: prices.count ?? 0,
    products: products.count ?? 0,
    applied: applied.count ?? 0,
    rejected: rejected.count ?? 0,
  };
});

/** One tab's rows (capped at LIMIT[view]) + the exact number of matching rows. */
export async function getCatalogRows(
  view: CatalogView
): Promise<{ rows: CatalogProduct[]; total: number; error?: string }> {
  await requirePathAccess(SECTION);
  const supabase = await createAdminClient();
  const base = supabase.from("store_products").select(CATALOG_PRODUCT_SELECT, { count: "exact" });

  const query =
    view === "prices"
      ? // Suggestions outside the ±20% tolerance, oldest first. A rejected product is
        // hidden from customers whatever its price, so its suggestion doesn't queue.
        base
          .eq("suggestion_status", "pending")
          .neq("review_status", "rejected")
          .order("updated_at", { ascending: true })
      : view === "products"
        ? // Manual (non-library) products awaiting approval, oldest first.
          base.eq("review_status", "pending").order("created_at", { ascending: true })
        : // Latest decided items: price suggestions applied / rejected and rejected products.
          base
            .or("suggestion_status.in.(accepted,rejected),review_status.eq.rejected")
            .order("updated_at", { ascending: false });

  const { data, error, count } = await query.limit(LIMIT[view]);
  const rows = ((data ?? []) as Record<string, unknown>[]).map(toCatalogProduct);
  return { rows, total: count ?? rows.length, error: error?.message };
}

const PRICE_ROLES: readonly StaffRole[] = ["super_admin", "commerce_admin"];

/** The price-change log (blink-server `GET /merchant/admin/price-changes`) for one filter set. */
export async function getPriceChanges(
  filters: PriceChangeFilters
): Promise<{ data: PriceChangePage | null; error?: string }> {
  await requirePathAccess(SECTION);
  const res = await blinkApi(`/merchant/admin/price-changes?${buildPriceChangesQuery(filters)}`, {
    roles: PRICE_ROLES,
  });
  if (!res.ok) return { data: null, error: res.error };
  return { data: toPriceChangePage(res.data) };
}

/** Stores for the log's store filter. */
export async function getStoreOptions(): Promise<{ id: string; name: string }[]> {
  await requirePathAccess(SECTION);
  const supabase = await createAdminClient();
  const { data } = await supabase.from("stores").select("id, name").order("name").limit(1000);
  return ((data ?? []) as { id: string; name: string | null }[]).map((s) => ({ id: s.id, name: s.name || "—" }));
}
