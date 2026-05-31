import { createClient } from "@/lib/supabase/server";
import RidersClient from "./client";
import type { Metadata } from "next";
import { pageMeta } from "@/lib/dash-metadata";

export function generateMetadata(): Promise<Metadata> {
  return pageMeta("riders");
}

export default async function RidersPage() {
  const supabase = await createClient();

  const { data: riders, error } = await supabase
    .from("rider_profiles")
    .select("*, users(first_name, last_name, phone_number)")
    .order("created_at", { ascending: false })
    .limit(50);

  return <RidersClient riders={riders} error={error?.message} />;
}
