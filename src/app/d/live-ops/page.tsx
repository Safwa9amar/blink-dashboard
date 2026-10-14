import type { Metadata } from "next";
import { requirePathAccess } from "@/lib/auth/staff";
import { pageMeta } from "@/lib/dash-metadata";
import { loadLiveOps } from "./data";
import Client from "./client";

export function generateMetadata(): Promise<Metadata> {
  return pageMeta("live_ops");
}

export const dynamic = "force-dynamic";

export default async function Page() {
  await requirePathAccess("/live-ops");
  const snapshot = await loadLiveOps();
  return <Client initial={snapshot} />;
}
