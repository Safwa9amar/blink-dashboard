"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { PageHeader, SubTabs, Button } from "@/components/ui";
import { CouponsList, CreateCoupon } from "@/features/coupons";

export default function CouponsClient() {
  const t = useTranslations("coupons");
  const [tab, setTab] = useState("list");
  const tabs = [
    { id: "list", label: t("all_coupons"), icon: "ticket", count: "34" },
    { id: "create", label: t("create_coupon"), icon: "plus" },
  ];
  return (
    <div>
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={
          tab === "list" ? (
            <Button icon="plus" onClick={() => setTab("create")}>
              {t("new_coupon")}
            </Button>
          ) : null
        }
      />
      <SubTabs tabs={tabs} active={tab} onChange={setTab} />
      {tab === "list" ? <CouponsList onNew={() => setTab("create")} /> : <CreateCoupon onCancel={() => setTab("list")} />}
    </div>
  );
}
