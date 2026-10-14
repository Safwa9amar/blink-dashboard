"use client";

import { CouponsList } from "@/features/coupons";
import type { CouponKpis, CouponListRow, PromotionOption } from "@/features/coupons";

export default function CouponsClient(props: {
  rows: CouponListRow[];
  kpis: CouponKpis;
  promotions: PromotionOption[];
  promotionFilter: string;
  truncated: boolean;
  error?: string;
}) {
  return <CouponsList {...props} />;
}
