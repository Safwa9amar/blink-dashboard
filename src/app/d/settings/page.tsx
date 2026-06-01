import type { Metadata } from "next";
import { pageMeta } from "@/lib/dash-metadata";
import { GeneralSettings } from "@/features/settings";

export function generateMetadata(): Promise<Metadata> {
  return pageMeta("settings");
}

export default function Page() {
  return <GeneralSettings />;
}
