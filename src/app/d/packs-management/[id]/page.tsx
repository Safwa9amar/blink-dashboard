import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { pageMeta } from "@/lib/dash-metadata";
import { getPack, getStoreProducts } from "../data";
import Client from "./client";

export function generateMetadata(): Promise<Metadata> {
  return pageMeta("packs", undefined, "editor.edit_title");
}

// Edit one pack: the pack as the list resolves it (toPack) + its store's products
// for the picker. A malformed or unknown id is a 404; both loaders gate on the section.
export default async function EditPackPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { pack, error } = await getPack(id);
  if (!pack) {
    if (!error) notFound();
    return <Client pack={null} products={[]} error={error} />;
  }
  const { products, error: productsError } = await getStoreProducts(pack.storeId);
  return <Client pack={pack} products={products} productsError={productsError} />;
}
