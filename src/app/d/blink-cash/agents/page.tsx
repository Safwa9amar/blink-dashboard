import type { Metadata } from "next";
import { pageMeta } from "@/lib/dash-metadata";
import { requirePathAccess } from "@/lib/auth/staff";
import Client from "../client";

export function generateMetadata(): Promise<Metadata> {
  return pageMeta("blink_cash", undefined, "agent_float");
}

export default async function Page() {
  await requirePathAccess("/blink-cash");
  return <Client tab="agents" />;
}
