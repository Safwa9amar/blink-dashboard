import type { Metadata } from "next";
import { pageMeta } from "@/lib/dash-metadata";
import Client from "../client";

export function generateMetadata(): Promise<Metadata> {
  return pageMeta("support", undefined, "tab_csat");
}

export default function Page() {
  return <Client tab="csat" />;
}
