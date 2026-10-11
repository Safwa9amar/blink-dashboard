"use client";

import { useTranslations } from "next-intl";
import {
  Overview,
  Ledger,
  Dues,
  AgentFloat,
  type BlinkTransaction,
  type DuesHeadline,
  type MerchantDuesSummary,
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
}

export default function BlinkCashClient({
  tab,
  transactions,
  error,
  dues,
  duesError,
  duesHeadline,
}: BlinkCashClientProps) {
  const t = useTranslations("blink_cash");
  switch (tab) {
    case "ledger":
      return <Ledger t={t} txns={transactions ?? null} error={error} />;
    case "dues":
      return <Dues t={t} summary={dues ?? null} error={duesError} />;
    case "agents":
      return <AgentFloat t={t} />;
    default:
      return <Overview t={t} txns={transactions ?? null} error={error} dues={duesHeadline} />;
  }
}
