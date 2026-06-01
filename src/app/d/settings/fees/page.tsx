import type { Metadata } from "next";
import { pageMeta } from "@/lib/dash-metadata";
import { FeesSettings } from "@/features/settings";

export function generateMetadata(): Promise<Metadata> {
  return pageMeta("settings", undefined, "fees.title");
}

export default function Page() {
  return <FeesSettings />;
}
