import { createAdminClient } from "@/lib/supabase/admin";
import CustomersClient from "./client";
import type { Metadata } from "next";
import { pageMeta } from "@/lib/dash-metadata";

export function generateMetadata(): Promise<Metadata> {
  return pageMeta("customers");
}

// Module-scope so the "last N days" cutoff isn't an impure call inside the
// server component's render (react-hooks/purity).
function daysAgoISO(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

export default async function CustomersPage() {
  // Service-role client: the customer roster must read every customer row, but
  // `users` RLS (users_select_own) would otherwise scope an admin to their own
  // row. Same pattern the news console uses. The page is staff-gated by d/layout.
  const supabase = await createAdminClient();

  // A customer = app persona `role='customer'` AND no console authority
  // (`staff_role IS NULL`) — so seeded staff like admin@blink.dz (role defaults to
  // customer but staff_role='super_admin') are excluded. The display ID
  // ("BK-CU-…") comes from the joined customer_profiles row when present.
  const customers = () =>
    supabase.from("users").select("id", { count: "exact", head: true }).eq("role", "customer").is("staff_role", null);

  const [list, totalRes, newRes, maleRes, femaleRes] = await Promise.all([
    supabase
      .from("users")
      .select(
        "id, first_name, last_name, email, phone_number, gender, wilaya, created_at, customer_profiles(customer_id)"
      )
      .eq("role", "customer")
      .is("staff_role", null)
      .order("created_at", { ascending: false })
      .limit(50),
    customers(),
    customers().gte("created_at", daysAgoISO(30)),
    customers().eq("gender", "male"),
    customers().eq("gender", "female"),
  ]);

  return (
    <CustomersClient
      customers={list.data}
      error={list.error?.message}
      total={totalRes.count ?? 0}
      newCount={newRes.count ?? 0}
      male={maleRes.count ?? 0}
      female={femaleRes.count ?? 0}
    />
  );
}
