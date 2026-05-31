export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard-shell";
import { getCurrentStaffRole } from "@/lib/auth/staff";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Authoritative dashboard gate: this server layout renders for every /d/* page, so a
  // non-staff (or unauthenticated) viewer never reaches the console. Per-route access is
  // enforced from the resolved role in the shell (nav) and server actions (mutations).
  const staffRole = await getCurrentStaffRole();
  if (!staffRole) redirect("/login");

  return <DashboardShell staffRole={staffRole}>{children}</DashboardShell>;
}
