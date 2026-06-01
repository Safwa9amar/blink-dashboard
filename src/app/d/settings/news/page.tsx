import type { Metadata } from "next";
import { pageMeta } from "@/lib/dash-metadata";
import { NewsSettings } from "@/features/settings";

export function generateMetadata(): Promise<Metadata> {
  return pageMeta("settings", undefined, "news.title");
}

export default function Page() {
  return <NewsSettings />;
}
