"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Button, Modal, Toggle, fInput } from "@/components/ui";
import {
  WILAYAS,
  STORE_STATUS_KEYS,
  type NewStoreInput,
  type Store,
  type TFn,
} from "../data";
import { useMarketplaceStore } from "../store";

export function StoreForm({
  t,
  open,
  store,
  onClose,
}: {
  t: TFn;
  open: boolean;
  store: Store | null;
  onClose: () => void;
}) {
  const categories = useMarketplaceStore((s) => s.categories);
  const addStore = useMarketplaceStore((s) => s.addStore);
  const updateStore = useMarketplaceStore((s) => s.updateStore);

  const firstCategoryId = categories[0]?.id ?? "";

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<NewStoreInput>({
    defaultValues: {
      name: "",
      categoryId: firstCategoryId,
      status: "open",
      wilaya: "Alger",
      location: "",
      rating: 0,
      reviewCount: 0,
      deliveryFee: 0,
      minOrder: 0,
      deliveryTime: "",
      openingHours: "",
      phone: "",
      image: "",
      featured: false,
    },
  });

  useEffect(() => {
    if (store) {
      reset({
        name: store.name,
        categoryId: store.categoryId,
        status: store.status,
        wilaya: store.wilaya,
        location: store.location,
        rating: store.rating,
        reviewCount: store.reviewCount,
        deliveryFee: store.deliveryFee,
        minOrder: store.minOrder,
        deliveryTime: store.deliveryTime,
        openingHours: store.openingHours,
        phone: store.phone,
        image: store.image,
        featured: store.featured,
      });
    } else {
      reset({
        name: "",
        categoryId: firstCategoryId,
        status: "open",
        wilaya: "Alger",
        location: "",
        rating: 0,
        reviewCount: 0,
        deliveryFee: 0,
        minOrder: 0,
        deliveryTime: "",
        openingHours: "",
        phone: "",
        image: "",
        featured: false,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store?.id, open]);

  const onSubmit = handleSubmit((data) => {
    if (store) updateStore(store.id, data);
    else addStore(data);
    onClose();
  });

  const featured = watch("featured");
  const labelClass = "block text-[12.5px] font-bold text-text mb-1.5";

  return (
    <Modal open={open} onClose={onClose} title={store ? t("form.edit_store") : t("form.new_store")}>
      <form onSubmit={onSubmit}>
        <div className="mb-5">
          <label className={labelClass}>{t("form.name")}</label>
          <input className={fInput} placeholder={t("ph.store_name")} {...register("name", { required: t("required") })} />
          {errors.name && <p className="text-danger text-xs mt-1.5">{errors.name.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="mb-5">
            <label className={labelClass}>{t("form.category")}</label>
            <select className={fInput} {...register("categoryId")}>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-5">
            <label className={labelClass}>{t("form.status")}</label>
            <select className={fInput} {...register("status")}>
              {STORE_STATUS_KEYS.map((k) => (
                <option key={k} value={k}>
                  {t("store_status." + k)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="mb-5">
            <label className={labelClass}>{t("form.wilaya")}</label>
            <select className={fInput} {...register("wilaya")}>
              {WILAYAS.map((w) => (
                <option key={w} value={w}>
                  {w}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-5">
            <label className={labelClass}>{t("form.location")}</label>
            <input className={fInput} placeholder={t("ph.location")} {...register("location")} />
          </div>
        </div>

        <div className="mb-5">
          <label className={labelClass}>{t("form.phone")}</label>
          <input className={fInput} placeholder={t("ph.phone")} {...register("phone")} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="mb-5">
            <label className={labelClass}>{t("form.rating")}</label>
            <input type="number" step="0.1" className={fInput} {...register("rating", { valueAsNumber: true })} />
          </div>

          <div className="mb-5">
            <label className={labelClass}>{t("form.review_count")}</label>
            <input type="number" className={fInput} {...register("reviewCount", { valueAsNumber: true })} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="mb-5">
            <label className={labelClass}>{t("form.delivery_fee")}</label>
            <input type="number" className={fInput} {...register("deliveryFee", { valueAsNumber: true })} />
          </div>

          <div className="mb-5">
            <label className={labelClass}>{t("form.min_order")}</label>
            <input type="number" className={fInput} {...register("minOrder", { valueAsNumber: true })} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="mb-5">
            <label className={labelClass}>{t("form.delivery_time")}</label>
            <input className={fInput} placeholder={t("ph.delivery_time")} {...register("deliveryTime")} />
          </div>

          <div className="mb-5">
            <label className={labelClass}>{t("form.opening_hours")}</label>
            <input className={fInput} placeholder={t("ph.opening_hours")} {...register("openingHours")} />
          </div>
        </div>

        <div className="mb-5">
          <label className={labelClass}>{t("form.image")}</label>
          <input className={fInput} placeholder={t("ph.image")} {...register("image")} />
        </div>

        <div className="mb-5 flex items-center gap-3">
          <Toggle on={featured} onClick={() => setValue("featured", !featured)} />
          <div>
            <div className="text-[12.5px] font-bold text-text">{t("form.featured")}</div>
            <div className="text-[11.5px] text-subtext">{t("form.featured_hint")}</div>
          </div>
        </div>

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
