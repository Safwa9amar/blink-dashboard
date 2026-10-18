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
  const { key, limit } = await searchParams;
  const n = Number(typeof limit === "string" ? limit : 50);
  const size = [50, 100, 200].includes(n) ? n : 50;
  const { data, error } = await getHistory(typeof key === "string" ? key : undefined, size);
  return <Client changes={data} error={error} limit={size} />;
}
