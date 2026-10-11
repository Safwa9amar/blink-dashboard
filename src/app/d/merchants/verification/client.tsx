"use client";

import { useLocale, useTranslations } from "next-intl";
import { Card, LivePill, PageHeader } from "@/components/ui";
import { StoreQueue, VerificationStats, queueCounts, type VerificationQueues } from "@/features/verification";
import { useDocumentTitle } from "@/lib/use-document-title";

export default function StoreVerificationClient({ queues }: { queues: VerificationQueues }) {
  const t = useTranslations("verification");
  const locale = useLocale();
  const counts = queueCounts(queues);
  // When the load failed the headline numbers would read as zeros: hide them next to the error.
  const failed = !!queues.stores.error;
  const awaiting = failed ? 0 : counts.awaiting;
  useDocumentTitle(t("pages.merchants.title"), awaiting || undefined);

  return (
    <div>
      <PageHeader
        title={t("pages.merchants.title")}
        description={t("pages.merchants.description")}
        actions={failed ? undefined : <LivePill>{t("awaiting", { n: awaiting })}</LivePill>}
      />
      {failed ? (
        <Card>
          <p role="alert" className="text-sm text-danger">
            {t("load_error", { error: queues.stores.error ?? "" })}
          </p>
        </Card>
      ) : (
        <>
          <VerificationStats t={t} counts={counts} />
          <StoreQueue t={t} locale={locale} items={queues.stores.items} counts={queues.stores.counts} />
        </>
      )}
    </div>
  );
}
