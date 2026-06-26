import type { Metadata } from "next";
import { pageMeta } from "@/lib/dash-metadata";
import { Traffic } from "@/features/blink-server";

export function generateMetadata(): Promise<Metadata> {
  return pageMeta("blink_server", undefined, "tab_traffic");
}

export default function Page() {
  return <Traffic />;
}
