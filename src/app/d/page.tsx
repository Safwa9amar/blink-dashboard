import type { Metadata } from "next";
import { pageMeta } from "@/lib/dash-metadata";
import { requirePathAccess } from "@/lib/auth/staff";
import { loadOverview } from "@/features/overview/data";
import DashboardClient from "./client";

export function generateMetadata(): Promise<Metadata> {
  return pageMeta("overview");
}

export default async function DashboardPage() {
  const role = await requirePathAccess("/");
  const data = await loadOverview(role);
  return <DashboardClient data={data} />;
}
