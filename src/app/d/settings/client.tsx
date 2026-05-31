"use client";

import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/ui";
import { SettingsTabs } from "@/features/settings";

export default function SettingsClient() {
  const t = useTranslations("settings");

  return (
    <div>
      <PageHeader title={t("title")} description={t("description")} />
      <SettingsTabs />
    </div>
  );
}
