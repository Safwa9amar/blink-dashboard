import { createClient } from "@/lib/supabase/server";
import DashboardClient from "./client";
import type { Metadata } from "next";
import { pageMeta } from "@/lib/dash-metadata";

export function generateMetadata(): Promise<Metadata> {
  return pageMeta("overview");
}

async function getStats() {
  const supabase = await createClient();

  const [users, riders, orders, trips, transactions] = await Promise.all([
    supabase.from("users").select("*", { count: "exact", head: true }),
    supabase.from("rider_profiles").select("*", { count: "exact", head: true }),
    supabase.from("orders").select("*", { count: "exact", head: true }),
    supabase.from("trips").select("*", { count: "exact", head: true }),
    supabase.from("transactions").select("*", { count: "exact", head: true }),
  ]);

  return {
    users: users.count ?? 0,
    riders: riders.count ?? 0,
    orders: orders.count ?? 0,
    trips: trips.count ?? 0,
    transactions: transactions.count ?? 0,
  };
}

export default async function DashboardPage() {
  const stats = await getStats();

  return <DashboardClient stats={stats} />;
}
