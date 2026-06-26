import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { PageHeader, SubNav } from "@/components/ui";
import { getSupportChats, getSupportHistory } from "./data";
import { getKbArticles, getKbCategories } from "./kb-data";
import { SupportStoreSeeder } from "./store-seeder";
import { KbStoreSeeder } from "./kb-store-seeder";

export default async function SupportLayout({ children }: { children: ReactNode }) {
  const t = await getTranslations("support");
  const { chats, error } = await getSupportChats();
  const { chats: history, error: histError } = await getSupportHistory();
  const { data: articles, error: kbError } = await getKbArticles();
  const { data: categories, error: catError } = await getKbCategories();
  const kbCount = articles.length;
  const items = [
    { href: "/support", label: t("tab_overview"), icon: "grid" },
    { href: "/support/tickets", label: t("tickets"), icon: "support", count: "42" },
    { href: "/support/inbox", label: t("tab_inbox"), icon: "chat", count: chats.length ? String(chats.length) : undefined },
    { href: "/support/ai", label: t("tab_ai"), icon: "sparkles" },
    { href: "/support/kb", label: t("tab_kb"), icon: "doc", count: String(kbCount) },
    { href: "/support/articles/new", label: t("create_article"), icon: "plus" },
    { href: "/support/macros", label: t("macros"), icon: "activity", count: "12" },
    { href: "/support/csat", label: t("tab_csat"), icon: "star" },
    { href: "/support/agents", label: t("tab_agents"), icon: "users", count: "5" },
    { href: "/support/sla", label: t("tab_sla"), icon: "shield" },
  ];
  const kbErr = kbError ?? catError;
  const chatErr = error ?? histError;
  return (
    <div>
      <PageHeader title={t("title")} description={t("description")} />
      <SubNav items={items} />
      <SupportStoreSeeder chats={chats} history={history} />
      <KbStoreSeeder articles={articles} categories={categories} />
      {(chatErr || kbErr) && (
        <div className="mb-4 rounded-xl border border-danger/30 bg-danger-light px-4 py-3 text-sm text-danger">
          {chatErr ?? kbErr}
        </div>
      )}
      {children}
    </div>
  );
}
