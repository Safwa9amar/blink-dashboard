import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { PageHeader, StatGrid, StatCard, SubNav } from "@/components/ui";
import { getPackCounts } from "./data";

// The counts loader gates on the section (the pages' loaders gate again themselves).
export default async function PacksManagementLayout({ children }: { children: ReactNode }) {
  const t = await getTranslations("packs");
  const { total, freeDeliveryActive, byStatus } = await getPackCounts();
  const review = byStatus.under_review;

  return (
    <div>
      <PageHeader title={t("title")} description={t("description")} />

      <StatGrid cols={4}>
        <StatCard label={t("stats.reviewing")} value={review} icon="clock" variant="warning" change={t("stats.reviewing_desc")} />
        <StatCard label={t("stats.active")} value={byStatus.active} icon="check" variant="success" change={t("stats.active_desc")} />
        <StatCard label={t("stats.free_delivery")} value={freeDeliveryActive} icon="truck" variant="info" change={t("stats.free_delivery_desc")} />
        <StatCard label={t("stats.total")} value={total} icon="package" variant="primary" change={t("stats.total_desc")} />
      </StatGrid>

      <SubNav
        items={[
          { href: "/packs-management", label: t("tab_review"), icon: "clock", count: review ? String(review) : undefined },
          { href: "/packs-management/all", label: t("tab_all"), icon: "gift", count: total ? String(total) : undefined },
        ]}
      />
      {children}
    </div>
  );
}
