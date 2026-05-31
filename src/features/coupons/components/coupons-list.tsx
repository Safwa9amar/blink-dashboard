"use client";

import { useTranslations } from "next-intl";
import { StatGrid, StatCard, Button, SearchBox } from "@/components/ui";
import { COUPONS } from "../data";
import { CouponCard } from "./coupon-card";

export function CouponsList({ onNew }: { onNew: () => void }) {
  const t = useTranslations("coupons");
  return (
    <>
      <StatGrid cols={4}>
        <StatCard label={t("stats.active")} value={34} variant="primary" icon="ticket" change={t("stats.active_chg")} />
        <StatCard label={t("stats.redeemed")} value="1,208" variant="success" icon="trending" change={t("stats.redeemed_chg")} />
        <StatCard label={t("stats.locked")} value={9} variant="warning" icon="lock" change={t("stats.locked_chg")} />
        <StatCard label={t("stats.rate")} value="42%" variant="info" icon="activity" change={t("stats.rate_chg")} />
      </StatGrid>
      <div className="flex items-center gap-3 mb-[18px]">
        <SearchBox placeholder={t("search")} />
        <Button variant="secondary" icon="filter">{t("status")}</Button>
        <Button icon="plus" onClick={onNew} className="ms-auto">
          {t("new_coupon")}
        </Button>
      </div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-[18px]">
        {COUPONS.map((c, i) => (
          <CouponCard key={i} c={c} />
        ))}
      </div>
    </>
  );
}
