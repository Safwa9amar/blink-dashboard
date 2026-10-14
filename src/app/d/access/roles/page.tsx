import type { Metadata } from "next";
import { pageMeta } from "@/lib/dash-metadata";
import { requirePathAccess } from "@/lib/auth/staff";
import { STAFF_ROLES, type StaffRole } from "@/features/access";
import Client from "../client";
import { loadStaff } from "../data";

export function generateMetadata(): Promise<Metadata> {
  return pageMeta("access", undefined, "tabs.roles");
}

export default async function Page() {
  await requirePathAccess("/access");
  const staff = await loadStaff();
  const counts = Object.fromEntries(
    STAFF_ROLES.map((r) => [r, staff.filter((m) => m.staffRole === r).length]),
  ) as Record<StaffRole, number>;
  return <Client tab="roles" counts={counts} />;
}
