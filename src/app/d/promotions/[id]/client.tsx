"use client";

import { useState } from "react";
import { PromoDetail, PromoForm, rowToForm } from "@/features/promotions";
import type { PromotionCouponRow, PromotionDay, PromotionRow, PromotionStats, StoreOption } from "@/features/promotions";

export default function EditPromotionClient({
  row,
  stats,
  daily,
  coupons,
  stores,
  error,
}: {
  row: PromotionRow;
  stats: PromotionStats;
  daily: PromotionDay[];
  coupons: PromotionCouponRow[];
  stores: StoreOption[];
  error?: string;
}) {
  const [now] = useState(() => new Date());
  return (
    <>
      {error && <p className="text-danger text-sm mb-3">{error}</p>}
      <PromoForm id={row.id} initial={rowToForm(row)} stores={stores} />
      <PromoDetail row={row} stats={stats} daily={daily} coupons={coupons} now={now} />
    </>
  );
}
