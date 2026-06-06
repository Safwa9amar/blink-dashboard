"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useMemo, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Badge,
  Button,
  Card,
  PageHeader,
  FormRow,
  LangTabs,
  Segmented,
  DashIcon,
  fInput,
  dirFor,
  type Lang,
} from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import {
  LIBRARY_STATUS,
  LIBRARY_STATUS_KEYS,
  MAX_PRODUCT_PHOTOS,
  type LibraryCategory,
  type LibraryProduct,
  type LibraryStatus,
  type NewLibraryProductInput,
} from "../data";
import {
  createLibraryProduct,
  updateLibraryProduct,
  createLibraryUploadUrl,
} from "@/app/d/library/action";
import { useLibraryFormStore, productToInput } from "../form-store";
import { PhotoGallery } from "./photo-gallery";

const LIST = "/library";

// Uploads a file to the `library` Storage bucket via a one-time signed URL.
async function uploadPhoto(file: File): Promise<string> {
  const ext = file.name.split(".").pop() || "bin";
  const { path, token, error } = await createLibraryUploadUrl(ext);
  if (error || !path || !token) throw new Error(error ?? "Upload failed");
  const supabase = createClient();
  const { error: upErr } = await supabase.storage
    .from("library")
    .uploadToSignedUrl(path, token, file, { contentType: file.type });
  if (upErr) throw new Error(upErr.message);
  return supabase.storage.from("library").getPublicUrl(path).data.publicUrl;
}

export function ProductForm({
  product,
  categories,
}: {
  product: LibraryProduct | null;
  categories: LibraryCategory[];
}) {
  const t = useTranslations("library");
  const router = useRouter();
  const key = product ? product.id : "new";
  const seed = useMemo(() => {
    const base = productToInput(product);
    if (!product && !base.category) base.category = categories[0]?.name.en ?? "";
    return base;
  }, [product, categories]);

  const [lang, setLang] = useState<Lang>("en");
  const [saving, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<NewLibraryProductInput>({ defaultValues: seed });

  // Resume this target's persisted draft after the store hydrates, else seed it.
  useEffect(() => {
    const store = useLibraryFormStore;
    const apply = () => {
      const slot = store.getState().product;
      if (slot.key === key) reset(slot.data);
      else store.getState().seedProduct(key, seed);
    };
    if (store.persist.hasHydrated()) apply();
    const unsub = store.persist.onFinishHydration(apply);
    void store.persist.rehydrate();
    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  // Mirror every change into the sessionStorage-backed draft.
  useEffect(() => {
    const sub = watch((values) =>
      useLibraryFormStore.getState().setProductDraft(values as NewLibraryProductInput)
    );
    return () => sub.unsubscribe();
  }, [watch]);

  const onSubmit = handleSubmit((data) => {
    if (!data.name.en.trim()) {
      setLang("en");
      setError("name.en", { type: "required", message: t("required") });
      return;
    }
    clearErrors("name.en");
    setErr(null);
    const payload: NewLibraryProductInput = {
      ...data,
      photos: (data.photos ?? []).map((p) => p.trim()).filter(Boolean),
    };
    startTransition(async () => {
      const res = product
        ? await updateLibraryProduct(product.id, payload)
        : await createLibraryProduct(payload);
      if (res.error) {
        setErr(res.error);
        return;
      }
      useLibraryFormStore.getState().clearProduct();
      router.push(LIST);
      router.refresh();
    });
  });

  // Controlled / observed values.
  const name = watch("name");
  const description = watch("description");
  const photos = watch("photos") ?? [];
  const status = watch("status");
  const brand = watch("brand");
  const unit = watch("unit");
  const categoryKey = watch("category");

  const cover = photos[0];
  const previewName = name?.[lang]?.trim() || name?.en?.trim() || t("pv.name");
  const previewCat = categories.find((c) => c.name.en === categoryKey);
  const previewCatLabel = previewCat ? previewCat.name[lang] || previewCat.name.en : "";
  const statusOptions = LIBRARY_STATUS_KEYS.map((k) => [k, t("status." + k)] as [LibraryStatus, string]);

  return (
    <form onSubmit={onSubmit}>
      <Link
        href={LIST}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-subtext hover:text-text mb-4 transition-colors"
      >
        <DashIcon name="undo" className="w-4 h-4" />
        {t("back")}
      </Link>
      <PageHeader
        title={product ? t("form.edit_product") : t("form.new_product")}
        description={t("form.product_subtitle", { max: MAX_PRODUCT_PHOTOS })}
        actions={
          <>
            <Button type="button" variant="secondary" onClick={() => router.push(LIST)} disabled={saving}>
              {t("form.cancel")}
            </Button>
            <Button type="submit" loading={saving}>
              {t("form.save")}
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-5 items-start">
        {/* ── Main column ── */}
        <div className="space-y-5">
          <Card title={t("sec.media")} description={t("sec.media_desc")}>
            <PhotoGallery
              t={t}
              photos={photos}
              max={MAX_PRODUCT_PHOTOS}
              onChange={(next) => setValue("photos", next, { shouldDirty: true })}
              onUpload={uploadPhoto}
            />
          </Card>

          <Card title={t("sec.content")} description={t("sec.content_desc")}>
            <FormRow label={t("form.lang")} hint={t("form.lang_hint")} className="!mb-3">
              <LangTabs active={lang} onChange={setLang} filled={{ en: !!name?.en, fr: !!name?.fr, ar: !!name?.ar }} />
            </FormRow>
            <FormRow label={t("form.name")}>
              <input
                className={fInput}
                dir={dirFor(lang)}
                value={name?.[lang] ?? ""}
                onChange={(e) => setValue(`name.${lang}`, e.target.value, { shouldDirty: true })}
                placeholder={t("ph.name")}
              />
              {errors.name?.en && <p className="text-danger text-xs mt-1.5">{errors.name.en.message}</p>}
            </FormRow>
            <FormRow label={t("form.description")} className="!mb-0">
              <textarea
                className={`${fInput} min-h-[110px] resize-y`}
                dir={dirFor(lang)}
                value={description?.[lang] ?? ""}
                onChange={(e) => setValue(`description.${lang}`, e.target.value, { shouldDirty: true })}
                placeholder={t("ph.description")}
              />
            </FormRow>
          </Card>

          <Card title={t("sec.classify")}>
            <FormRow label={t("form.brand")}>
              <input className={fInput} {...register("brand")} placeholder={t("ph.brand")} />
            </FormRow>
            <div className="grid grid-cols-2 gap-4">
              <FormRow label={t("form.category")} className="!mb-0">
                <select className={fInput} {...register("category")}>
                  {categories.length === 0 && <option value="">—</option>}
                  {categories.map((c) => (
                    <option key={c.id} value={c.name.en}>
                      {c.name[lang] || c.name.en}
                    </option>
                  ))}
                </select>
              </FormRow>
              <FormRow label={t("form.unit")} className="!mb-0">
                <input className={fInput} {...register("unit")} placeholder={t("ph.unit")} />
              </FormRow>
            </div>
            <FormRow label={t("form.barcode")} className="!mb-0 mt-4">
              <input className={`${fInput} font-mono`} {...register("barcode")} placeholder={t("ph.barcode")} />
            </FormRow>
          </Card>
        </div>

        {/* ── Side column ── */}
        <div className="space-y-5 lg:sticky lg:top-4">
          <Card title={t("sec.publish")}>
            <Segmented
              options={statusOptions}
              value={status}
              onChange={(v) => setValue("status", v, { shouldDirty: true })}
            />
            {product && (
              <div className="flex items-center gap-2 mt-4 text-[13px] text-subtext">
                <DashIcon name="store" className="w-4 h-4 shrink-0" />
                {t("form.stocked", { count: product.storeCount })}
              </div>
            )}
            {err && <p className="text-danger text-sm mt-3">{err}</p>}
          </Card>

          <Card title={t("sec.preview")}>
            <div className="rounded-2xl border border-border overflow-hidden bg-background">
              <div className="relative aspect-[4/3] bg-muted">
                {cover ? (
                  <img src={cover} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-subtext">
                    <DashIcon name="image" className="w-8 h-8" />
                  </div>
                )}
                <span className="absolute top-2.5 end-2.5">
                  <Badge variant={LIBRARY_STATUS[status]}>{t("status." + status)}</Badge>
                </span>
              </div>
              <div className="p-3.5" dir={dirFor(lang)}>
                <div className="font-bold text-text leading-tight truncate">{previewName}</div>
                <div className="text-xs text-subtext mt-1 truncate">
                  {[brand, unit].filter(Boolean).join(" · ") || t("form.brand")}
                </div>
                <div className="mt-2.5 flex items-center gap-2">
                  <Badge variant="primary">{previewCatLabel || t("pv.uncategorized")}</Badge>
                  {photos.length > 1 && (
                    <span className="text-[11px] text-subtext inline-flex items-center gap-1">
                      <DashIcon name="image" className="w-3 h-3" />
                      {photos.length}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </form>
  );
}
