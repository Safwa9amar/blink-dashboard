"use client";

import { useState, useTransition } from "react";
import { useLocale } from "next-intl";
import { Card, Button } from "@/components/ui";
import { productCountFor, type LibraryCategory, type LibraryProduct, type TFn } from "../data";
import { deleteLibraryCategory } from "@/app/d/library/action";
import { CategoryCard } from "./category-card";
import { CategoryForm } from "./category-form";

export function CategoriesList({
  t,
  categories,
  products,
}: {
  t: TFn;
  categories: LibraryCategory[];
  products: LibraryProduct[];
}) {
  const locale = useLocale();
  const [, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<LibraryCategory | null>(null);

  const newCategory = () => {
    setEditing(null);
    setOpen(true);
  };
  const editCategory = (cat: LibraryCategory) => {
    setEditing(cat);
    setOpen(true);
  };

  return (
    <>
      <div className="flex justify-end mb-[18px]">
        <Button icon="plus" className="ms-auto" onClick={newCategory}>
          {t("new_category")}
        </Button>
      </div>

      {categories.length === 0 ? (
        <Card>
          <div className="py-8 text-center text-subtext text-sm">{t("empty.categories")}</div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat) => (
            <CategoryCard
              key={cat.id}
              t={t}
              locale={locale}
              category={cat}
              productCount={productCountFor(products, cat.name.en)}
              onEdit={() => editCategory(cat)}
              onDelete={() => {
                if (confirm(t("confirm.delete_category")))
                  startTransition(() => void deleteLibraryCategory(cat.id));
              }}
            />
          ))}
        </div>
      )}

      <CategoryForm t={t} open={open} category={editing} onClose={() => setOpen(false)} />
    </>
  );
}
