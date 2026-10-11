import type { Metadata } from "next";
import { pageMeta } from "@/lib/dash-metadata";
import { getAgentQueue } from "@/app/d/verification/partner-data";
import Client from "./client";

export function generateMetadata(): Promise<Metadata> {
  return pageMeta("verification.pages.agents");
}

// The agent + agent shop review queue — the loader gates on /agents.
export default async function Page() {
  return <Client load={await getAgentQueue()} />;
}
