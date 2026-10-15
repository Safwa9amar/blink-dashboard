// Server-side loader for the Live ops page. Service-role reads only; never import from a
// client component. Volumes are small (tens of orders), so rows are fetched and aggregated
// in TypeScript (capped at ROW_CAP). When volume grows, move the counts/feed to SQL (RPC).
import { createAdminClient } from "@/lib/supabase/admin";
import {
  ACTIVE_STATUSES,
  THRESHOLDS,
  algiersMidnightISO,
  buildAttention,
  buildFeed,
  classifyRiders,
  isActive,
  summarizeCash,
} from "@/features/live-ops/aggregate";
import type {
  ApiHealth,
  ChatRow,
  Health,
  LiveOpsSnapshot,
  MapAgent,
  MapOrder,
  MapRider,
  OrderRow,
  RiderRow,
  StoreRow,
  TxRow,
} from "@/features/live-ops/types";

const ROW_CAP = 5000;

const ORDER_COLS =
  "id,type,status,merchant_status,created_at,rider_assigned_at,picked_up_at,delivered_at,canceled_at,canceled_by,cancel_reason,store_name,rider_id,total,scheduled_at,pickup_lat,pickup_lng,destination_lat,destination_lng,pickup_address";

// The two Render instances the app fails over between (EXPO_PUBLIC_API_BASE_URL in the app).
const API_TARGETS = {
  primary: process.env.BLINK_HEALTH_PRIMARY_URL ?? "https://blink-server-q4ey.onrender.com",
  spare: process.env.BLINK_HEALTH_SPARE_URL ?? "https://blink-server-spare.onrender.com",
};
const SLOW_MS = 2000;

/** GET <api>/health with an 8 s timeout: up / slow (> 2 s) / down, plus the response time. */
async function apiHealth(base: string): Promise<ApiHealth> {
  const started = performance.now();
  try {
    const res = await fetch(`${base}/health`, { cache: "no-store", signal: AbortSignal.timeout(8000) });
    const ms = Math.round(performance.now() - started);
    if (!res.ok) return { state: "down", ms };
    return { state: ms > SLOW_MS ? "slow" : "up", ms };
  } catch (e) {
    // A timeout is usually a sleeping Render instance (cold start), not an outage.
    const timedOut = e instanceof Error && (e.name === "TimeoutError" || e.name === "AbortError");
    return { state: timedOut ? "no_reply" : "down", ms: null };
  }
}

const fullName = (u: { first_name: string | null; last_name: string | null } | undefined, fallback: string) =>
  [u?.first_name, u?.last_name].filter(Boolean).join(" ") || fallback;

export async function loadLiveOps(): Promise<LiveOpsSnapshot> {
  const now = new Date();
  const sb = await createAdminClient();
  const windowISO = new Date(now.getTime() - THRESHOLDS.feedWindowH * 3_600_000).toISOString();
  const midnight = algiersMidnightISO(now);
  const feedFrom = midnight < windowISO ? midnight : windowISO;

  const dbStart = performance.now();
  const probe = await sb.from("orders").select("id", { count: "exact", head: true });
  const dbMs = probe.error ? null : Math.round(performance.now() - dbStart);

  const [activeQ, recentQ, ridersQ, chatsQ, txQ, storesQ, shopsQ, lastQ, primary, spare] = await Promise.all([
    sb.from("orders").select(ORDER_COLS).in("status", [...ACTIVE_STATUSES]).limit(ROW_CAP),
    sb
      .from("orders")
      .select(ORDER_COLS)
      .or(`created_at.gte.${windowISO},delivered_at.gte.${windowISO},canceled_at.gte.${windowISO}`)
      .limit(ROW_CAP),
    sb
      .from("rider_profiles")
      .select("user_id,is_available,latitude,longitude,location_updated_at,vehicle_type,created_at")
      .limit(ROW_CAP),
    sb
      .from("support_conversations")
      .select("id,status,assigned_agent_id,unread_for_staff,subject,created_at,last_message_at")
      .or(`status.in.(waiting,assigned),created_at.gte.${windowISO}`)
      .limit(ROW_CAP),
    sb.from("transactions").select("id,type,status,total,created_at").gte("created_at", feedFrom).limit(ROW_CAP),
    sb.from("stores").select("id,name,city,created_at").gte("created_at", windowISO).limit(200),
    sb.from("agent_shops").select("id,shop_name,latitude,longitude").eq("status", "open").limit(ROW_CAP),
    sb.from("orders").select("created_at").order("created_at", { ascending: false }).limit(1),
    apiHealth(API_TARGETS.primary),
    apiHealth(API_TARGETS.spare),
  ]);

  const byId = new Map<string, OrderRow>();
  for (const o of [...((recentQ.data ?? []) as OrderRow[]), ...((activeQ.data ?? []) as OrderRow[])]) byId.set(o.id, o);
  const orders = [...byId.values()];
  const activeOrders = orders.filter((o) => isActive(o.status));
  const riders = (ridersQ.data ?? []) as RiderRow[];
  const chats = (chatsQ.data ?? []) as ChatRow[];
  const txs = (txQ.data ?? []) as TxRow[];
  const stores = (storesQ.data ?? []) as StoreRow[];

  const { online, busyIds } = classifyRiders(riders, orders, now);
  const newRiders = riders.filter((r) => new Date(r.created_at).getTime() >= new Date(windowISO).getTime());
  const nameIds = [...new Set([...online, ...newRiders].map((r) => r.user_id))];
  const names = new Map<string, string>();
  if (nameIds.length) {
    const { data } = await sb.from("users").select("id,first_name,last_name").in("id", nameIds);
    for (const u of data ?? []) names.set(u.id as string, fullName(u as { first_name: string | null; last_name: string | null }, ""));
  }

  const searching = activeOrders.filter((o) => o.status === "searching");
  const oldestSearching = searching.map((o) => o.created_at).sort()[0] ?? null;
  const openChats = chats.filter((c) => c.status === "waiting" || c.status === "assigned");
  const cash = summarizeCash(txs, midnight);

  const mapRiders: MapRider[] = online
    .filter((r) => r.latitude != null && r.longitude != null && !(r.latitude === 0 && r.longitude === 0))
    .map((r) => ({
      id: r.user_id,
      name: names.get(r.user_id) || "",
      vehicle: r.vehicle_type,
      lastSeen: r.location_updated_at as string,
      busy: busyIds.has(r.user_id),
      lat: r.latitude as number,
      lng: r.longitude as number,
    }));

  const mapOrders: MapOrder[] = activeOrders
    .filter((o) => o.pickup_lat != null && o.pickup_lng != null)
    .map((o) => ({
      id: o.id,
      store: o.store_name,
      status: o.status,
      type: o.type,
      createdAt: o.created_at,
      lat: o.pickup_lat as number,
      lng: o.pickup_lng as number,
      dest: o.destination_lat != null && o.destination_lng != null ? [o.destination_lat, o.destination_lng] : null,
    }));

  const mapAgents: MapAgent[] = (shopsQ.data ?? [])
    .filter((s) => s.latitude && s.longitude)
    .map((s) => ({ id: s.id as string, name: s.shop_name as string, lat: s.latitude as number, lng: s.longitude as number }));

  const health: Health = {
    primary,
    spare,
    dbMs,
    lastOrderAt: (lastQ.data?.[0]?.created_at as string | undefined) ?? null,
  };

  return {
    generatedAt: now.toISOString(),
    kpis: {
      activeOrders: activeOrders.length,
      searching: searching.length,
      oldestSearchingSince: oldestSearching,
      ridersOnline: online.length,
      ridersBusy: online.filter((r) => busyIds.has(r.user_id)).length,
      chatsOpen: openChats.length,
      chatsUnread: openChats.reduce((s, c) => s + (c.unread_for_staff ?? 0), 0),
      cashCount: cash.count,
      cashAmount: cash.amount,
    },
    attention: buildAttention(orders, chats, now),
    riders: mapRiders,
    orders: mapOrders,
    agents: mapAgents,
    feed: buildFeed(orders, txs, chats, stores, riders, now, names),
    health,
  };
}
