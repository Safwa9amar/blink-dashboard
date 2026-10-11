export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard-shell";
import { getCurrentStaffRole } from "@/lib/auth/staff";
import { getAttentionCounts } from "@/lib/shell/attention";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Authoritative dashboard gate: this server layout renders for every /d/* page, so a
  // non-staff (or unauthenticated) viewer never reaches the console. Per-route access is
  // enforced from the resolved role in the shell (nav) and server actions (mutations).
  const staffRole = await getCurrentStaffRole();
  if (!staffRole) redirect("/login");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: row } = user
    ? await supabase.from("users").select("first_name, last_name, email").eq("id", user.id).single()
    : { data: null };
  const person = row as { first_name?: string | null; last_name?: string | null; email?: string | null } | null;
  const staffName =
    [person?.first_name, person?.last_name].filter(Boolean).join(" ") || person?.email || user?.email || "";

  const attention = await getAttentionCounts(staffRole);

  return (
    <DashboardShell staffRole={staffRole} staffName={staffName} attention={attention}>
      {children}
    </DashboardShell>
  );
}
