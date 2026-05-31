import type { Metadata } from "next";
import { pageMeta } from "@/lib/dash-metadata";
import VehiclesClient from "./client";

export function generateMetadata(): Promise<Metadata> {
  return pageMeta("vehicles");
}

export default function VehiclesPage() {
  return <VehiclesClient />;
}
