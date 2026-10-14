import type { Metadata } from "next";
import { requirePathAccess } from "@/lib/auth/staff";
import { pageMeta } from "@/lib/dash-metadata";
import { loadDealCategories, loadStores } from "../data";
import Client from "./client";

export function generateMetadata(): Promise<Metadata> {
  return pageMeta("promotions", undefined, "create");
}

export default async function Page() {
  await requirePathAccess("/promotions");
  const [stores, dealCategories] = await Promise.all([loadStores(), loadDealCategories()]);
  return <Client stores={stores} dealCategories={dealCategories} />;
}
