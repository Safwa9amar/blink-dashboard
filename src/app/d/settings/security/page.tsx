import type { Metadata } from "next";
import { pageMeta } from "@/lib/dash-metadata";
import { SecuritySettings } from "@/features/settings";

export function generateMetadata(): Promise<Metadata> {
  return pageMeta("settings", undefined, "security.title");
}

export default function Page() {
  return <SecuritySettings />;
}
