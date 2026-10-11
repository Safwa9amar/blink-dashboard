import type { Metadata } from "next";
import { pageMeta } from "@/lib/dash-metadata";
import { getRiderQueue } from "@/app/d/verification/partner-data";
import Client from "./client";

export function generateMetadata(): Promise<Metadata> {
  return pageMeta("verification.pages.riders");
}

// The rider review queue — the loader gates on /riders.
export default async function Page() {
  return <Client load={await getRiderQueue()} />;
}
