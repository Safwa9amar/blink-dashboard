"use client";

import { useTranslations } from "next-intl";
import { PageHeader, SubNav } from "@/components/ui";
import {
  ProductsTable,
  CategoriesList,
  LibraryStats,
  deriveLibraryStats,
  type LibraryProduct,
  type LibraryCategory,
} from "@/features/library";

// Renders the shared catalog chrome (header + stats + sub-nav) above the active
// list. The add/edit form pages live outside this view, so they stay focused.
export default function LibraryClient({
  tab,
  products,
  categories,
}: {
  tab: "products" | "categories";
  products: LibraryProduct[];
  categories: LibraryCategory[];
}) {
  const t = useTranslations("library");
  const stats = deriveLibraryStats(products, categories);

  const items = [
    { href: "/library", label: t("products"), icon: "package", count: String(stats.totalProducts) },
    { href: "/library/categories", label: t("categories"), icon: "grid", count: String(stats.categories) },
  ];

  return (
    <div>
      <PageHeader title={t("title")} description={t("description")} />
      <div className="mb-6">
        <LibraryStats t={t} stats={stats} />
      </div>
      <SubNav items={items} />
      {tab === "categories" ? (
        <CategoriesList t={t} categories={categories} products={products} />
      ) : (
        <ProductsTable t={t} products={products} categories={categories} />
      )}
    </div>
  );
}
