import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { PageHeader, SubNav } from "@/components/ui";
import { getOpsCounts, reviewBadge } from "./ops-data";
import { ExportReportButton } from "./export-report-button";

export default async function BlinkCashLayout({ children }: { children: ReactNode }) {
  const t = await getTranslations("blink_cash");
  const counts = await getOpsCounts();
  const review = reviewBadge(counts);

  const items = [
    { href: "/blink-cash", label: t("overview"), icon: "wallet" },
    { href: "/blink-cash/ledger", label: t("tab_ledger"), icon: "card" },
    { href: "/blink-cash/wallets", label: t("tab_wallets"), icon: "bank" },
    { href: "/blink-cash/review", label: t("tab_review"), icon: "eye", count: review > 0 ? String(review) : undefined },
    { href: "/blink-cash/agents", label: t("agent_float"), icon: "store" },
    { href: "/blink-cash/dues", label: t("tab_dues"), icon: "dollar" },
    { href: "/blink-cash/offers", label: t("tab_offers"), icon: "gift" },
    { href: "/blink-cash/settings", label: t("tab_settings"), icon: "cog" },
    { href: "/blink-cash/audit", label: t("tab_audit"), icon: "shield" },
  ];

  return (
    <div>
      <PageHeader title={t("title")} description={t("description")} actions={<ExportReportButton />} />
      <SubNav items={items} />
      {children}
    </div>
  );
}
