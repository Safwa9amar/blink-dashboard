import type { Metadata } from "next";
import { pageMeta } from "@/lib/dash-metadata";
import { getHistory } from "../data";
import Client from "./client";

export function generateMetadata(): Promise<Metadata> {
  return pageMeta("pricing", undefined, "tabs.history");
}

export default async function PricingHistoryPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { key } = await searchParams;
  const { data, error } = await getHistory(typeof key === "string" ? key : undefined);
  return <Client changes={data} error={error} />;
}
