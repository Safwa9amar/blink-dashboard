"use client";

import { useLocale, useTranslations } from "next-intl";
import { Card, LivePill, PageHeader } from "@/components/ui";
import { RiderQueue, type RiderQueueLoad } from "@/features/verification";
import { useDocumentTitle } from "@/lib/use-document-title";

export default function RiderVerificationClient({ load }: { load: RiderQueueLoad }) {
  const t = useTranslations("verification");
  const locale = useLocale();
  // Waiting on staff: new riders plus approved riders with a replaced document.
  const awaiting = load.error ? 0 : load.counts.pending + load.counts.replacements;
  useDocumentTitle(t("pages.riders.title"), awaiting || undefined);

  return (
    <div>
      <PageHeader
        title={t("pages.riders.title")}
        description={t("pages.riders.description")}
        actions={load.error ? undefined : <LivePill>{t("awaiting", { n: awaiting })}</LivePill>}
      />
      {load.error ? (
        <Card>
          <p role="alert" className="text-sm text-danger">
            {t("load_error", { error: load.error })}
          </p>
        </Card>
      ) : (
        <RiderQueue t={t} locale={locale} load={load} />
      )}
    </div>
  );
}
