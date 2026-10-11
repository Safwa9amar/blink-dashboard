// Server-side loader for the Home page. Each block is independent: a failing query
// becomes `{ error }` for that block only; blocks the role can't access are omitted.
import { canAccessPath, type StaffRole } from "@/lib/auth/access";
import { MODULES } from "@/lib/nav/modules";
import { getAttentionCounts } from "@/lib/shell/attention";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ActivityItem, AttentionRow, Block, CashKpi, DayPoint, OrdersKpi, OverviewData, Pipeline, RidersKpi } from "./types";

type Admin = Awaited<ReturnType<typeof createAdminClient>>;

const TZ = "Africa/Algiers";
const DAY_MS = 86_400_000;
const FAILED = ["canceled", "merchant_rejected"] as const;

/** `YYYY-MM-DD` of an instant in Algiers. */
function algiersDate(d: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
}
// Algeria is UTC+1 all year (no DST), so local midnight is `T00:00:00+01:00`.
const midnight = (date: string) => new Date(`${date}T00:00:00+01:00`);

async function settle<T>(p: Promise<T>): Promise<Block<T>> {
  try {
    return { data: await p };
  } catch (e) {
    console.error("[overview]", e);
    return { error: e instanceof Error ? e.message : "error" };
  }
}

async function cnt(q: PromiseLike<{ count: number | null; error: { message: string } | null }>): Promise<number> {
  const { count, error } = await q;
  if (error) throw new Error(error.message);
  return count ?? 0;
}

/** Sum a numeric column across pages (PostgREST caps a response at ~1000 rows). */
async function sumTotals(
  db: Admin,
  table: "orders" | "transactions",
  since: string,
  status: { eq: string } | { notIn: readonly string[] }
): Promise<{ sum: number; n: number }> {
  let sum = 0;
  let n = 0;
  for (let from = 0; from < 20_000; from += 1000) {
    const base = db.from(table).select("total").gte("created_at", since);
    const { data, error } = await ("eq" in status ? base.eq("status", status.eq) : base.not("status", "in", `(${status.notIn.join(",")})`)).range(from, from + 999);
    if (error) throw new Error(error.message);
    const rows = (data ?? []) as { total: number | string | null }[];
    for (const r of rows) sum += Number(r.total ?? 0);
    n += rows.length;
    if (rows.length < 1000) break;
  }
  return { sum, n };
}

async function loadOrdersToday(db: Admin, since: string): Promise<OrdersKpi> {
  const [count, agg] = await Promise.all([
    cnt(db.from("orders").select("id", { count: "exact", head: true }).gte("created_at", since)),
    sumTotals(db, "orders", since, { notIn: FAILED }),
  ]);
  return { count, value: agg.sum };
}

async function loadRiders(db: Admin): Promise<RidersKpi> {
  const [available, total] = await Promise.all([
    cnt(db.from("rider_profiles").select("id", { count: "exact", head: true }).eq("is_available", true)),
    cnt(db.from("rider_profiles").select("id", { count: "exact", head: true })),
  ]);
  return { available, total };
}

async function loadCash(db: Admin, since: string): Promise<CashKpi> {
  const agg = await sumTotals(db, "transactions", since, { eq: "completed" });
  return { total: agg.sum, count: agg.n };
}

async function loadChart(db: Admin, today: string): Promise<DayPoint[]> {
  const start = midnight(today).getTime() - 13 * DAY_MS;
  const days = Array.from({ length: 14 }, (_, i) => new Date(start + i * DAY_MS));
  return Promise.all(
    days.map(async (d) => {
      const from = d.toISOString();
      const to = new Date(d.getTime() + DAY_MS).toISOString();
      const base = () => db.from("orders").select("id", { count: "exact", head: true }).gte("created_at", from).lt("created_at", to);
      const [delivered, failed] = await Promise.all([cnt(base().eq("status", "delivered")), cnt(base().in("status", [...FAILED]))]);
      return { day: algiersDate(new Date(d.getTime() + 3_600_000)), delivered, failed };
    })
  );
}

async function loadPipeline(db: Admin, since: string): Promise<Pipeline> {
  const live = ["searching", "heading_to_store", "preparation", "pickup", "on_the_way"] as const;
  const [counts, deliveredToday] = await Promise.all([
    Promise.all(live.map((s) => cnt(db.from("orders").select("id", { count: "exact", head: true }).eq("status", s)))),
    cnt(db.from("orders").select("id", { count: "exact", head: true }).eq("status", "delivered").gte("created_at", since)),
  ]);
  return {
    searching: counts[0], heading_to_store: counts[1], preparation: counts[2], pickup: counts[3], on_the_way: counts[4],
    deliveredToday,
  };
}

async function loadActivity(db: Admin, withOrders: boolean, withCash: boolean): Promise<ActivityItem[]> {
  const [orders, txs] = await Promise.all([
    withOrders ? db.from("orders").select("id, store_name, status, total, created_at").order("created_at", { ascending: false }).limit(8) : null,
    withCash ? db.from("transactions").select("id, type, status, total, created_at").order("created_at", { ascending: false }).limit(8) : null,
  ]);
  if (orders?.error) throw new Error(orders.error.message);
  if (txs?.error) throw new Error(txs.error.message);
  const items: ActivityItem[] = [
    ...(orders?.data ?? []).map((o) => ({ kind: "order" as const, id: o.id as string, title: o.store_name as string, status: o.status as string, amount: Number(o.total ?? 0), at: o.created_at as string })),
    ...(txs?.data ?? []).map((t) => ({ kind: "transaction" as const, id: t.id as string, title: String(t.type).replace(/_/g, " "), status: t.status as string, amount: Number(t.total ?? 0), at: t.created_at as string })),
  ];
  return items.sort((a, b) => b.at.localeCompare(a.at)).slice(0, 8);
}

export async function loadOverview(role: StaffRole): Promise<OverviewData> {
  const can = (href: string) => canAccessPath(role, href);
  const db = await createAdminClient();
  const today = algiersDate(new Date());
  const since = midnight(today).toISOString();
  const out: OverviewData = {};
  const jobs: Promise<void>[] = [];
  const run = <K extends keyof OverviewData>(key: K, p: Promise<NonNullable<OverviewData[K]> extends Block<infer T> ? T : never>) =>
    jobs.push(settle(p).then((b) => { (out as Record<string, unknown>)[key] = b; }));

  const hasOrders = can("/orders");
  const hasCash = can("/blink-cash");
  if (hasOrders) {
    run("ordersToday", loadOrdersToday(db, since));
    run("chart", loadChart(db, today));
    run("pipeline", loadPipeline(db, since));
  }
  if (can("/riders")) run("riders", loadRiders(db));
  if (hasCash) run("cash", loadCash(db, since));
  if (hasOrders || hasCash) run("activity", loadActivity(db, hasOrders, hasCash));

  // Attention drives both the "Waiting on staff" KPI and the Needs-attention list.
  jobs.push(
    settle(getAttentionCounts(role)).then((b) => {
      if ("error" in b) {
        out.attention = b;
        out.waiting = b;
        return;
      }
      const rows: AttentionRow[] = [];
      for (const m of MODULES) {
        for (const p of m.pages) {
          if (!can(p.href)) continue;
          for (const key of p.attention ?? []) {
            const count = b.data[key];
            if (count && count > 0) rows.push({ key, href: p.href, count });
          }
        }
      }
      out.attention = { data: rows };
      out.waiting = { data: rows.reduce((s, r) => s + r.count, 0) };
    })
  );

  await Promise.all(jobs);
  return out;
}
