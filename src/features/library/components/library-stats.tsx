import { StatGrid, StatCard } from "@/components/ui";
import type { LibraryStats as Stats, TFn } from "../data";

// Presentational — stats are computed server-side (the library layout) from the
// fetched rows and passed in, so this works in a server component.
export function LibraryStats({ t, stats }: { t: TFn; stats: Stats }) {
  return (
    <StatGrid cols={4}>
      <StatCard
        label={t("stats.total_products")}
        value={stats.totalProducts}
        variant="primary"
        icon="package"
        change={t("stats.total_products_chg")}
      />
      <StatCard
        label={t("stats.published")}
        value={stats.published}
        variant="success"
        icon="eye"
        change={t("stats.published_chg")}
      />
      <StatCard
        label={t("stats.categories")}
        value={stats.categories}
        variant="info"
        icon="grid"
        change={t("stats.categories_chg")}
      />
      <StatCard
        label={t("stats.stocked_by_stores")}
        value={stats.stockedByStores}
        variant="warning"
        icon="store"
        change={t("stats.stocked_by_stores_chg")}
      />
    </StatGrid>
  );
}
