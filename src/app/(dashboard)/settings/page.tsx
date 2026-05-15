import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/ui";
import { SettingsTabs } from "./settings-tabs";

export default async function SettingsPage() {
  const t = await getTranslations("settings");

  return (
    <div>
      <PageHeader title={t("title")} description={t("description")} />
      <SettingsTabs />
    </div>
  );
}
