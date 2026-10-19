import type { Metadata } from "next";
import { pageMeta } from "@/lib/dash-metadata";
import { Review } from "@/features/blink-cash";
import { getReviewQueue } from "../ops-data";

export function generateMetadata(): Promise<Metadata> {
  return pageMeta("blink_cash", undefined, "tab_review");
}

// Review — electronic requests waiting for approval, plus app dues payments (agents and
// merchants) waiting for a staff confirmation.
export default async function Page() {
  return <Review queue={await getReviewQueue()} />;
}
