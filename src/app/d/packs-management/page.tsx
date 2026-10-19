import type { Metadata } from "next";
import { pageMeta } from "@/lib/dash-metadata";
import { getPackCounts, getPacks } from "./data";
import Client from "./client";

export function generateMetadata(): Promise<Metadata> {
  return pageMeta("packs", undefined, "tab_review");
}

// Under review tab — free-delivery packs wait here until staff approve them,
// oldest first so nobody waits longest. Both loaders gate on the section.
export default async function PacksReviewPage() {
  const [{ packs, total, error }, counts] = await Promise.all([getPacks("under_review"), getPackCounts()]);
  return <Client view="review" packs={packs} total={total} counts={counts} error={error} />;
}
