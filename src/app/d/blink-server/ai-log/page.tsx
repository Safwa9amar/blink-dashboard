import type { Metadata } from "next";
import { pageMeta } from "@/lib/dash-metadata";
import { AiLog } from "@/features/blink-server";

export function generateMetadata(): Promise<Metadata> {
  return pageMeta("blink_server", undefined, "tab_ai_log");
}

export default function Page() {
  return <AiLog />;
}
