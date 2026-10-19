import { cache } from "react";
import { requirePathAccess } from "@/lib/auth/staff";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  PACK_PRODUCT_SELECT,
  PACK_SELECT,
  PACK_STATUS_KEYS,
  PACK_STORE_SELECT,
  isUuid,
  packProductIds,
  toPack,
  toProductOption,
  toStoreOption,
  type Pack,
  type PackCounts,
  type PackProductOption,
  type PackProductRow,
  type PackStatus,
  type PackStoreOption,
} from "@/features/packs-management";

// Pack reads, with the service-role client (RLS hides inactive stores). Every
// loader gates on the section first, so a staff role without /packs-management
// never gets merchant rows in its payload.
const SECTION = "/packs-management";

/** Packs loaded per tab; the exact total is returned alongside so the UI can say so. */
const LIMIT = 500;
/** Stores in the create flow's picker, and products of one store in the product picker. */
const STORE_LIMIT = 2000;
const PRODUCT_LIMIT = 2000;

type Admin = Awaited<ReturnType<typeof createAdminClient>>;

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
  const { products, error: productError } = await itemProducts(supabase, rows);
  if (productError) return { packs: [], total: 0, error: productError };

  return { packs: rows.map((row) => toPack(row, products)), total: count ?? rows.length };
}

/** The products the packs' items point at, by id (any store — toPack flags strays). */
async function itemProducts(
  supabase: Admin,
  rows: Record<string, unknown>[]
): Promise<{ products: Map<string, PackProductRow>; error?: string }> {
  const ids = packProductIds(rows);
  // Batched: the ids travel in the request URL, which has a length limit.
  const batches: string[][] = [];
  for (let i = 0; i < ids.length; i += 100) batches.push(ids.slice(i, i + 100));
  const results = await Promise.all(
    batches.map((batch) => supabase.from("store_products").select(PACK_PRODUCT_SELECT).in("id", batch))
  );
  const products = new Map<string, PackProductRow>();
  for (const { data: productRows, error } of results) {
    if (error) return { products, error: error.message };
    for (const p of (productRows ?? []) as PackProductRow[]) products.set(p.id, p);
  }
  return { products };
}

/** One pack for the editor; `pack: null` without an error = no such pack (or not a uuid). */
export async function getPack(id: string): Promise<{ pack: Pack | null; error?: string }> {
  await requirePathAccess(SECTION);
  if (!isUuid(id)) return { pack: null };
  const supabase = await createAdminClient();
  const { data, error } = await supabase.from("store_packs").select(PACK_SELECT).eq("id", id).maybeSingle();
  if (error) return { pack: null, error: error.message };
  if (!data) return { pack: null };
  const row = data as Record<string, unknown>;
  const { products, error: productError } = await itemProducts(supabase, [row]);
  if (productError) return { pack: null, error: productError };
  return { pack: toPack(row, products) };
}

/** Every store (any status) for the create flow's store picker, by name. */
export async function getPackStores(): Promise<{ stores: PackStoreOption[]; error?: string }> {
  await requirePathAccess(SECTION);
  const supabase = await createAdminClient();
  const { data, error } = await supabase
    .from("stores")
    .select(PACK_STORE_SELECT)
    .order("name", { ascending: true })
    .limit(STORE_LIMIT);
  if (error) return { stores: [], error: error.message };
  return { stores: ((data ?? []) as Record<string, unknown>[]).map(toStoreOption) };
}

/**
 * One store's products for the product picker, sellable or not (the picker shows
 * why the others can't go in a pack). Callers check the store id is a uuid.
 */
export async function getStoreProducts(storeId: string): Promise<{ products: PackProductOption[]; error?: string }> {
  await requirePathAccess(SECTION);
  const supabase = await createAdminClient();
  const { data, error } = await supabase
    .from("store_products")
    .select(PACK_PRODUCT_SELECT)
    .eq("store_id", storeId)
    .order("title", { ascending: true })
    .limit(PRODUCT_LIMIT);
  if (error) return { products: [], error: error.message };
  return { products: ((data ?? []) as PackProductRow[]).map(toProductOption) };
}
