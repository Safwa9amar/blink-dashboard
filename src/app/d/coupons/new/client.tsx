"use client";

import { IssueCoupon } from "@/features/coupons";
import type { PromotionOption } from "@/features/coupons";

export default function IssueCouponClient({ promotions }: { promotions: PromotionOption[] }) {
  return <IssueCoupon promotions={promotions} />;
}
