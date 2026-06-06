import { Badge, DashIcon } from "@/components/ui";
import { CATEGORY_STATUS, pickLang, type LibraryCategory, type TFn } from "../data";

export function CategoryCard({
  t,
  locale,
  category,
  productCount,
  onEdit,
  onDelete,
}: {
  t: TFn;
  locale: string;
  category: LibraryCategory;
  productCount: number;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="bg-card border border-border rounded-2xl p-4">
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 bg-soft-pink text-primary">
          <DashIcon name={category.icon} className="w-5 h-5" />
        </div>
        <div className="flex items-center gap-1 ms-auto">
          <button
            type="button"
            onClick={onEdit}
            aria-label={t("edit")}
            className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-subtext hover:text-text hover:bg-soft-pink transition-colors cursor-pointer"
          >
            <DashIcon name="pencil" className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            aria-label={t("delete")}
            className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-subtext hover:text-danger hover:bg-danger-light transition-colors cursor-pointer"
          >
            <DashIcon name="trash" className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="mt-3 font-bold text-text">{pickLang(category.name, locale)}</div>
      <div className="text-subtext text-xs mt-0.5">
        {category.slug} · {productCount} {t("col.products")}
      </div>
      <div className="mt-3">
        <Badge variant={CATEGORY_STATUS[category.status]}>{t("category_status." + category.status)}</Badge>
      </div>
    </div>
  );
}
