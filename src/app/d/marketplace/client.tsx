"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { PageHeader, SubTabs } from "@/components/ui";
import { MarketplaceStats, StoresTable, ProductsTable, CategoriesList } from "@/features/marketplace";
import { useMarketplaceStore, useHydrateMarketplace } from "@/features/marketplace/store";

export default function MarketplaceClient() {
  const t = useTranslations("marketplace");
  useHydrateMarketplace();

  const [tab, setTab] = useState("stores");
  const storesCount = useMarketplaceStore((s) => s.stores.length);
  const productsCount = useMarketplaceStore((s) => s.products.length);
  const categoriesCount = useMarketplaceStore((s) => s.categories.length);

  const tabs = [
    { id: "stores", label: t("stores"), icon: "store", count: String(storesCount) },
    { id: "products", label: t("products"), icon: "package", count: String(productsCount) },
    { id: "categories", label: t("categories"), icon: "grid", count: String(categoriesCount) },
  ];

  return (
    <div>
      <PageHeader title={t("title")} description={t("description")} />
      <MarketplaceStats t={t} />
      <SubTabs tabs={tabs} active={tab} onChange={setTab} />
      {tab === "stores" && <StoresTable t={t} />}
      {tab === "products" && <ProductsTable t={t} />}
      {tab === "categories" && <CategoriesList t={t} />}
    </div>
  );
}
