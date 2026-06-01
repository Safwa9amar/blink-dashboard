import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { PageHeader, SubNav } from "@/components/ui";

export default async function PromotionsLayout({ children }: { children: ReactNode }) {
  const t = await getTranslations("promotions");
  const items = [
    { href: "/promotions", label: t("campaigns"), icon: "gift", count: "24" },
    { href: "/promotions/new", label: t("create"), icon: "plus" },
    { href: "/promotions/analytics", label: t("analytics"), icon: "trending" },
  ];
  return (
    <div>
      <PageHeader title={t("title")} description={t("description")} />
      <SubNav items={items} />
      {children}
    </div>
  );
}
