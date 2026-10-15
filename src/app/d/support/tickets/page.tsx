import type { Metadata } from "next";
import { pageMeta } from "@/lib/dash-metadata";
import DeskClient from "../desk-client";
import { loadDesk } from "../desk-data";

export function generateMetadata(): Promise<Metadata> {
  return pageMeta("support", undefined, "tickets");
}

export default async function Page() {
  return <DeskClient tab="tickets" data={await loadDesk({ days: 30 })} />;
}
