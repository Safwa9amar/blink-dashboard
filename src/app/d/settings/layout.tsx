import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/ui";
import { SettingsRail } from "./rail";

export default async function SettingsLayout({ children }: { children: ReactNode }) {
  const t = await getTranslations("settings");
  return (
    <div>
      <PageHeader title={t("title")} description={t("description")} />
      <div className="flex gap-8">
        <SettingsRail />
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </div>
  );
}
