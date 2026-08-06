import type { Metadata } from "next";
import { pageMeta } from "@/lib/dash-metadata";
import { getEmailThreads } from "./data";
import { EmailStoreSeeder } from "./store-seeder";
import Client from "./client";

export function generateMetadata(): Promise<Metadata> {
  return pageMeta("email");
}

export default async function Page() {
  const { threads, error } = await getEmailThreads();
  return (
    <>
      <EmailStoreSeeder threads={threads} />
      <Client error={error} />
    </>
  );
}
