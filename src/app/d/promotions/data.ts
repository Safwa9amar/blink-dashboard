// Server-side loaders for the promotions pages. Service-role reads (promotion_events
// and the stats RPCs are service-role only). Never import from a client component.
import { createAdminClient } from "@/lib/supabase/admin";
import {
  EMPTY_STATS,
  type PromotionCouponRow,
  type PromotionDay,
  type PromotionListItem,
  type PromotionRow,
  type PromotionStats,
  type StoreOption,
} from "@/features/promotions";

type Admin = Awaited<ReturnType<typeof createAdminClient>>;

/**
 * Start of the N-day window as Africa/Algiers midnight of (today - (N-1)) days,
 * the same buckets as promotion_daily(p_days = N). Algiers is UTC+1, no DST.
 */
export function daysAgoISO(days: number, now: Date = new Date()): string {
  const DAY = 24 * 60 * 60 * 1000;
  // Shift to Algiers wall-clock, floor to its midnight, step back, shift back.
  const algiersNow = now.getTime() + 60 * 60 * 1000;
  const algiersMidnight = Math.floor(algiersNow / DAY) * DAY;
  return new Date(algiersMidnight - (days - 1) * DAY - 60 * 60 * 1000).toISOString();
}

const n = (v: unknown): number => (v == null ? 0 : Number(v));

function toStats(r: Record<string, unknown>): PromotionStats {
  return {
    promotion_id: String(r.promotion_id),
    views: n(r.views),
    reach: n(r.reach),
    taps: n(r.taps),
    tappers: n(r.tappers),
    issued: n(r.issued),
    used: n(r.used),
    discount_given: n(r.discount_given),
    orders: n(r.orders),
    revenue: n(r.revenue),
  };
}

function toRow(r: Record<string, unknown>): PromotionRow {
  return {
    ...(r as unknown as PromotionRow),
    discount_value: n(r.discount_value),
    min_order: n(r.min_order),
    max_discount: r.max_discount == null ? null : n(r.max_discount),
    max_coupons: r.max_coupons == null ? null : n(r.max_coupons),
    discount_budget: r.discount_budget == null ? null : n(r.discount_budget),
    archived_at: (r.archived_at as string | null) ?? null,
    created_by: (r.created_by as string | null) ?? null,
  };
}

export async function fetchStats(supabase: Admin, fromIso?: string): Promise<{ rows: PromotionStats[]; error?: string }> {
  const { data, error } = await supabase.rpc("promotion_stats", fromIso ? { p_from: fromIso } : {});
  if (error) return { rows: [], error: error.message };
  return { rows: ((data ?? []) as Record<string, unknown>[]).map(toStats) };
}

export async function fetchDaily(
  supabase: Admin,
  promotion: string | null,
  days: number
): Promise<{ rows: PromotionDay[]; error?: string }> {
  const { data, error } = await supabase.rpc("promotion_daily", { p_promotion: promotion, p_days: days });
  if (error) return { rows: [], error: error.message };
  const rows = ((data ?? []) as Record<string, unknown>[]).map((r) => ({
    day: String(r.day),
    views: n(r.views),
    taps: n(r.taps),
    issued: n(r.issued),
    used: n(r.used),
    discount_given: n(r.discount_given),
  }));
  return { rows };
}

export async function fetchPromotions(supabase: Admin): Promise<{ rows: PromotionRow[]; error?: string }> {
  const { data, error } = await supabase
    .from("promotions")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false })
    .limit(1000);
  if (error) return { rows: [], error: error.message };
  return { rows: ((data ?? []) as Record<string, unknown>[]).map(toRow) };
}

export interface PromotionListData {
  items: PromotionListItem[];
  stats30: PromotionStats[];
  error?: string;
}

export async function loadPromotionList(): Promise<PromotionListData> {
  const supabase = await createAdminClient();
  const [promos, all, last30] = await Promise.all([
    fetchPromotions(supabase),
    fetchStats(supabase),
    fetchStats(supabase, daysAgoISO(30)),
  ]);
  const byId = new Map(all.rows.map((s) => [s.promotion_id, s]));
  const items = promos.rows.map((row) => ({ row, stats: byId.get(row.id) ?? EMPTY_STATS(row.id) }));
  return { items, stats30: last30.rows, error: promos.error ?? all.error ?? last30.error };
}

export async function loadStores(): Promise<StoreOption[]> {
  const supabase = await createAdminClient();
  const { data } = await supabase.from("stores").select("id, name").order("name", { ascending: true }).limit(1000);
  return ((data ?? []) as StoreOption[]).map((s) => ({ id: s.id, name: s.name }));
}

/** Distinct Top Deals categories already in use (suggestions for the deal category input). */
export async function loadDealCategories(): Promise<string[]> {
  const supabase = await createAdminClient();
  const { data } = await supabase.from("promotions").select("category").eq("kind", "deal").limit(1000);
  const set = new Set<string>();
  for (const r of (data ?? []) as { category: string | null }[]) {
    const c = r.category?.trim();
    if (c) set.add(c);
  }
  return [...set].sort((a, b) => a.localeCompare(b));
}

export interface PromotionDetailData {
  row: PromotionRow | null;
  stats: PromotionStats;
  daily: PromotionDay[];
  coupons: PromotionCouponRow[];
  error?: string;
}

export async function loadPromotionDetail(id: string): Promise<PromotionDetailData> {
  const supabase = await createAdminClient();
  const { data, error } = await supabase.from("promotions").select("*").eq("id", id).maybeSingle();
  if (error || !data) {
    return { row: null, stats: EMPTY_STATS(id), daily: [], coupons: [], error: error?.message };
  }
  const [stats, daily, couponsRes] = await Promise.all([
    fetchStats(supabase),
    fetchDaily(supabase, id, 30),
    supabase
      .from("customer_coupons")
      .select("id, code, user_id, created_at, used_at, revoked_at, expires_at")
      .eq("promotion_id", id)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);
  const cRows = (couponsRes.data ?? []) as {
    id: string;
    code: string;
    user_id: string;
    created_at: string;
    used_at: string | null;
    revoked_at: string | null;
    expires_at: string | null;
  }[];
  const userIds = [...new Set(cRows.map((c) => c.user_id))];
  const names = new Map<string, string>();
  if (userIds.length) {
    const { data: us } = await supabase.from("users").select("id, first_name, last_name, phone_number").in("id", userIds);
    for (const u of (us ?? []) as { id: string; first_name: string | null; last_name: string | null; phone_number: string | null }[]) {
      names.set(u.id, [u.first_name, u.last_name].filter(Boolean).join(" ") || u.phone_number || "—");
    }
  }
  const coupons: PromotionCouponRow[] = cRows.map((c) => ({
    id: c.id,
    code: c.code,
    user_name: names.get(c.user_id) ?? "—",
    created_at: c.created_at,
    used_at: c.used_at,
    revoked_at: c.revoked_at,
    expires_at: c.expires_at,
  }));
  return {
    row: toRow(data as Record<string, unknown>),
    stats: stats.rows.find((s) => s.promotion_id === id) ?? EMPTY_STATS(id),
    daily: daily.rows,
    coupons,
    error: stats.error ?? daily.error ?? couponsRes.error?.message,
  };
}

export interface AnalyticsData {
  days: number;
  daily: PromotionDay[];
  items: PromotionListItem[];
  error?: string;
}

export async function loadAnalytics(days: number): Promise<AnalyticsData> {
  const supabase = await createAdminClient();
  const [promos, stats, daily] = await Promise.all([
    fetchPromotions(supabase),
    fetchStats(supabase, daysAgoISO(days)),
    fetchDaily(supabase, null, days),
  ]);
  const byId = new Map(stats.rows.map((s) => [s.promotion_id, s]));
  const items = promos.rows.map((row) => ({ row, stats: byId.get(row.id) ?? EMPTY_STATS(row.id) }));
  return { days, daily: daily.rows, items, error: promos.error ?? stats.error ?? daily.error };
}
