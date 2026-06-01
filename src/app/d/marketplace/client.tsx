"use client";

import { useTranslations } from "next-intl";
import { StoresTable, ProductsTable, CategoriesList } from "@/features/marketplace";

export default function MarketplaceClient({ tab }: { tab: "stores" | "products" | "categories" }) {
  const t = useTranslations("marketplace");
  switch (tab) {
    case "products":
      return <ProductsTable t={t} />;
    case "categories":
      return <CategoriesList t={t} />;
    default:
      return <StoresTable t={t} />;
  }
}
