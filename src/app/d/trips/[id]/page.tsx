import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { canAccessPath } from "@/lib/auth/access";
import { requirePathAccess } from "@/lib/auth/staff";
import { createAdminClient } from "@/lib/supabase/admin";
import { pageMeta } from "@/lib/dash-metadata";
import { isUuid } from "@/features/riders";
import { toTripDetail } from "@/features/trips";
import TripDetailClient from "./client";

export function generateMetadata(): Promise<Metadata> {
  return pageMeta("trips", undefined, "detail.title");
}

const PERSON = "id, first_name, last_name, phone_number, email";
// Two FKs point at users (rider, customer), so each embed names its constraint.
const TRIP_SELECT = [
  "*",
  `rider:users!trips_rider_id_fkey(${PERSON}, rider_profiles!rider_profiles_user_id_fkey(rider_id))`,
  `customer:users!trips_customer_id_fkey(${PERSON}, customer_profiles(customer_id))`,
  "order:orders!trips_order_id_fkey(id, type, status, store_name, total, created_at)",
].join(", ");

export default async function TripDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const role = await requirePathAccess("/trips");
  const { id } = await params;
  if (!isUuid(id)) notFound();

  // Service role: trips_select_own RLS only returns a trip to its rider or customer.
  const db = await createAdminClient();
  const { data: row, error } = await db.from("trips").select(TRIP_SELECT).eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  const trip = row ? toTripDetail(row) : null;
  if (!trip) notFound();

  return <TripDetailClient trip={trip} canOpenRiders={canAccessPath(role, "/riders")} canOpenOrders={canAccessPath(role, "/orders")} />;
}
