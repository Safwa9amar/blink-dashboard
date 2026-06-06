import type { Metadata } from "next";
import { pageMeta } from "@/lib/dash-metadata";
import { createAdminClient } from "@/lib/supabase/admin";
import { mapProductRow, mapCategoryRow, type LibraryProductRow, type LibraryCategoryRow } from "@/features/library";
import Client from "./client";

export function generateMetadata(): Promise<Metadata> {
  return pageMeta("library");
}

export default async function LibraryPage() {
  const supabase = await createAdminClient();
  const [{ data: products }, { data: categories }] = await Promise.all([
    supabase.from("library_products").select("*").order("created_at", { ascending: false }),
    supabase.from("library_categories").select("*").order("sort_order", { ascending: true }),
  ]);

  return (
    <Client
      tab="products"
      products={((products ?? []) as LibraryProductRow[]).map(mapProductRow)}
      categories={((categories ?? []) as LibraryCategoryRow[]).map(mapCategoryRow)}
    />
  );
}
