import type { Metadata } from "next";
import { pageMeta } from "@/lib/dash-metadata";
import { SettingsFormView } from "@/features/blink-cash";
import { GatewayProviders } from "@/features/blink-cash/components/online-payments";
import { getPaymentProviders } from "../data";
import { getSettings } from "../ops-data";

export function generateMetadata(): Promise<Metadata> {
  return pageMeta("blink_cash", undefined, "tab_settings");
}

export default async function Page() {
  const [{ settings, migrationPending, error }, gateways] = await Promise.all([getSettings(), getPaymentProviders()]);
  return (
    <>
      <GatewayProviders providers={gateways.providers} error={gateways.error} />
      <SettingsFormView settings={settings} migrationPending={migrationPending} error={error} />
    </>
  );
}
