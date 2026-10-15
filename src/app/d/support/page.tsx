import type { Metadata } from "next";
import { pageMeta } from "@/lib/dash-metadata";
import DeskClient from "./desk-client";
import { loadDesk } from "./desk-data";

export function generateMetadata(): Promise<Metadata> {
  return pageMeta("support");
}

export default async function Page() {
  return <DeskClient tab="overview" data={await loadDesk({ days: 30 })} />;
}
