"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Button, Modal, FormRow, fInput } from "@/components/ui";
import { CATEGORY_STATUS_KEYS, type Category, type NewCategoryInput, type TFn } from "../data";
import { useMarketplaceStore } from "../store";

const emptyCategory: NewCategoryInput = {
  name: "",
  slug: "",
  icon: "grid",
  color: "#EE335F",
  status: "active",
  sortOrder: 1,
};

export function CategoryForm({
  t,
  open,
  category,
  onClose,
}: {
  t: TFn;
  open: boolean;
  category: Category | null;
  onClose: () => void;
}) {
  const addCategory = useMarketplaceStore((s) => s.addCategory);
  const updateCategory = useMarketplaceStore((s) => s.updateCategory);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<NewCategoryInput>({ defaultValues: emptyCategory });

  useEffect(() => {
    reset(
      category
        ? {
            name: category.name,
            slug: category.slug,
            icon: category.icon,
            color: category.color,
            status: category.status,
            sortOrder: category.sortOrder,
          }
        : emptyCategory
    );
  }, [category, open, reset]);

  const onSubmit = handleSubmit((d) => {
    if (category) updateCategory(category.id, d);
    else addCategory(d);
    onClose();
  });

  return (
    <Modal open={open} onClose={onClose} title={category ? t("form.edit_category") : t("form.new_category")}>
      <form onSubmit={onSubmit}>
        <FormRow label={t("form.name")}>
          <input
            className={fInput}
            {...register("name", { required: t("required") })}
            placeholder={t("ph.category_name")}
          />
          {errors.name && <p className="text-danger text-xs mt-1.5">{errors.name.message}</p>}
        </FormRow>
        <FormRow label={t("form.slug")}>
          <input className={fInput} {...register("slug")} placeholder={t("ph.slug")} />
        </FormRow>
        <FormRow label={t("form.icon")}>
          <input className={fInput} {...register("icon")} placeholder={t("ph.icon")} />
        </FormRow>
        <FormRow label={t("form.color")}>
          <input className={fInput} {...register("color")} />
        </FormRow>
        <FormRow label={t("form.status")}>
          <select className={fInput} {...register("status")}>
            {CATEGORY_STATUS_KEYS.map((k) => (
              <option key={k} value={k}>
                {t("category_status." + k)}
              </option>
            ))}
          </select>
        </FormRow>
        <FormRow label={t("form.sort_order")}>
          <input type="number" className={fInput} {...register("sortOrder", { valueAsNumber: true })} />
        </FormRow>
        <div className="flex gap-2.5 justify-end mt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            {t("form.cancel")}
          </Button>
          <Button type="submit">{t("form.save")}</Button>
        </div>
      </form>
    </Modal>
  );
}
