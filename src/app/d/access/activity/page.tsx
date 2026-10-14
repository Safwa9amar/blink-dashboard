import type { Metadata } from "next";
import { pageMeta } from "@/lib/dash-metadata";
import { requirePathAccess } from "@/lib/auth/staff";
import Client from "../client";
import { loadAccessEvents } from "../data";

export function generateMetadata(): Promise<Metadata> {
  return pageMeta("access", undefined, "tabs.activity");
}

export default async function Page() {
  await requirePathAccess("/access");
  // An un-migrated audit table yields [] — the table shows its empty state.
  const events = await loadAccessEvents();
  return <Client tab="activity" events={events} />;
}
