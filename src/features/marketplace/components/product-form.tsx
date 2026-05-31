"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Button, Modal, FormRow, fInput } from "@/components/ui";
import { PRODUCT_STATUS_KEYS, type NewProductInput, type Product, type TFn } from "../data";
import { useMarketplaceStore } from "../store";

export function ProductForm({
  t,
  open,
  product,
  onClose,
}: {
  t: TFn;
  open: boolean;
  product: Product | null;
  onClose: () => void;
}) {
  const stores = useMarketplaceStore((s) => s.stores);
  const addProduct = useMarketplaceStore((s) => s.addProduct);
  const updateProduct = useMarketplaceStore((s) => s.updateProduct);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<NewProductInput>({
    defaultValues: {
      storeId: stores[0]?.id ?? "",
      title: "",
      price: 0,
      status: "in_stock",
      menuCategory: "",
      rating: 0,
      unit: "",
      image: "",
      description: "",
    },
  });

  useEffect(() => {
    if (!open) return;
    if (product) {
      reset({
        storeId: product.storeId,
        title: product.title,
        price: product.price,
        status: product.status,
        menuCategory: product.menuCategory,
        rating: product.rating,
        unit: product.unit ?? "",
        image: product.image,
        description: product.description ?? "",
      });
    } else {
      reset({
        storeId: stores[0]?.id ?? "",
        title: "",
        price: 0,
        status: "in_stock",
        menuCategory: "",
        rating: 0,
        unit: "",
        image: "",
        description: "",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product?.id, open]);

  const onSubmit = handleSubmit((data) => {
    if (product) updateProduct(product.id, data);
    else addProduct(data);
    onClose();
  });

  return (
    <Modal open={open} onClose={onClose} title={product ? t("form.edit_product") : t("form.new_product")}>
      <form onSubmit={onSubmit}>
        <FormRow label={t("form.title")}>
          <input
            className={fInput}
            {...register("title", { required: t("required") })}
            placeholder={t("ph.product_title")}
          />
          {errors.title && <p className="text-danger text-xs mt-1.5">{errors.title.message}</p>}
        </FormRow>
        <FormRow label={t("form.store")}>
          <select className={fInput} {...register("storeId")}>
            {stores.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </FormRow>
        <FormRow label={t("form.price")}>
          <input
            type="number"
            className={fInput}
            {...register("price", { required: t("required"), valueAsNumber: true })}
          />
          {errors.price && <p className="text-danger text-xs mt-1.5">{errors.price.message}</p>}
        </FormRow>
        <FormRow label={t("form.status")}>
          <select className={fInput} {...register("status")}>
            {PRODUCT_STATUS_KEYS.map((k) => (
              <option key={k} value={k}>
                {t("product_status." + k)}
              </option>
            ))}
          </select>
        </FormRow>
        <FormRow label={t("form.section")}>
          <input className={fInput} {...register("menuCategory")} placeholder={t("ph.section")} />
        </FormRow>
        <FormRow label={t("form.rating")}>
          <input type="number" step="0.1" className={fInput} {...register("rating", { valueAsNumber: true })} />
        </FormRow>
        <FormRow label={t("form.unit")}>
          <input className={fInput} {...register("unit")} placeholder={t("ph.unit")} />
        </FormRow>
        <FormRow label={t("form.image")}>
          <input className={fInput} {...register("image")} placeholder={t("ph.image")} />
        </FormRow>
        <FormRow label={t("form.description")}>
          <textarea
            className={`${fInput} min-h-[90px] resize-y`}
            {...register("description")}
            placeholder={t("ph.description")}
          />
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
