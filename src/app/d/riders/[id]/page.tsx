import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requirePathAccess } from "@/lib/auth/staff";
import { createAdminClient } from "@/lib/supabase/admin";
import { pageMeta } from "@/lib/dash-metadata";
import { riderPathsToSign, buildRiderDocSlots, type RiderDocSlot } from "@/features/verification";
import {
  isUuid,
  sumTotals,
  toActivityOrders,
  toActivityTrips,
  toActivityTxs,
  toBlock,
  toRiderProfile,
  type ActivityOrder,
  type ActivityTrip,
  type ActivityTx,
} from "@/features/riders";
import { signRiderDocPaths } from "../../verification/partner-data";
import RiderDetailClient, { type RiderStats } from "./client";

export function generateMetadata(): Promise<Metadata> {
  return pageMeta("riders");
}

const RECENT = 10;
/** Upper bound on completed transactions summed for the Blink Cash volume. */
const SUM_LIMIT = 5000;
const PROFILE_SELECT =
  "user_id, rider_id, vehicle_type, documents, verification_status, is_available, latitude, longitude, location_updated_at, created_at, users!rider_profiles_user_id_fkey(first_name, last_name, phone_number, email, wilaya, vehicles(brand, model, license_plate, year, color, category))";

type Admin = Awaited<ReturnType<typeof createAdminClient>>;
const msg = (e: { message: string } | null) => e?.message ?? null;

async function loadDocs(db: Admin, vehicleType: string | null, documents: unknown): Promise<RiderDocSlot[]> {
  const signed = await signRiderDocPaths(db, riderPathsToSign([{ documents }]));
  return buildRiderDocSlots(vehicleType, documents, signed);
}

export default async function RiderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePathAccess("/riders");
  const { id } = await params;
  if (!isUuid(id)) notFound();

  // Service role: users / vehicles / documents are RLS-limited to their owner.
  const db = await createAdminClient();
  const { data: row, error } = await db.from("rider_profiles").select(PROFILE_SELECT).eq("user_id", id).maybeSingle();
  if (error) throw new Error(error.message);
  const profile = row ? toRiderProfile(row) : null;
  if (!profile) notFound();

  const [docs, orders, trips, txs, delivered, completedTrips, completedTxs] = await Promise.allSettled([
    loadDocs(db, profile.vehicleType, (row as { documents?: unknown }).documents).then((data) => ({ data, error: null })),
    db
      .from("orders")
      .select("id, status, type, store_name, total, created_at, delivered_at")
      .eq("rider_id", id)
      .order("created_at", { ascending: false })
      .limit(RECENT)
      .then((r) => ({ data: toActivityOrders(r.data), error: msg(r.error) })),
    db
      .from("trips")
      .select("id, status, pickup_label, dropoff_label, net_payout, created_at")
      .eq("rider_id", id)
      .order("created_at", { ascending: false })
      .limit(RECENT)
      .then((r) => ({ data: toActivityTrips(r.data), error: msg(r.error) })),
    db
      .from("transactions")
      .select("id, type, status, amount, fees, total, created_at")
      .eq("rider_id", id)
      .order("created_at", { ascending: false })
      .limit(RECENT)
      .then((r) => ({ data: toActivityTxs(r.data), error: msg(r.error) })),
    db
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("rider_id", id)
      .eq("status", "delivered")
      .then((r) => ({ data: r.count ?? 0, error: msg(r.error) })),
    db
      .from("trips")
      .select("id", { count: "exact", head: true })
      .eq("rider_id", id)
      .eq("status", "completed")
      .then((r) => ({ data: r.count ?? 0, error: msg(r.error) })),
    db
      .from("transactions")
      .select("total")
      .eq("rider_id", id)
      .eq("status", "completed")
      .limit(SUM_LIMIT)
      .then((r) => ({ data: sumTotals(r.data), error: msg(r.error) })),
  ]);

  const stats: RiderStats = {
    delivered: toBlock(delivered, 0),
    trips: toBlock(completedTrips, 0),
    volume: toBlock(completedTxs, 0),
  };

  return (
    <RiderDetailClient
      profile={profile}
      docs={toBlock<RiderDocSlot[]>(docs, [])}
      orders={toBlock<ActivityOrder[]>(orders, [])}
      trips={toBlock<ActivityTrip[]>(trips, [])}
      transactions={toBlock<ActivityTx[]>(txs, [])}
      stats={stats}
    />
  );
}
