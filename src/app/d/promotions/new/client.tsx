"use client";

import { PromoForm } from "@/features/promotions";
import type { StoreOption } from "@/features/promotions";

export default function NewPromotionClient({ stores }: { stores: StoreOption[] }) {
  return <PromoForm stores={stores} />;
}
