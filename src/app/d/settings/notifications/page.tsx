import type { Metadata } from "next";
import { pageMeta } from "@/lib/dash-metadata";
import { NotificationsSettings } from "@/features/settings";

export function generateMetadata(): Promise<Metadata> {
  return pageMeta("settings", undefined, "notifications_settings.title");
}

export default function Page() {
  return <NotificationsSettings />;
}
