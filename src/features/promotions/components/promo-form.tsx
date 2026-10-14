"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm, useWatch, type Resolver } from "react-hook-form";
import { useTranslations } from "next-intl";
import { Button, Card, FormRow, Segmented, Toggle, fInput } from "@/components/ui";
import { savePromotion } from "@/app/d/promotions/action";
import {
  ACTIONS,
  CATEGORIES,
  DEFAULT_FORM,
  DISCOUNT_TYPES,
  INFO_ICONS,
  validatePromotionForm,
  type PromotionFormValues,
} from "../form";
import type { StoreOption } from "../types";
import { CoverField } from "./cover-field";
import { PromoPreview } from "./promo-preview";

const resolver: Resolver<PromotionFormValues> = async (values) => {
  const errs = validatePromotionForm(values);
  const keys = Object.keys(errs) as (keyof PromotionFormValues)[];
  if (!keys.length) return { values, errors: {} };
  return {
    values: {},
    errors: Object.fromEntries(keys.map((k) => [k, { type: "validate", message: errs[k] }])) as never,
  };
};

export function PromoForm({
  id,
  initial,
  stores,
}: {
  id?: string;
  initial?: PromotionFormValues;
  stores: StoreOption[];
}) {
  const t = useTranslations("promotions");
  const router = useRouter();
  const [pending, start] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    setError,
    setValue,
    formState: { errors },
  } = useForm<PromotionFormValues>({ defaultValues: initial ?? DEFAULT_FORM, resolver });

  const v = useWatch({ control }) as PromotionFormValues;
  const storeName = useMemo(() => stores.find((s) => s.id === v.store_id)?.name, [stores, v.store_id]);
  const isDeal = v.kind === "deal";

  const err = (k: keyof PromotionFormValues) => {
    const m = errors[k]?.message;
    return m ? <p className="text-danger text-xs mt-1">{t(`form.errors.${m}` as never)}</p> : null;
  };

  const onSubmit = handleSubmit((values) => {
    setFormError(null);
    setSaved(false);
    const payload: PromotionFormValues = {
      ...values,
      starts_at: values.starts_at ? new Date(values.starts_at).toISOString() : "",
      ends_at: values.ends_at ? new Date(values.ends_at).toISOString() : "",
    };
    start(async () => {
      const res = await savePromotion(id ?? null, payload);
      if ("fieldErrors" in res) {
        for (const [k, m] of Object.entries(res.fieldErrors)) setError(k as keyof PromotionFormValues, { message: m });
        return;
      }
      if (res.error !== null) {
        setFormError(t.has(`errors.${res.error}` as never) ? t(`errors.${res.error}` as never) : res.error);
        return;
      }
      if (id) {
        setSaved(true);
        router.refresh();
      } else {
        router.push(`/promotions/${res.id}`);
      }
    });
  });

  const num = (k: keyof PromotionFormValues, label: string, hint?: string, step = "any") => (
    <FormRow label={label} hint={hint} className="flex-1">
      <input type="number" step={step} min="0" className={fInput} {...register(k as never)} dir="ltr" />
      {err(k)}
    </FormRow>
  );

  return (
    <form onSubmit={onSubmit} className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-5 items-start">
      <div className="space-y-5 min-w-0">
        <Card title={t("form.basics")} description={t("form.basics_desc")}>
          <div className="flex gap-3.5 flex-wrap">
            <FormRow label={t("form.kind")} className="flex-1">
              <Controller
                control={control}
                name="kind"
                render={({ field }) => (
                  <Segmented
                    options={[
                      ["promo", t("kinds.promo")],
                      ["deal", t("kinds.deal")],
                    ]}
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
            </FormRow>
            <FormRow label={t("form.category")} className="flex-1">
              <select className={fInput} {...register("category")}>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {t(`categories.${c}` as never)}
                  </option>
                ))}
              </select>
            </FormRow>
          </div>
          <FormRow label={t("form.title")}>
            <input className={fInput} placeholder={t("form.title_ph")} {...register("title")} />
            {err("title")}
          </FormRow>
          <FormRow label={t("form.subtitle")}>
            <input className={fInput} placeholder={t("form.subtitle_ph")} {...register("subtitle")} />
          </FormRow>
          <FormRow label={t("form.cover")} className="!mb-0">
            <Controller control={control} name="image_url" render={({ field }) => <CoverField value={field.value} onChange={field.onChange} />} />
          </FormRow>
        </Card>

        <Card title={t("form.redeem")} description={t("form.redeem_desc")}>
          <FormRow label={t("form.action_type")} hint={t("form.action_hint")}>
            <Controller
              control={control}
              name="action"
              render={({ field }) => (
                <Segmented options={ACTIONS.map((a) => [a, t(`action_types.${a}` as never)] as [typeof a, string])} value={field.value} onChange={field.onChange} />
              )}
            />
          </FormRow>
          <FormRow label={t("form.code")} hint={t("form.code_hint")}>
            <input className={`${fInput} max-w-56 uppercase`} placeholder={t("form.code_ph")} dir="ltr" {...register("code")} />
            {err("code")}
          </FormRow>
          <FormRow label={t("form.discount_type")}>
            <Controller
              control={control}
              name="discount_type"
              render={({ field }) => (
                <Segmented options={DISCOUNT_TYPES.map((d) => [d, t(`discount_types.${d}` as never)] as [typeof d, string])} value={field.value} onChange={field.onChange} />
              )}
            />
          </FormRow>
          <div className="flex gap-3.5 flex-wrap">
            {v.discount_type !== "free_delivery" &&
              num("discount_value", v.discount_type === "percent" ? t("form.percent_off") : t("form.amount"))}
            {num("min_order", t("form.min_order"))}
            {v.discount_type === "percent" && num("max_discount", t("form.max_discount"), t("form.optional"))}
          </div>
          {num("valid_days", t("form.valid_days"), t("form.valid_days_hint"), "1")}
        </Card>

        {isDeal && (
          <Card title={t("form.deal")} description={t("form.deal_desc")}>
            <div className="flex gap-3.5 flex-wrap">
              <FormRow label={t("form.badge_text")} className="flex-1">
                <input className={fInput} {...register("badge_text")} />
              </FormRow>
              <FormRow label={t("form.badge_color")} className="flex-1">
                <div className="flex gap-2 items-center">
                  <input type="color" className="h-9 w-12 rounded border border-border bg-background" value={/^#[0-9a-fA-F]{6}$/.test(v.badge_color) ? v.badge_color : "#EE335F"} onChange={(e) => setValue("badge_color", e.target.value, { shouldDirty: true })} />
                  <input className={fInput} dir="ltr" placeholder="#EE335F" {...register("badge_color")} />
                </div>
                {err("badge_color")}
              </FormRow>
            </div>
            <div className="flex gap-3.5 flex-wrap">
              <FormRow label={t("form.value_text")} className="flex-1">
                <input className={fInput} placeholder={t("form.value_text_ph")} {...register("value_text")} />
              </FormRow>
              <FormRow label={t("form.info_icon")} className="flex-1">
                <select className={fInput} {...register("info_icon")}>
                  <option value="">—</option>
                  {INFO_ICONS.map((i) => (
                    <option key={i} value={i}>
                      {t(`info_icons.${i}` as never)}
                    </option>
                  ))}
                </select>
              </FormRow>
            </div>
            <FormRow label={t("form.info_text")}>
              <input className={fInput} {...register("info_text")} />
            </FormRow>
            <FormRow label={t("form.store")} hint={t("form.store_hint")} className="!mb-0">
              <select className={fInput} {...register("store_id")}>
                <option value="">{t("form.no_store")}</option>
                {stores.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </FormRow>
          </Card>
        )}

        <Card title={t("form.limits")} description={t("form.limits_desc")}>
          <div className="flex gap-3.5 flex-wrap">
            <FormRow label={t("form.starts_at")} className="flex-1">
              <input type="datetime-local" className={fInput} {...register("starts_at")} dir="ltr" />
              {err("starts_at")}
            </FormRow>
            <FormRow label={t("form.ends_at")} className="flex-1">
              <input type="datetime-local" className={fInput} {...register("ends_at")} dir="ltr" />
              {err("ends_at")}
            </FormRow>
          </div>
          <div className="flex gap-3.5 flex-wrap">
            {num("max_coupons", t("form.max_coupons"), t("form.unlimited_hint"), "1")}
            {num("discount_budget", t("form.discount_budget"), t("form.unlimited_hint"))}
            {num("sort_order", t("form.sort_order"), undefined, "1")}
          </div>
        </Card>
      </div>

      <div className="space-y-5 xl:sticky xl:top-4">
        <Card title={t("form.publish")}>
          <div className="flex items-center justify-between p-3.5 bg-background border border-border rounded-xl">
            <div>
              <b className="block text-[13.5px] font-bold text-text">{t("form.active")}</b>
              <span className="block text-[11.5px] text-subtext mt-0.5">{t("form.active_desc")}</span>
            </div>
            <Controller control={control} name="is_active" render={({ field }) => <Toggle on={field.value} onClick={() => field.onChange(!field.value)} />} />
          </div>
          {formError && <p className="text-danger text-sm mt-3">{formError}</p>}
          {saved && !formError && <p className="text-success text-sm mt-3">{t("form.saved")}</p>}
          <div className="flex gap-2.5 mt-4">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => router.push("/promotions")}>
              {t("form.cancel")}
            </Button>
            <Button type="submit" className="flex-1" loading={pending}>
              {id ? t("form.save") : t("form.create_btn")}
            </Button>
          </div>
        </Card>
        <Card title={t("form.preview")}>
          <PromoPreview v={v} storeName={storeName} />
        </Card>
      </div>
    </form>
  );
}
