import type { Metadata } from "next";
import { pageMeta } from "@/lib/dash-metadata";
import { parseCashDays } from "@/features/blink-cash";
import { attentionItems } from "@/features/blink-cash/lib/attention";
import { capacityLevel, capacityRatio, effectiveLimit } from "@/features/blink-cash/lib/capacity";
import { getAgentDues, getBlinkCashSummary, getMerchantDues } from "./data";
import { getAgentLimits, getLedgerPage, getOpsCounts, getReconciliation, getSettings } from "./ops-data";
import Client from "./client";

export function generateMetadata(): Promise<Metadata> {
  return pageMeta("blink_cash");
}

// Blink Cash is the network's finance hub. The latest-activity table, the count cards
// and the fee card are read from Supabase (service role); the wallet / deposit /
// withdrawal / agent-cash stats and the chart come from blink-server's report for
// `?days=`, and the dues stat from the merchant dues report. The slow ones are streamed
// so they never block the page.
export default async function Page({ searchParams }: { searchParams: Promise<{ days?: string | string[] }> }) {
  const days = parseCashDays((await searchParams).days);
  // Gate the section (redirects) before any streamed promise starts.
  const latest = await getLedgerPage({ q: "", page: 1 }, [0, 4]);
  const { settings, migrationPending } = await getSettings();

  const duesHeadline = getMerchantDues().then(({ summary }) =>
    summary ? { totalOutstanding: summary.totalOutstanding, storesOwing: summary.owing.length } : null
  );
  const cash = getBlinkCashSummary(days);
  const counts = getOpsCounts();

  // "Needs attention": review queue, agents near their limit, drift, payments awaiting
  // confirmation, online payments with an amount mismatch.
  const attention = Promise.all([counts, getAgentDues(), getAgentLimits(), getReconciliation()]).then(
    ([c, agents, lim, recon]) => {
      const near = agents.summary
        ? agents.summary.agents.filter((a) => {
            const limit = effectiveLimit(lim.limits[a.id], lim.defaultLimit);
            return capacityLevel(capacityRatio(a.owed, limit)) !== "ok";
          }).length
        : 0;
      return attentionItems({
        reviewCount: c.review ?? 0,
        pendingAgentPayments: c.pendingAgentPayments ?? 0,
        pendingMerchantPayments: c.pendingMerchantPayments ?? 0,
        agentsNearLimit: near,
        driftCount: recon.data?.drift ?? null,
        frozenWallets: c.frozen ?? 0,
        gatewayIssues: c.gatewayIssues ?? 0,
      });
    }
  );

  return (
    <Client
      tab="overview"
      latest={latest.rows}
      error={latest.error && !latest.migrationPending ? latest.error : undefined}
      duesHeadline={duesHeadline}
      cash={cash}
      days={days}
      counts={counts}
      attention={attention}
      settings={settings}
      settingsPending={migrationPending}
    />
  );
}
