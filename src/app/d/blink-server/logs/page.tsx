import type { Metadata } from "next";
import { pageMeta } from "@/lib/dash-metadata";
import { LiveLogs } from "@/features/blink-server";

export function generateMetadata(): Promise<Metadata> {
  return pageMeta("blink_server", undefined, "tab_logs");
}

export default function Page() {
  return <LiveLogs />;
}
