"use client";

import { PromoAnalytics } from "@/features/promotions";
import type { PromotionDay, PromotionListItem } from "@/features/promotions";

export default function PromotionsAnalyticsClient(props: {
  days: number;
  daily: PromotionDay[];
  items: PromotionListItem[];
  error?: string;
}) {
  return <PromoAnalytics {...props} />;
}
