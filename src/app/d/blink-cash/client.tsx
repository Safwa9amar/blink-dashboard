"use client";

import { useTranslations } from "next-intl";
import {
  Overview,
  Ledger,
  Dues,
  AgentDues,
  type AgentDuesSummary,
  type BlinkTransaction,
  type CashDays,
  type DuesHeadline,
  type MerchantDuesSummary,
  type SummaryResult,
} from "@/features/blink-cash";

type Tab = "overview" | "ledger" | "dues" | "agents";

interface BlinkCashClientProps {
  tab: Tab;
  transactions?: BlinkTransaction[] | null;
  error?: string;
  /** Dues tab: merchant dues from blink-server, or the reason they couldn't load. */
  dues?: MerchantDuesSummary | null;
  duesError?: string;
  /** Overview: the merchant dues headline, as a promise so it streams in. */
  duesHeadline?: Promise<DuesHeadline | null>;
  /** Overview: the Blink Cash report for `days`, streamed. */
  cash?: Promise<SummaryResult>;
  days?: CashDays;
  /** Agents tab: agent dues from blink-server, or why they couldn't load. */
  agents?: AgentDuesSummary | null;
  agentsError?: string;
}

export default function BlinkCashClient({
  tab,
  transactions,
  error,
  dues,
  duesError,
  duesHeadline,
  cash,
  days = 30,
  agents,
  agentsError,
}: BlinkCashClientProps) {
  const t = useTranslations("blink_cash");
  switch (tab) {
    case "ledger":
      return <Ledger t={t} txns={transactions ?? null} error={error} />;
    case "dues":
      return <Dues t={t} summary={dues ?? null} error={duesError} />;
    case "agents":
      return <AgentDues t={t} summary={agents ?? null} error={agentsError} />;
    default:
      return <Overview t={t} txns={transactions ?? null} error={error} dues={duesHeadline} cash={cash} days={days} />;
  }
}
