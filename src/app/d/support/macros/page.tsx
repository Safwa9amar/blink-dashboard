import type { Metadata } from "next";
import { pageMeta } from "@/lib/dash-metadata";
import { loadMacros } from "../macros-data";
import MacrosClient from "./macros-client";

export function generateMetadata(): Promise<Metadata> {
  return pageMeta("support", undefined, "macros");
}

export default async function Page() {
  const { macros, migrationPending, error } = await loadMacros();
  return <MacrosClient macros={macros} migrationPending={migrationPending} error={error} />;
}
