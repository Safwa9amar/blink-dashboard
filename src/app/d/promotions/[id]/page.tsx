import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requirePathAccess } from "@/lib/auth/staff";
import { pageMeta } from "@/lib/dash-metadata";
import { loadPromotionDetail, loadStores } from "../data";
import Client from "./client";

export function generateMetadata(): Promise<Metadata> {
  return pageMeta("promotions", undefined, "edit_title");
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  await requirePathAccess("/promotions");
  const { id } = await params;
  const [detail, stores] = await Promise.all([loadPromotionDetail(id), loadStores()]);
  if (!detail.row) notFound();
  return (
    <Client
      row={detail.row}
      stats={detail.stats}
      daily={detail.daily}
      coupons={detail.coupons}
      stores={stores}
      error={detail.error}
    />
  );
}
