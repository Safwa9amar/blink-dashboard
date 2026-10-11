import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/ui";
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
  const kbErr = kbError ?? catError;
  const chatErr = error ?? histError;
  return (
    <div>
      <PageHeader title={t("title")} description={t("description")} />
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
