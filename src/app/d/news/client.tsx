"use client";

import { useRouter } from "next/navigation";
import { NewsList, Compose, NewsCategories, NewsAnalytics } from "@/features/news";

type Tab = "list" | "compose" | "analytics" | "categories";

export default function NewsClient({ tab }: { tab: Tab }) {
  const router = useRouter();
  switch (tab) {
    case "compose":
      return <Compose onCancel={() => router.push("/news")} />;
    case "analytics":
      return <NewsAnalytics />;
    case "categories":
      return <NewsCategories />;
    default:
      return <NewsList onNew={() => router.push("/news/compose")} />;
  }
}
