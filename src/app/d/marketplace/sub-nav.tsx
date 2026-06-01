"use client";

import { useTranslations } from "next-intl";
import { SubNav } from "@/components/ui";
import { MarketplaceStats } from "@/features/marketplace";
import { useMarketplaceStore, useHydrateMarketplace } from "@/features/marketplace/store";

// Stats + sub-nav share the client store (live counts + hydration), so they live
// together in this client island rendered by the server layout.
export function MarketplaceSubNav() {
  const t = useTranslations("marketplace");
  useHydrateMarketplace();
  const storesCount = useMarketplaceStore((s) => s.stores.length);
  const productsCount = useMarketplaceStore((s) => s.products.length);
  const categoriesCount = useMarketplaceStore((s) => s.categories.length);

  const items = [
    { href: "/marketplace", label: t("stores"), icon: "store", count: String(storesCount) },
    { href: "/marketplace/products", label: t("products"), icon: "package", count: String(productsCount) },
    { href: "/marketplace/categories", label: t("categories"), icon: "grid", count: String(categoriesCount) },
  ];

  return (
    <>
      <MarketplaceStats t={t} />
      <SubNav items={items} />
    </>
  );
}
