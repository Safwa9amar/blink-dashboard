export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard-shell";
import { getStaffGate, mustChangePassword, redirectForGate } from "@/lib/auth/staff";
import { getAttentionCounts } from "@/lib/shell/attention";
import { getInboxSnapshot } from "@/lib/shell/inbox";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Authoritative dashboard gate: this server layout renders for every /d/* page, so a
  // non-staff (or unauthenticated) viewer never reaches the console. Per-route access is
  // enforced from the resolved role in the shell (nav) and server actions (mutations).
  const staff = await getStaffGate();
  if (staff.status !== "ok") redirectForGate(staff);
  const staffRole = staff.role;
  // Temporary password (new account / admin reset): must be replaced before using the console.
  if (await mustChangePassword()) redirect("/login/password");

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

  const [attention, inbox] = await Promise.all([getAttentionCounts(staffRole), getInboxSnapshot(staff.id, staffRole)]);

  return (
    <DashboardShell staffRole={staffRole} staffName={staffName} attention={attention} inbox={inbox}>
      {children}
    </DashboardShell>
  );
}
