"use client";

import { useState } from "react";
import { Card, Button } from "@/components/ui";
import { type Category, type TFn } from "../data";
import { useMarketplaceStore } from "../store";
import { CategoryCard } from "./category-card";
import { CategoryForm } from "./category-form";

export function CategoriesList({ t }: { t: TFn }) {
  const categories = useMarketplaceStore((s) => s.categories);
  const deleteCategory = useMarketplaceStore((s) => s.deleteCategory);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);

  const newCategory = () => {
    setEditing(null);
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
              category={cat}
              onEdit={() => {
                setEditing(cat);
                setOpen(true);
              }}
              onDelete={() => {
                if (confirm(t("confirm.delete_category"))) deleteCategory(cat.id);
              }}
            />
          ))}
        </div>
      )}

      <CategoryForm t={t} open={open} category={editing} onClose={() => setOpen(false)} />
    </>
  );
}
