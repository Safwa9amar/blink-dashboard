"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Card, LivePill, PageHeader, SubTabs, type SubTab } from "@/components/ui";
import {
  AgentQueue,
  RiderQueue,
  StoreQueue,
  VerificationStats,
  queueCounts,
  partnerAwaiting,
  type PartnerQueues,
  type VerificationQueues,
} from "@/features/verification";
import { useDocumentTitle } from "@/lib/use-document-title";

type Tab = "riders" | "agents" | "stores";

export default function VerificationClient({
  queues,
  partners,
}: {
  queues: VerificationQueues;
  partners: PartnerQueues;
}) {
  const t = useTranslations("verification");
  const locale = useLocale();
  // Local tab state survives the revalidation after each review.
  const [tab, setTab] = useState<Tab>("riders");
  const counts = queueCounts(queues);
  // The headline numbers all come from the stores load: when it failed they'd
  // read as zeros, so they're hidden rather than shown next to the error.
  const storesFailed = !!queues.stores.error;
  const partnersFailed = !!partners.riders.error || !!partners.agents.error;
  const awaiting = (storesFailed ? 0 : counts.awaiting) + (partnersFailed ? 0 : partnerAwaiting(partners));
  useDocumentTitle(t("title"), awaiting || undefined);

  const tabs: SubTab[] = [
    {
      id: "riders",
      label: t("partners.tab.riders"),
      icon: "bike",
      count: partners.riders.error
        ? undefined
        : String(partners.riders.counts.pending + partners.riders.counts.replacements),
    },
    {
      id: "agents",
      label: t("partners.tab.agents"),
      icon: "shield",
      count: partners.agents.error ? undefined : String(partners.agents.counts.pending),
    },
    {
      id: "stores",
      label: t("tabs.stores"),
      icon: "store",
      // Waiting on staff in this tab: stores under review + live stores with documents to verify.
      count: storesFailed ? undefined : String(queues.stores.counts.pending + queues.stores.counts.documents),
    },
  ];
  const error = tab === "stores" ? queues.stores.error : partners[tab].error;

  return (
    <div>
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={partnersFailed && storesFailed ? undefined : <LivePill>{t("awaiting", { n: awaiting })}</LivePill>}
      />
      {!storesFailed && <VerificationStats t={t} counts={counts} />}
      <SubTabs tabs={tabs} active={tab} onChange={(id) => setTab(id as Tab)} />
      {error ? (
        <Card>
          <p role="alert" className="text-sm text-danger">
            {t("load_error", { error })}
          </p>
        </Card>
      ) : tab === "riders" ? (
        <RiderQueue t={t} locale={locale} load={partners.riders} />
      ) : tab === "agents" ? (
        <AgentQueue t={t} locale={locale} load={partners.agents} />
      ) : (
        <StoreQueue t={t} locale={locale} items={queues.stores.items} counts={queues.stores.counts} />
      )}
    </div>
  );
}
