import type { Metadata } from "next";
import { pageMeta } from "@/lib/dash-metadata";
import { getPacks } from "./data";
import Client from "./client";

export function generateMetadata(): Promise<Metadata> {
  return pageMeta("packs", undefined, "tab_review");
}

// Under review tab — free-delivery packs wait here until staff approve them,
// oldest first so nobody waits longest.
export default async function PacksReviewPage() {
  const { packs, total, error } = await getPacks("under_review");
  return <Client view="review" packs={packs} total={total} error={error} />;
}
