import type { Metadata } from "next";
import { pageMeta } from "@/lib/dash-metadata";
import VehiclesClient from "../client";

export function generateMetadata(): Promise<Metadata> {
  return pageMeta("vehicles", undefined, "documents");
}

export default function Page() {
  return <VehiclesClient tab="documents" />;
}
