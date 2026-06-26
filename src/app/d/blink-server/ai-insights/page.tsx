import type { Metadata } from "next";
import { pageMeta } from "@/lib/dash-metadata";
import { AiInsights } from "@/features/blink-server";

export function generateMetadata(): Promise<Metadata> {
  return pageMeta("blink_server", undefined, "tab_ai_insights");
}

export default function Page() {
  return <AiInsights />;
}
