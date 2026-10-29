import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { canAccessPath } from "@/lib/auth/access";
import { requirePathAccess } from "@/lib/auth/staff";
import { createAdminClient } from "@/lib/supabase/admin";
import { pageMeta } from "@/lib/dash-metadata";
import { isUuid } from "@/features/riders";
import { toOrderDetail, toOrderTrips } from "@/features/orders";
import OrderDetailClient from "./client";

export function generateMetadata(): Promise<Metadata> {
  return pageMeta("orders", undefined, "detail.title");
}

const PERSON = "id, first_name, last_name, phone_number, email";
// Two FKs point at users (customer, rider) and at customer_coupons (orders.coupon_id and
// customer_coupons.order_id), so every embed names its constraint.
const ORDER_SELECT = [
  "*",
  `customer:users!orders_customer_id_fkey(${PERSON}, customer_profiles(customer_id))`,
  `rider:users!orders_rider_id_fkey(${PERSON}, rider_profiles!rider_profiles_user_id_fkey(rider_id))`,
  "store:stores!orders_store_id_fkey(id, name, phone, city, wilaya)",
  "driver:store_drivers!orders_store_driver_id_fkey(full_name, phone, vehicle_type, plate_number)",
  "coupon:customer_coupons!orders_coupon_id_fkey(code, title)",
  "zone:pricing_zones!orders_pricing_zone_id_fkey(name)",
].join(", ");

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const role = await requirePathAccess("/orders");
  const { id } = await params;
  if (!isUuid(id)) notFound();

  // Service role: orders_select_own / trips_select_own RLS only return a row to its customer or rider.
  const db = await createAdminClient();
  const [{ data: row, error }, trips] = await Promise.all([
    db.from("orders").select(ORDER_SELECT).eq("id", id).maybeSingle(),
    db.from("trips").select("id, display_id, status, net_payout, created_at").eq("order_id", id).order("created_at"),
  ]);
  if (error) throw new Error(error.message);
  const order = row ? toOrderDetail(row) : null;
  if (!order) notFound();

  return (
    <OrderDetailClient
      order={order}
      trips={{ data: toOrderTrips(trips.data), error: trips.error?.message ?? null }}
      canOpenRiders={canAccessPath(role, "/riders")}
      canOpenTrips={canAccessPath(role, "/trips")}
    />
  );
}
