import type { Metadata } from "next";
import { pageMeta } from "@/lib/dash-metadata";
import { getPackCounts, getPacks } from "../data";
import Client from "../client";

export function generateMetadata(): Promise<Metadata> {
  return pageMeta("packs", undefined, "tab_all");
}

// All packs tab — every store's packs, most recently changed first. The status
// pills count from exact per-status counts, not from the (capped) loaded list.
export default async function AllPacksPage() {
  const [{ packs, total, error }, counts] = await Promise.all([getPacks(), getPackCounts()]);
  return <Client view="all" packs={packs} total={total} counts={counts} error={error} />;
}
