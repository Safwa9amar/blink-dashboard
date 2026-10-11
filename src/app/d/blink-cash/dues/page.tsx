import type { Metadata } from "next";
import { pageMeta } from "@/lib/dash-metadata";
import { getMerchantDues } from "../data";
import Client from "../client";

export function generateMetadata(): Promise<Metadata> {
  return pageMeta("blink_cash", undefined, "tab_dues");
}

// Dues tab — what each merchant store owes Blink in commission, from blink-server.
export default async function Page() {
  const { summary, error } = await getMerchantDues();
  return <Client tab="dues" dues={summary} duesError={error} />;
}
