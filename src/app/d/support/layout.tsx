import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { PageHeader, SubNav } from "@/components/ui";

export default async function SupportLayout({ children }: { children: ReactNode }) {
  const t = await getTranslations("support");
  const items = [
    { href: "/support", label: t("tab_overview"), icon: "grid" },
    { href: "/support/tickets", label: t("tickets"), icon: "support", count: "42" },
    { href: "/support/inbox", label: t("tab_inbox"), icon: "chat", count: "5" },
    { href: "/support/kb", label: t("tab_kb"), icon: "doc", count: "86" },
    { href: "/support/articles/new", label: t("create_article"), icon: "plus" },
    { href: "/support/macros", label: t("macros"), icon: "activity", count: "12" },
    { href: "/support/csat", label: t("tab_csat"), icon: "star" },
    { href: "/support/agents", label: t("tab_agents"), icon: "users", count: "5" },
    { href: "/support/sla", label: t("tab_sla"), icon: "shield" },
  ];
  return (
    <div>
      <PageHeader title={t("title")} description={t("description")} />
      <SubNav items={items} />
      {children}
    </div>
  );
}
