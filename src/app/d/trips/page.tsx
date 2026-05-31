import { createClient } from "@/lib/supabase/server";
import TripsClient from "./client";
import type { Metadata } from "next";
import { pageMeta } from "@/lib/dash-metadata";

export function generateMetadata(): Promise<Metadata> {
  return pageMeta("trips");
}

export default async function TripsPage() {
  const supabase = await createClient();

  const { data: trips, error } = await supabase
    .from("trips")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  return <TripsClient trips={trips} error={error?.message} />;
}
