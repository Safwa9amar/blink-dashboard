import type { Metadata } from "next";
import { pageMeta } from "@/lib/dash-metadata";
import { DangerZone } from "@/features/settings";

export function generateMetadata(): Promise<Metadata> {
  return pageMeta("settings", undefined, "danger_zone.title");
}

export default function Page() {
  return <DangerZone />;
}
