import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { PageHeader, SubNav } from "@/components/ui";
import { requirePathAccess } from "@/lib/auth/staff";
import { PricingHeaderActions } from "@/features/pricing";
import { getCatalog, getOverrides, getPricingAccess } from "./data";

// Pricing cockpit: Overview · Overrides · Simulator · History (routed sub-pages).
export default async function PricingLayout({ children }: { children: ReactNode }) {
  await requirePathAccess("/pricing");
  const t = await getTranslations("pricing");
  const [{ canEdit }, catalog, active] = await Promise.all([
    getPricingAccess(),
    getCatalog(),
    getOverrides({ status: "active" }),
  ]);
  return (
    <div>
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={<PricingHeaderActions fees={catalog.data} canEdit={canEdit} />}
      />
      <SubNav
        items={[
          { href: "/pricing", label: t("tabs.overview"), icon: "tag" },
          { href: "/pricing/overrides", label: t("tabs.overrides"), icon: "grid", count: active.error ? undefined : String(active.data.length) },
          { href: "/pricing/simulator", label: t("tabs.simulator"), icon: "search" },
          { href: "/pricing/history", label: t("tabs.history"), icon: "clock" },
        ]}
      />
      {children}
    </div>
  );
}
