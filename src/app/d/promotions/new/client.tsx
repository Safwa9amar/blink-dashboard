"use client";

import { PromoForm } from "@/features/promotions";
import type { StoreOption } from "@/features/promotions";

export default function NewPromotionClient({ stores, dealCategories }: { stores: StoreOption[]; dealCategories: string[] }) {
  return <PromoForm stores={stores} dealCategories={dealCategories} />;
}
