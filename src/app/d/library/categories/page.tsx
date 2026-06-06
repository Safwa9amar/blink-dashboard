import type { Metadata } from "next";
import { pageMeta } from "@/lib/dash-metadata";
import { createAdminClient } from "@/lib/supabase/admin";
import { mapProductRow, mapCategoryRow, type LibraryProductRow, type LibraryCategoryRow } from "@/features/library";
import Client from "../client";

export function generateMetadata(): Promise<Metadata> {
  return pageMeta("library", undefined, "categories");
}

export default async function LibraryCategoriesPage() {
  const supabase = await createAdminClient();
  const [{ data: categories }, { data: products }] = await Promise.all([
    supabase.from("library_categories").select("*").order("sort_order", { ascending: true }),
    supabase.from("library_products").select("*"),
  ]);

  return (
    <Client
      tab="categories"
      categories={((categories ?? []) as LibraryCategoryRow[]).map(mapCategoryRow)}
      products={((products ?? []) as LibraryProductRow[]).map(mapProductRow)}
    />
  );
}
