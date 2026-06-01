import type { Metadata } from "next";
import { pageMeta } from "@/lib/dash-metadata";
import Client from "./client";

export function generateMetadata(): Promise<Metadata> {
  return pageMeta("marketplace");
}

export default function MarketplacePage() {
  return <Client tab="stores" />;
}
