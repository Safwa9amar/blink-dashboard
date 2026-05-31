"use client";

import { useTranslations } from "next-intl";
import { PageHeader, Toolbar, LivePill } from "@/components/ui";
import { VerificationStats, VerificationTable } from "@/features/verification";
import { useDocumentTitle } from "@/lib/use-document-title";

export default function VerificationClient() {
  const t = useTranslations("verification");
  useDocumentTitle(t("title"), 9); // awaiting review

  return (
    <div>
      <PageHeader title={t("title")} description={t("description")} actions={<LivePill>{t("awaiting", { n: 9 })}</LivePill>} />
      <VerificationStats />
      <Toolbar placeholder={t("search")} />
      <VerificationTable />
    </div>
  );
}
