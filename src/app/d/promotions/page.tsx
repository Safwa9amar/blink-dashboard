import type { Metadata } from "next";
import { requirePathAccess } from "@/lib/auth/staff";
import { pageMeta } from "@/lib/dash-metadata";
import { loadPromotionList } from "./data";
import Client from "./client";

export function generateMetadata(): Promise<Metadata> {
  return pageMeta("promotions");
}

export default async function Page() {
  await requirePathAccess("/promotions");
  const { items, stats30, error } = await loadPromotionList();
  return <Client items={items} stats30={stats30} error={error} />;
}
