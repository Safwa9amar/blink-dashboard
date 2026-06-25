import type { Metadata } from "next";
import { pageMeta } from "@/lib/dash-metadata";
import { AiServerSettings } from "@/features/settings";

export function generateMetadata(): Promise<Metadata> {
  return pageMeta("settings", undefined, "ai_server.title");
}

export default function Page() {
  return <AiServerSettings />;
}
