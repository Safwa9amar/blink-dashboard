import { cache } from "react";
import { requirePathAccess } from "@/lib/auth/staff";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  PACK_PRODUCT_SELECT,
  PACK_SELECT,
  PACK_STATUS_KEYS,
  packProductIds,
  toPack,
  type Pack,
  type PackCounts,
  type PackProductRow,
  type PackStatus,
} from "@/features/packs-management";

// Pack reads, with the service-role client (RLS hides inactive stores). Every
// loader gates on the section first, so a staff role without /packs-management
// never gets merchant rows in its payload.
const SECTION = "/packs-management";

/** Packs loaded per tab; the exact total is returned alongside so the UI can say so. */
const LIMIT = 500;

/** Exact counts per status — headline stats, tab badges and the "All" pills. Cached per request. */
export const getPackCounts = cache(async (): Promise<PackCounts> => {
  await requirePathAccess(SECTION);
  const supabase = await createAdminClient();
  const count = () => supabase.from("store_packs").select("id", { count: "exact", head: true });
  const [totalRes, freeRes, ...statusRes] = await Promise.all([
    count(),
    count().eq("status", "active").eq("free_delivery", true),
    ...PACK_STATUS_KEYS.map((status) => count().eq("status", status)),
  ]);
  const byStatus = Object.fromEntries(
    PACK_STATUS_KEYS.map((status, i) => [status, statusRes[i].count ?? 0])
  ) as Record<PackStatus, number>;
  return { total: totalRes.count ?? 0, freeDeliveryActive: freeRes.count ?? 0, byStatus };
});

// Items keep only product ids, so titles, photos, live prices and sellability
// (store, availability, review status) are resolved here in one extra query.
export async function getPacks(
  status?: PackStatus
): Promise<{ packs: Pack[]; total: number; error?: string }> {
  await requirePathAccess(SECTION);
  const supabase = await createAdminClient();
  let query = supabase.from("store_packs").select(PACK_SELECT, { count: "exact" });
  query = status
    ? query.eq("status", status).order("updated_at", { ascending: true })
    : query.order("updated_at", { ascending: false });
  const { data, error, count } = await query.limit(LIMIT);
  if (error) return { packs: [], total: 0, error: error.message };

  const rows = (data ?? []) as Record<string, unknown>[];
  const ids = packProductIds(rows);
  // Batched: the ids travel in the request URL, which has a length limit.
  const batches: string[][] = [];
  for (let i = 0; i < ids.length; i += 100) batches.push(ids.slice(i, i + 100));
  const results = await Promise.all(
    batches.map((batch) => supabase.from("store_products").select(PACK_PRODUCT_SELECT).in("id", batch))
  );
  const products = new Map<string, PackProductRow>();
  for (const { data: productRows, error: productError } of results) {
    if (productError) return { packs: [], total: 0, error: productError.message };
    for (const p of (productRows ?? []) as PackProductRow[]) products.set(p.id, p);
  }

  return { packs: rows.map((row) => toPack(row, products)), total: count ?? rows.length };
}
