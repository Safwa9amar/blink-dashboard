import { createAdminClient } from "@/lib/supabase/admin";
import { requirePathAccess } from "@/lib/auth/staff";
import OrdersClient from "./client";
import type { Metadata } from "next";
import { pageMeta } from "@/lib/dash-metadata";

export function generateMetadata(): Promise<Metadata> {
  return pageMeta("orders");
}

export default async function OrdersPage() {
  // Service-role client: `orders_select_own` RLS scopes reads to the row's customer/rider,
  // so a staff session would see no orders at all. Gate the section first.
  await requirePathAccess("/orders");
  const supabase = await createAdminClient();

  const { data: orders, error } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  return <OrdersClient orders={orders} error={error?.message} />;
}
