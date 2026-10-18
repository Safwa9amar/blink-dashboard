import type { Metadata } from "next";
import { pageMeta } from "@/lib/dash-metadata";
import { getPricingAccess } from "../data";
import Client from "./client";

export function generateMetadata(): Promise<Metadata> {
  return pageMeta("pricing", undefined, "tabs.preview");
}

export default async function PricingPreviewPage() {
  await getPricingAccess();
  return <Client />;
}
