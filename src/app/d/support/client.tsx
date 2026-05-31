"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { PageHeader, SubTabs, Button } from "@/components/ui";
import {
  OverviewTab,
  TicketsTab,
  InboxTab,
  KbTab,
  CreateArticle,
  MacrosTab,
  CsatTab,
  AgentsTab,
  SlaTab,
} from "@/features/support";
import { useDocumentTitle } from "@/lib/use-document-title";

export default function SupportClient() {
  const t = useTranslations("support");
  const [tab, setTab] = useState("overview");
  useDocumentTitle(t("title"), 42); // open tickets
  const tabs = [
    { id: "overview", label: t("tab_overview"), icon: "grid" },
    { id: "tickets", label: t("tickets"), icon: "support", count: "42" },
    { id: "inbox", label: t("tab_inbox"), icon: "chat", count: "5" },
    { id: "kb", label: t("tab_kb"), icon: "doc", count: "86" },
    { id: "create", label: t("create_article"), icon: "plus" },
    { id: "macros", label: t("macros"), icon: "activity", count: "12" },
    { id: "csat", label: t("tab_csat"), icon: "star" },
    { id: "agents", label: t("tab_agents"), icon: "users", count: "5" },
    { id: "sla", label: t("tab_sla"), icon: "shield" },
  ];
  const actions =
    tab === "tickets" ? (
      <Button icon="plus">{t("new_ticket")}</Button>
    ) : tab === "kb" || tab === "create" ? (
      <Button icon="plus" onClick={() => setTab("create")}>
        {t("new_article")}
      </Button>
    ) : null;
  return (
    <div>
      <PageHeader title={t("title")} description={t("description")} actions={actions} />
      <SubTabs tabs={tabs} active={tab} onChange={setTab} />
      {tab === "overview" && <OverviewTab t={t} />}
      {tab === "tickets" && <TicketsTab t={t} />}
      {tab === "inbox" && <InboxTab t={t} />}
      {tab === "kb" && <KbTab t={t} onNew={() => setTab("create")} />}
      {tab === "create" && <CreateArticle t={t} onCancel={() => setTab("kb")} />}
      {tab === "macros" && <MacrosTab t={t} />}
      {tab === "csat" && <CsatTab t={t} />}
      {tab === "agents" && <AgentsTab t={t} />}
      {tab === "sla" && <SlaTab t={t} />}
    </div>
  );
}
