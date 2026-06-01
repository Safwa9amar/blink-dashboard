import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/ui";
import { MarketplaceSubNav } from "./sub-nav";

export default async function MarketplaceLayout({ children }: { children: ReactNode }) {
  const t = await getTranslations("marketplace");
  return (
    <div>
      <PageHeader title={t("title")} description={t("description")} />
      <MarketplaceSubNav />
      {children}
    </div>
  );
}
