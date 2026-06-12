import { createAdminClient } from "@/lib/supabase/admin";
import MerchantsClient from "./client";
import type { Metadata } from "next";
import { pageMeta } from "@/lib/dash-metadata";

export function generateMetadata(): Promise<Metadata> {
  return pageMeta("merchants");
}

// Module-scope so the "last N days" cutoff isn't an impure call inside the
// server component's render (react-hooks/purity).
function daysAgoISO(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

export default async function MerchantsPage() {
  // Service-role client to read every merchant row past `users` RLS
  // (users_select_own). Page is staff-gated by d/layout. Same pattern as /customers.
  const supabase = await createAdminClient();

  // A merchant = persona `role='merchant'` AND no console authority
  // (`staff_role IS NULL`). Display ID ("BK-MR-…") comes from merchant_profiles.
  const merchants = () =>
    supabase.from("users").select("id", { count: "exact", head: true }).eq("role", "merchant").is("staff_role", null);

  const [list, totalRes, newRes, maleRes, femaleRes] = await Promise.all([
    supabase
      .from("users")
      .select(
        "id, first_name, last_name, email, phone_number, gender, wilaya, created_at, merchant_profiles(merchant_id)"
      )
      .eq("role", "merchant")
      .is("staff_role", null)
      .order("created_at", { ascending: false })
      .limit(50),
    merchants(),
    merchants().gte("created_at", daysAgoISO(30)),
    merchants().eq("gender", "male"),
    merchants().eq("gender", "female"),
  ]);

  return (
    <MerchantsClient
      merchants={list.data}
      error={list.error?.message}
      total={totalRes.count ?? 0}
      newCount={newRes.count ?? 0}
      male={maleRes.count ?? 0}
      female={femaleRes.count ?? 0}
    />
  );
}
