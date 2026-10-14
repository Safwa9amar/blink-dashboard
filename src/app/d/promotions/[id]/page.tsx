import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requirePathAccess } from "@/lib/auth/staff";
import { pageMeta } from "@/lib/dash-metadata";
import { loadDealCategories, loadPromotionDetail, loadStores } from "../data";
import Client from "./client";

export function generateMetadata(): Promise<Metadata> {
  return pageMeta("promotions", undefined, "edit_title");
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  await requirePathAccess("/promotions");
  const { id } = await params;
  const [detail, stores, dealCategories] = await Promise.all([loadPromotionDetail(id), loadStores(), loadDealCategories()]);
  if (!detail.row) notFound();
  return (
    <Client
      row={detail.row}
      stats={detail.stats}
      daily={detail.daily}
      coupons={detail.coupons}
      stores={stores}
      dealCategories={dealCategories}
      error={detail.error}
    />
  );
}
