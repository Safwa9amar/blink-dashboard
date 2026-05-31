"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { PageHeader, SubTabs, Button } from "@/components/ui";
import { PromoGrid, PromoCreate, PromoAnalytics } from "@/features/promotions";

export default function PromotionsClient() {
  const t = useTranslations("promotions");
  const [tab, setTab] = useState("grid");
  const tabs = [
    { id: "grid", label: t("campaigns"), icon: "gift", count: "24" },
    { id: "create", label: t("create"), icon: "plus" },
    { id: "analytics", label: t("analytics"), icon: "trending" },
  ];
  return (
    <div>
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={
          tab === "grid" ? (
            <Button icon="plus" onClick={() => setTab("create")}>
              {t("new_campaign")}
            </Button>
          ) : null
        }
      />
      <SubTabs tabs={tabs} active={tab} onChange={setTab} />
      {tab === "grid" && <PromoGrid onNew={() => setTab("create")} />}
      {tab === "create" && <PromoCreate onCancel={() => setTab("grid")} />}
      {tab === "analytics" && <PromoAnalytics />}
    </div>
  );
}
