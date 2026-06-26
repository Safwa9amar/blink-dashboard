import type { Metadata } from "next";
import { pageMeta } from "@/lib/dash-metadata";
import { ServerHealth } from "@/features/blink-server";

export function generateMetadata(): Promise<Metadata> {
  return pageMeta("blink_server", undefined, "tab_health");
}

export default function Page() {
  return <ServerHealth />;
}
