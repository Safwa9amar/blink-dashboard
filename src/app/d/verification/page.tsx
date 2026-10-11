import type { Metadata } from "next";
import { pageMeta } from "@/lib/dash-metadata";
import { getVerificationQueues } from "./data";
import { getPartnerQueues } from "./partner-data";
import Client from "./client";

export function generateMetadata(): Promise<Metadata> {
  return pageMeta("verification");
}

// The review queue — the loader gates on /verification (super / ops / HR admins).
export default async function Page() {
  const [queues, partners] = await Promise.all([getVerificationQueues(), getPartnerQueues()]);
  return <Client queues={queues} partners={partners} />;
}
