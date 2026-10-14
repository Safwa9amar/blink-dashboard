"use client";

import { PromoList } from "@/features/promotions";
import type { PromotionListItem, PromotionStats } from "@/features/promotions";

export default function PromotionsClient(props: {
  items: PromotionListItem[];
  stats30: PromotionStats[];
  error?: string;
}) {
  return <PromoList {...props} />;
}
