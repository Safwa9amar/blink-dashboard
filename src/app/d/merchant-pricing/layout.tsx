import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { PageHeader, StatGrid, StatCard, SubNav } from "@/components/ui";
import { getCatalogCounts } from "./data";

// Catalog review: the merchant products and prices waiting on staff. The counts
// loader gates on the section (the pages and their loaders gate again themselves).
export default async function CatalogReviewLayout({ children }: { children: ReactNode }) {
  const t = await getTranslations("merchant_pricing");
  const { prices, products, applied, rejected } = await getCatalogCounts();

  return (
    <div>
      <PageHeader title={t("title")} description={t("description")} />

      <StatGrid cols={4}>
        <StatCard label={t("stats.prices")} value={prices} icon="tag" variant="warning" change={t("stats.prices_desc")} />
        <StatCard label={t("stats.products")} value={products} icon="package" variant="warning" change={t("stats.products_desc")} />
        <StatCard label={t("stats.applied")} value={applied} icon="check" variant="success" change={t("stats.applied_desc")} />
        <StatCard label={t("stats.rejected")} value={rejected} icon="x" variant="danger" change={t("stats.rejected_desc")} />
      </StatGrid>

      <SubNav
        items={[
          { href: "/merchant-pricing", label: t("tab_prices"), icon: "tag", count: prices ? String(prices) : undefined },
          {
            href: "/merchant-pricing/products",
            label: t("tab_products"),
            icon: "package",
            count: products ? String(products) : undefined,
          },
          { href: "/merchant-pricing/history", label: t("tab_history"), icon: "clock" },
        ]}
      />
      {children}
    </div>
  );
}
