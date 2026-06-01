import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { PageHeader, SubNav, Button } from "@/components/ui";
import { getTransactions } from "./data";

export default async function BlinkCashLayout({ children }: { children: ReactNode }) {
  const t = await getTranslations("blink_cash");
  const { rows } = await getTransactions();

  const items = [
    { href: "/blink-cash", label: t("overview"), icon: "wallet" },
    { href: "/blink-cash/ledger", label: t("tab_ledger"), icon: "card", count: String(rows?.length ?? 0) },
    { href: "/blink-cash/dues", label: t("tab_dues"), icon: "dollar", count: "48" },
    { href: "/blink-cash/agents", label: t("agent_float"), icon: "store" },
  ];

  return (
    <div>
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={<Button icon="download">{t("export_report")}</Button>}
      />
      <SubNav items={items} />
      {children}
    </div>
  );
}
