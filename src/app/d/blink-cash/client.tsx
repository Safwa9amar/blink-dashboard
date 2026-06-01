"use client";

import { useTranslations } from "next-intl";
import { Overview, Ledger, Dues, AgentFloat, type BlinkTransaction } from "@/features/blink-cash";

type Tab = "overview" | "ledger" | "dues" | "agents";

interface BlinkCashClientProps {
  tab: Tab;
  transactions?: BlinkTransaction[] | null;
  error?: string;
}

export default function BlinkCashClient({ tab, transactions, error }: BlinkCashClientProps) {
  const t = useTranslations("blink_cash");
  switch (tab) {
    case "ledger":
      return <Ledger t={t} txns={transactions ?? null} error={error} />;
    case "dues":
      return <Dues t={t} />;
    case "agents":
      return <AgentFloat t={t} />;
    default:
      return <Overview t={t} txns={transactions ?? null} error={error} />;
  }
}
