import type { Metadata } from "next";
import { pageMeta } from "@/lib/dash-metadata";
import { AISettings } from "@/features/settings";

export function generateMetadata(): Promise<Metadata> {
  return pageMeta("settings", undefined, "ai.title");
}

export default function Page() {
  return <AISettings />;
}
