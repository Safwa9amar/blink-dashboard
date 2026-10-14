import type { Metadata } from "next";
import { requirePathAccess } from "@/lib/auth/staff";
import { pageMeta } from "@/lib/dash-metadata";
import { loadCoupons } from "./data";
import Client from "./client";

export function generateMetadata(): Promise<Metadata> {
  return pageMeta("coupons");
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function Page({ searchParams }: { searchParams: Promise<{ promotion?: string }> }) {
  await requirePathAccess("/coupons");
  const { promotion } = await searchParams;
  const data = await loadCoupons(promotion && UUID.test(promotion) ? promotion : "");
  return <Client {...data} />;
}
