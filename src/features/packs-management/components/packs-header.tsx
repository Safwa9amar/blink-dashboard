"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { DashIcon, PageHeader, StatCard, StatGrid, SubNav, btnPrimary } from "@/components/ui";
import type { PackCounts } from "../types";

/**
 * The list tabs' chrome: title + "New pack", headline stats (exact counts) and the
 * Under review / All tabs. The editor pages (/new, /[id]) have their own header.
 */
export function PacksHeader({ counts }: { counts: PackCounts }) {
  const t = useTranslations("packs");
  const { total, freeDeliveryActive, byStatus } = counts;
  const review = byStatus.under_review;

  return (
    <>
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={
          <Link href="/packs-management/new" className={btnPrimary}>
            <DashIcon name="plus" className="w-4 h-4" />
            {t("new_pack")}
          </Link>
        }
      />

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
    </>
  );
}
