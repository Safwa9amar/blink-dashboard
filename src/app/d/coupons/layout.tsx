import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { PageHeader, SubNav } from "@/components/ui";

export default async function CouponsLayout({ children }: { children: ReactNode }) {
  const t = await getTranslations("coupons");
  const items = [
    { href: "/coupons", label: t("all_coupons"), icon: "ticket", count: "34" },
    { href: "/coupons/new", label: t("create_coupon"), icon: "plus" },
  ];
  return (
    <div>
      <PageHeader title={t("title")} description={t("description")} />
      <SubNav items={items} />
      {children}
    </div>
  );
}
