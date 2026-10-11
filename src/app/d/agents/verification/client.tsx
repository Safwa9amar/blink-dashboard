"use client";

import { useLocale, useTranslations } from "next-intl";
import { Card, LivePill, PageHeader } from "@/components/ui";
import { AgentQueue, type AgentQueueLoad } from "@/features/verification";
import { useDocumentTitle } from "@/lib/use-document-title";

export default function AgentVerificationClient({ load }: { load: AgentQueueLoad }) {
  const t = useTranslations("verification");
  const locale = useLocale();
  const awaiting = load.error ? 0 : load.counts.pending;
  useDocumentTitle(t("pages.agents.title"), awaiting || undefined);

  return (
    <div>
      <PageHeader
        title={t("pages.agents.title")}
        description={t("pages.agents.description")}
        actions={load.error ? undefined : <LivePill>{t("awaiting", { n: awaiting })}</LivePill>}
      />
      {load.error ? (
        <Card>
          <p role="alert" className="text-sm text-danger">
            {t("load_error", { error: load.error })}
          </p>
        </Card>
      ) : (
        <AgentQueue t={t} locale={locale} load={load} />
      )}
    </div>
  );
}
