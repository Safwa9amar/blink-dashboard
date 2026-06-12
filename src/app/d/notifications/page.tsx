import type { Metadata } from "next";
import { pageMeta } from "@/lib/dash-metadata";
import Client from "./client";
import { listScheduledCampaigns } from "./action";

export function generateMetadata(): Promise<Metadata> {
  return pageMeta("notif");
}

export default async function Page() {
  const scheduled = await listScheduledCampaigns();
  return <Client tab="campaigns" scheduled={scheduled} />;
}
