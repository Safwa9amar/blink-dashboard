"use client";

import { StatGrid, StatCard } from "@/components/ui";
import { deriveStats, type TFn } from "../data";
import { useMarketplaceStore } from "../store";

export function MarketplaceStats({ t }: { t: TFn }) {
  const stores = useMarketplaceStore((s) => s.stores);
  const products = useMarketplaceStore((s) => s.products);
  const categories = useMarketplaceStore((s) => s.categories);

  const stats = deriveStats(stores, products, categories);

  return (
    <StatGrid cols={4}>
      <StatCard
        label={t("stats.total_stores")}
        value={stats.totalStores}
        variant="primary"
        icon="store"
        change={t("stats.total_stores_chg")}
      />
      <StatCard
        label={t("stats.total_products")}
        value={stats.totalProducts}
        variant="info"
        icon="package"
        change={t("stats.total_products_chg")}
      />
      <StatCard
        label={t("stats.out_of_stock")}
        value={stats.outOfStock}
        variant="warning"
        icon="warn"
        change={t("stats.out_of_stock_chg")}
      />
      <StatCard
        label={t("stats.avg_rating")}
        value={stats.avgRating}
        variant="success"
        icon="star"
        change={t("stats.avg_rating_chg")}
      />
    </StatGrid>
  );
}
