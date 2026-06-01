import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/ui";
import { NotifSubNav } from "./sub-nav";

export default async function NotificationsLayout({ children }: { children: ReactNode }) {
  const t = await getTranslations("notif");
  return (
    <div>
      <PageHeader title={t("title")} description={t("description")} />
      <NotifSubNav />
      {children}
    </div>
  );
}
