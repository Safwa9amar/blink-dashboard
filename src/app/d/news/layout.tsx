import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { PageHeader, SubNav } from "@/components/ui";
import { getNewsPosts } from "./data";
import { NewsStoreSeeder } from "./store-seeder";

export default async function NewsLayout({ children }: { children: ReactNode }) {
  const t = await getTranslations("news");
  const { posts, error } = await getNewsPosts();

  const items = [
    { href: "/news", label: t("all_news"), icon: "newspaper", count: String(posts.length) },
    { href: "/news/compose", label: t("compose"), icon: "plus" },
    { href: "/news/analytics", label: t("analytics.tab"), icon: "trending" },
    { href: "/news/categories", label: t("categories"), icon: "tag" },
  ];

  return (
    <div>
      <PageHeader title={t("title")} description={t("description")} />
      <SubNav items={items} />
      <NewsStoreSeeder posts={posts} />
      {error && (
        <div className="mb-4 rounded-xl border border-danger/30 bg-danger-light px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}
      {children}
    </div>
  );
}
