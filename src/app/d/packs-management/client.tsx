"use client";

import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/ui";
import { PacksStats, PacksTable, SEED_PACKS } from "@/features/packs-management";

export default function PacksManagementClient() {
  const t = useTranslations("packs");
  return (
    <div>
      <PageHeader title={t("title")} description={t("description")} />
      <PacksStats t={t} packs={SEED_PACKS} />
      <PacksTable t={t} />
    </div>
  );
}
