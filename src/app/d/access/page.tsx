import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { pageMeta } from "@/lib/dash-metadata";
import { getCurrentStaffRole } from "@/lib/auth/staff";
import { defaultPathFor } from "@/lib/auth/access";
import Client from "./client";

export function generateMetadata(): Promise<Metadata> {
  return pageMeta("access");
}

export default async function Page() {
  // Managing dashboard access is super_admin-only — enforce it server-side here,
  // in addition to the nav-hide + client route guard in the shell.
  const role = await getCurrentStaffRole();
  if (role !== "super_admin") redirect(defaultPathFor(role));

  return <Client />;
}
