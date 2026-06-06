import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { pageMeta } from "@/lib/dash-metadata";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  mapCategoryRow,
  mapProductRow,
  ProductForm,
  type LibraryCategoryRow,
  type LibraryProductRow,
} from "@/features/library";

export function generateMetadata(): Promise<Metadata> {
  return pageMeta("library", undefined, "form.edit_product");
}

export default async function EditLibraryProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createAdminClient();
  const [{ data: product }, { data: categories }] = await Promise.all([
    supabase.from("library_products").select("*").eq("id", id).maybeSingle(),
    supabase.from("library_categories").select("*").order("sort_order", { ascending: true }),
  ]);

  if (!product) notFound();

  return (
    <ProductForm
      product={mapProductRow(product as LibraryProductRow)}
      categories={((categories ?? []) as LibraryCategoryRow[]).map(mapCategoryRow)}
    />
  );
}
