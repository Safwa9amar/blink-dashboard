"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { PageHeader, SubTabs, Button } from "@/components/ui";
import { NewsList, Compose, NewsCategories, NewsAnalytics } from "@/features/news";

export default function NewsClient() {
  const t = useTranslations("news");
  const [tab, setTab] = useState("list");
  const tabs = [
    { id: "list", label: t("all_news"), icon: "newspaper", count: "68" },
    { id: "compose", label: t("compose"), icon: "plus" },
    { id: "analytics", label: t("analytics.tab"), icon: "trending" },
    { id: "categories", label: t("categories"), icon: "tag" },
  ];
  return (
    <div>
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={
          tab === "list" ? (
            <Button icon="plus" onClick={() => setTab("compose")}>
              {t("new_post")}
            </Button>
          ) : null
        }
      />
      <SubTabs tabs={tabs} active={tab} onChange={setTab} />
      {tab === "list" && <NewsList onNew={() => setTab("compose")} />}
      {tab === "compose" && <Compose onCancel={() => setTab("list")} />}
      {tab === "analytics" && <NewsAnalytics />}
      {tab === "categories" && <NewsCategories />}
    </div>
  );
}
