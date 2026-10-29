import { createAdminClient } from "@/lib/supabase/admin";
import { requirePathAccess } from "@/lib/auth/staff";
import TripsClient from "./client";
import type { Metadata } from "next";
import { pageMeta } from "@/lib/dash-metadata";

export function generateMetadata(): Promise<Metadata> {
  return pageMeta("trips");
}

export default async function TripsPage() {
  // Service-role client: `trips_select_own` RLS scopes reads to the row's customer/rider,
  // so a staff session would see no trips at all. Gate the section first.
  await requirePathAccess("/trips");
  const supabase = await createAdminClient();

  const { data: trips, error } = await supabase
    .from("trips")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  return <TripsClient trips={trips} error={error?.message} />;
}
