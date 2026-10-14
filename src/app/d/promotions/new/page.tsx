import type { Metadata } from "next";
import { requirePathAccess } from "@/lib/auth/staff";
import { pageMeta } from "@/lib/dash-metadata";
import { loadStores } from "../data";
import Client from "./client";

export function generateMetadata(): Promise<Metadata> {
  return pageMeta("promotions", undefined, "create");
}

export default async function Page() {
  await requirePathAccess("/promotions");
  return <Client stores={await loadStores()} />;
}
