"use client";

import { useTranslations } from "next-intl";
import {
  Overview,
  Dues,
  AgentDues,
  type AgentDuesSummary,
  type CashDays,
  type DuesHeadline,
  type LedgerRow,
  type MerchantDuesSummary,
  type SummaryResult,
} from "@/features/blink-cash";
import type { AttentionItem } from "@/features/blink-cash/lib/attention";
import type { BlinkCashSettings } from "@/features/blink-cash/lib/settings";
import type { OpsCounts } from "@/features/blink-cash/ops-types";
import type { PayMethod } from "@/features/blink-cash/components/payments";

type Tab = "overview" | "dues" | "agents";

interface BlinkCashClientProps {
  tab: Tab;
  /** Overview: the latest ledger rows (with names). */
  latest?: LedgerRow[];
  error?: string;
  /** Dues tab: merchant dues from blink-server, or the reason they couldn't load. */
  dues?: MerchantDuesSummary | null;
  duesError?: string;
  /** Overview: the merchant dues headline, as a promise so it streams in. */
  duesHeadline?: Promise<DuesHeadline | null>;
  /** Overview: the Blink Cash report for `days`, streamed. */
  cash?: Promise<SummaryResult>;
  days?: CashDays;
  counts?: Promise<OpsCounts>;
  attention?: Promise<AttentionItem[] | null>;
  settings?: BlinkCashSettings | null;
  settingsPending?: boolean;
  /** Agents tab: agent dues from blink-server, or why they couldn't load. */
  agents?: AgentDuesSummary | null;
  agentsError?: string;
  agentDefaultLimit?: number | null;
  limitsPending?: boolean;
  /** Dues payment methods from blink_cash_settings (the "Record payment" choices). */
  methods?: PayMethod[];
}

export default function BlinkCashClient(p: BlinkCashClientProps) {
  const t = useTranslations("blink_cash");
  switch (p.tab) {
    case "dues":
      return <Dues t={t} summary={p.dues ?? null} error={p.duesError} methods={p.methods} />;
    case "agents":
      return (
        <AgentDues
          t={t}
          summary={p.agents ?? null}
          error={p.agentsError}
          defaultLimit={p.agentDefaultLimit ?? null}
          methods={p.methods}
          migrationPending={p.limitsPending}
        />
      );
    default:
      return (
        <Overview
          t={t}
          latest={p.latest ?? []}
          error={p.error}
          dues={p.duesHeadline}
          cash={p.cash}
          days={p.days ?? 30}
          counts={p.counts ?? Promise.resolve({ pendingOps: null, review: null, frozen: null, pendingAgentPayments: null, pendingMerchantPayments: null })}
          attention={p.attention ?? Promise.resolve(null)}
          settings={p.settings ?? null}
          settingsPending={p.settingsPending}
        />
      );
  }
}
