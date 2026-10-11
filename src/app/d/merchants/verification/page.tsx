import type { Metadata } from "next";
import { pageMeta } from "@/lib/dash-metadata";
import { getVerificationQueues } from "@/app/d/verification/data";
import Client from "./client";

export function generateMetadata(): Promise<Metadata> {
  return pageMeta("verification.pages.merchants");
}

// The store review queue — the loader gates on /merchants.
export default async function Page() {
  return <Client queues={await getVerificationQueues()} />;
}
