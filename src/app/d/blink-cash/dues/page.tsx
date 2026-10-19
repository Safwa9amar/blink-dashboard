import type { Metadata } from "next";
import { pageMeta } from "@/lib/dash-metadata";
import { getMerchantDues } from "../data";
import { getSettings } from "../ops-data";
import Client from "../client";

export function generateMetadata(): Promise<Metadata> {
  return pageMeta("blink_cash", undefined, "tab_dues");
}

// Merchant dues tab — what each merchant store owes Blink in commission, from blink-server,
// with "Record payment" and confirm / reject for app payments waiting on staff.
export default async function Page() {
  const [{ summary, error }, { settings }] = await Promise.all([getMerchantDues(), getSettings()]);
  return <Client tab="dues" dues={summary} duesError={error} methods={settings?.dues_payment_methods} />;
}
