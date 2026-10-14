// Server-side loader for the Demand page. Service-role reads, aggregated in TypeScript
// (see features/demand/aggregate.ts). Never import from a client component.
import { createAdminClient } from "@/lib/supabase/admin";
import {
  aggregateDemand,
  emptySnapshot,
  rangeStartISO,
  type DemandOrder,
  type DemandRange,
  type DemandSnapshot,
  type DemandStore,
  type OnlineRider,
} from "@/features/demand";

/** Rows fetched per request. Past this, aggregate in SQL instead (the snapshot flags `truncated`). */
const ORDER_CAP = 5000;
const ONLINE_WINDOW_MS = 15 * 60 * 1000;

export async function loadDemand(range: DemandRange): Promise<DemandSnapshot> {
  try {
    const db = await createAdminClient();
    const now = new Date();
    const since = rangeStartISO(range, now);
    const onlineSince = new Date(now.getTime() - ONLINE_WINDOW_MS).toISOString();

    const [orders, stores, riders] = await Promise.all([
      db
        .from("orders")
        .select("id,type,status,created_at,rider_assigned_at,delivered_at,store_id,store_name,pickup_lat,pickup_lng")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(ORDER_CAP),
      db.from("stores").select("id,name,city,latitude,longitude"),
      db
        .from("rider_profiles")
        .select("user_id,latitude,longitude")
        .eq("is_available", true)
        .gte("location_updated_at", onlineSince)
        .not("latitude", "is", null)
        .not("longitude", "is", null),
    ]);
    const failed = orders.error ?? stores.error ?? riders.error;
    if (failed) return emptySnapshot(range, failed.message);

    const orderRows = (orders.data ?? []) as unknown as DemandOrder[];
    const storeRows: DemandStore[] = (stores.data ?? []).map((s) => ({
      id: String(s.id),
      name: String(s.name ?? ""),
      city: (s.city as string | null) ?? null,
      latitude: s.latitude == null ? null : Number(s.latitude),
      longitude: s.longitude == null ? null : Number(s.longitude),
    }));
    const riderRows: OnlineRider[] = (riders.data ?? []).map((r) => ({
      id: String(r.user_id),
      lat: Number(r.latitude),
      lng: Number(r.longitude),
    }));

    return aggregateDemand({
      range,
      orders: orderRows.map((o) => ({
        ...o,
        pickup_lat: o.pickup_lat == null ? null : Number(o.pickup_lat),
        pickup_lng: o.pickup_lng == null ? null : Number(o.pickup_lng),
      })),
      stores: storeRows,
      riders: riderRows,
      truncated: orderRows.length >= ORDER_CAP,
      now,
    });
  } catch (e) {
    console.error("[demand]", e);
    return emptySnapshot(range, e instanceof Error ? e.message : "error");
  }
}
