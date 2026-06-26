import type { Metadata } from "next";
import { pageMeta } from "@/lib/dash-metadata";
import { Alerts } from "@/features/blink-server";

export function generateMetadata(): Promise<Metadata> {
  return pageMeta("blink_server", undefined, "tab_alerts");
}

export default function Page() {
  return <Alerts />;
}
