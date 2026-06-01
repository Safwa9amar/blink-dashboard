import type { Metadata } from "next";
import { pageMeta } from "@/lib/dash-metadata";
import Client from "../client";

export function generateMetadata(): Promise<Metadata> {
  return pageMeta("news", undefined, "compose");
}

export default function Page() {
  return <Client tab="compose" />;
}
