import type { Metadata } from "next";
import { pageMeta } from "@/lib/dash-metadata";
import Client from "./client";

export function generateMetadata(): Promise<Metadata> {
  return pageMeta("access");
}

// Access is super_admin-gated in the layout, which wraps every access sub-route.
export default function Page() {
  return <Client tab="members" />;
}
