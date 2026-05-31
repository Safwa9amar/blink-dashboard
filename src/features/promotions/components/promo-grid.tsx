"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { StatGrid, StatCard, SearchBox, Button, FilterPills } from "@/components/ui";
import { PROMOS, P_CATS } from "../data";
import { PromoCard } from "./promo-card";

export function PromoGrid({ onNew }: { onNew: () => void }) {
  const t = useTranslations("promotions");
  const [cat, setCat] = useState("All");
  const shown = cat === "All" ? PROMOS : PROMOS.filter((p) => p.cat === cat);
  return (
    <>
      <StatGrid cols={4}>
        <StatCard label={t("stats.active")} value={18} variant="primary" icon="gift" change={t("stats.active_chg")} />
        <StatCard label={t("stats.redemptions")} value="6,922" variant="success" icon="trending" change={t("stats.redemptions_chg")} />
        <StatCard label={t("stats.spend")} value="142K DA" variant="warning" icon="dollar" change={t("stats.spend_chg")} />
        <StatCard label={t("stats.ctr")} value="7.0%" variant="info" icon="activity" change={t("stats.ctr_chg")} />
      </StatGrid>
      <div className="flex items-center gap-3 mb-[18px]">
        <SearchBox placeholder={t("search")} />
        <Button icon="plus" onClick={onNew} className="ms-auto">
          {t("new_campaign")}
        </Button>
      </div>
      <FilterPills options={P_CATS.map((c) => [c, c] as [string, string])} value={cat} onChange={setCat} />
      <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-[18px]">
        {shown.map((p, i) => (
          <PromoCard key={i} p={p} />
        ))}
      </div>
    </>
  );
}
