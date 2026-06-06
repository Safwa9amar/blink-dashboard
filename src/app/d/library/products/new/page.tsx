import type { Metadata } from "next";
import { pageMeta } from "@/lib/dash-metadata";
import { createAdminClient } from "@/lib/supabase/admin";
import { mapCategoryRow, ProductForm, type LibraryCategoryRow } from "@/features/library";

export function generateMetadata(): Promise<Metadata> {
  return pageMeta("library", undefined, "form.new_product");
}

export default async function NewLibraryProductPage() {
  const supabase = await createAdminClient();
  const { data: categories } = await supabase
    .from("library_categories")
    .select("*")
    .order("sort_order", { ascending: true });

  return (
    <ProductForm
      product={null}
      categories={((categories ?? []) as LibraryCategoryRow[]).map(mapCategoryRow)}
    />
  );
}
