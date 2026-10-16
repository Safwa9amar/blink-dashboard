import type { Metadata } from "next";
import { pageMeta } from "@/lib/dash-metadata";
import { Offers } from "@/features/blink-cash";
import { getOffers } from "../ops-data";

export function generateMetadata(): Promise<Metadata> {
  return pageMeta("blink_cash", undefined, "tab_offers");
}

export default async function Page() {
  const { offers, migrationPending, error, nowMs } = await getOffers();
  return <Offers offers={offers} migrationPending={migrationPending} error={error} nowMs={nowMs} />;
}
