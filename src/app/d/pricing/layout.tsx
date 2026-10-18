import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { PageHeader, SubNav } from "@/components/ui";
import { requirePathAccess } from "@/lib/auth/staff";

// Pricing config: every Blink price and partner rate, with scoped, dated overrides.
// Tabs are routed sub-pages (Defaults · Overrides · History · Preview).
export default async function PricingLayout({ children }: { children: ReactNode }) {
  await requirePathAccess("/pricing");
  const t = await getTranslations("pricing");
  return (
    <div>
      <PageHeader title={t("title")} description={t("description")} />
      <SubNav
        items={[
          { href: "/pricing", label: t("tabs.defaults"), icon: "tag" },
          { href: "/pricing/overrides", label: t("tabs.overrides"), icon: "grid" },
          { href: "/pricing/history", label: t("tabs.history"), icon: "clock" },
          { href: "/pricing/preview", label: t("tabs.preview"), icon: "search" },
        ]}
      />
      {children}
    </div>
  );
}
