import type { Metadata } from "next";
import { pageMeta } from "@/lib/dash-metadata";
import { SettingsFormView } from "@/features/blink-cash";
import { getSettings } from "../ops-data";

export function generateMetadata(): Promise<Metadata> {
  return pageMeta("blink_cash", undefined, "tab_settings");
}

export default async function Page() {
  const { settings, migrationPending, error } = await getSettings();
  return <SettingsFormView settings={settings} migrationPending={migrationPending} error={error} />;
}
