import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { requirePathAccess } from "@/lib/auth/staff";
import { pageMeta } from "@/lib/dash-metadata";
import { toRiderRow, type RiderRow } from "@/features/riders";
import RidersClient from "./client";

export function generateMetadata(): Promise<Metadata> {
  return pageMeta("riders");
}

const LIMIT = 1000;

export default async function RidersPage() {
  await requirePathAccess("/riders");
  // Service-role client: users / vehicles are RLS-limited to their owner. Wilaya
  // lives on users; the vehicle (one row per user) rides along as a nested embed.
  const supabase = await createAdminClient();
  const { data, error } = await supabase
    .from("rider_profiles")
    .select(
      "id, rider_id, vehicle_type, verification_status, is_available, created_at, users!rider_profiles_user_id_fkey(first_name, last_name, phone_number, wilaya, vehicles(brand, model, license_plate, year, color, category, gray_card_status, insurance_status))"
    )
    .order("created_at", { ascending: false })
    .limit(LIMIT);

  const riders = ((data ?? []) as unknown[]).map(toRiderRow).filter((r): r is RiderRow => r !== null);
  return <RidersClient riders={riders} error={error?.message} />;
}
