import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/ui";
import { VehicleSubNav } from "./sub-nav";

export default async function VehiclesLayout({ children }: { children: ReactNode }) {
  const t = await getTranslations("vehicles");
  return (
    <div>
      <PageHeader title={t("title")} description={t("description")} />
      <VehicleSubNav />
      {children}
    </div>
  );
}
