import type { Metadata } from "next";
import { requirePathAccess } from "@/lib/auth/staff";
import { pageMeta } from "@/lib/dash-metadata";
import { loadPromotionOptions } from "../data";
import Client from "./client";

export function generateMetadata(): Promise<Metadata> {
  return pageMeta("coupons", undefined, "create_coupon");
}

export default async function Page() {
  await requirePathAccess("/coupons");
  return <Client promotions={await loadPromotionOptions()} />;
}
