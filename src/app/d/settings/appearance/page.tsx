import type { Metadata } from "next";
import { pageMeta } from "@/lib/dash-metadata";
import { AppearanceSettings } from "@/features/settings";

export function generateMetadata(): Promise<Metadata> {
  return pageMeta("settings", undefined, "appearance.title");
}

export default function Page() {
  return <AppearanceSettings />;
}
