"use client";

import { useRouter } from "next/navigation";
import { PromoGrid, PromoCreate, PromoAnalytics } from "@/features/promotions";

export default function PromotionsClient({ tab }: { tab: "grid" | "create" | "analytics" }) {
  const router = useRouter();
  switch (tab) {
    case "create":
      return <PromoCreate onCancel={() => router.push("/promotions")} />;
    case "analytics":
      return <PromoAnalytics />;
    default:
      return <PromoGrid onNew={() => router.push("/promotions/new")} />;
  }
}
