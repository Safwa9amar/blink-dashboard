import type { Metadata } from "next";
import { pageMeta } from "@/lib/dash-metadata";
import Client from "../client";

export function generateMetadata(): Promise<Metadata> {
  return pageMeta("marketplace", undefined, "products");
}

export default function Page() {
  return <Client tab="products" />;
}
