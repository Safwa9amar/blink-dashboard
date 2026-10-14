import type { Metadata } from "next";
import { requirePathAccess } from "@/lib/auth/staff";
import { pageMeta } from "@/lib/dash-metadata";
import { loadAnalytics } from "../data";
import Client from "./client";

export function generateMetadata(): Promise<Metadata> {
  return pageMeta("promotions", undefined, "analytics");
}

const RANGES = [7, 30, 90];

export default async function Page({ searchParams }: { searchParams: Promise<{ days?: string }> }) {
  await requirePathAccess("/promotions");
  const { days: raw } = await searchParams;
  const parsed = Number(raw);
  const days = RANGES.includes(parsed) ? parsed : 30;
  const data = await loadAnalytics(days);
  return <Client {...data} />;
}
