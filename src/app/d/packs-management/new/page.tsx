import type { Metadata } from "next";
import { pageMeta } from "@/lib/dash-metadata";
import { getPackStores } from "../data";
import Client from "./client";

export function generateMetadata(): Promise<Metadata> {
  return pageMeta("packs", undefined, "editor.new_title");
}

// Create a pack for any store. The loader gates on the section; the store's
// products load once one is picked (loadStoreProducts in ../action.ts).
export default async function NewPackPage() {
  const { stores, error } = await getPackStores();
  return <Client stores={stores} error={error} />;
}
