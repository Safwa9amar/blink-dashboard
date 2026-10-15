import type { Metadata } from "next";
import { pageMeta } from "@/lib/dash-metadata";
import { csatStats } from "@/features/support/csat-agents";
import { loadDesk } from "../desk-data";
import CsatClient from "./csat-client";

export function generateMetadata(): Promise<Metadata> {
  return pageMeta("support", undefined, "tab_csat");
}

// Six weeks of ratings feed the weekly trend.
export default async function Page() {
  const desk = await loadDesk({ days: 42 });
  const stats = csatStats(desk.conversations, desk.cases, new Date(desk.generatedAt));
  return <CsatClient stats={stats} />;
}
