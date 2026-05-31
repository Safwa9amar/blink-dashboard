"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { PageHeader, SubTabs, Button } from "@/components/ui";
import { Overview, Ledger, Dues, AgentFloat, type BlinkTransaction } from "@/features/blink-cash";

interface BlinkCashClientProps {
  transactions: BlinkTransaction[] | null;
  error?: string;
}

export default function BlinkCashClient({ transactions, error }: BlinkCashClientProps) {
  const t = useTranslations("blink_cash");
  const [tab, setTab] = useState("overview");
  const tabs = [
    { id: "overview", label: t("overview"), icon: "wallet" },
    { id: "ledger", label: t("tab_ledger"), icon: "card", count: String(transactions?.length ?? 0) },
    { id: "dues", label: t("tab_dues"), icon: "dollar", count: "48" },
    { id: "agents", label: t("agent_float"), icon: "store" },
  ];
  return (
    <div>
      <PageHeader title={t("title")} description={t("description")} actions={<Button icon="download">{t("export_report")}</Button>} />
      <SubTabs tabs={tabs} active={tab} onChange={setTab} />
      {tab === "overview" && <Overview t={t} txns={transactions} error={error} />}
      {tab === "ledger" && <Ledger t={t} txns={transactions} error={error} />}
      {tab === "dues" && <Dues t={t} />}
      {tab === "agents" && <AgentFloat t={t} />}
    </div>
  );
}
