"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import {
  Modal,
  Button,
  FormRow,
  LangTabs,
  Segmented,
  fInput,
  dirFor,
  type Lang,
} from "@/components/ui";
import {
  CATEGORY_STATUS_KEYS,
  type CategoryStatus,
  type LibraryCategory,
  type NewLibraryCategoryInput,
  type TFn,
} from "../data";
import { createLibraryCategory, updateLibraryCategory } from "@/app/d/library/action";
import { useLibraryFormStore, categoryToInput } from "../form-store";
import { IconPicker } from "./icon-picker";

// Categories are a quick add/edit, so they stay in a modal (products get a full
// page). Still RHF + the sessionStorage draft store, so a half-typed category
// survives an accidental close/reopen within the session.
export function CategoryForm({
  t,
  open,
  category,
  onClose,
}: {
  t: TFn;
  open: boolean;
  category: LibraryCategory | null;
  onClose: () => void;
}) {
  const [lang, setLang] = useState<Lang>("en");
  const [saving, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const key = category ? category.id : "new";
  const seed = useMemo(() => categoryToInput(category), [category]);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<NewLibraryCategoryInput>({ defaultValues: seed });

  // On open (or target change), resume this target's persisted draft, else seed it.
  useEffect(() => {
    if (!open) return;
    const store = useLibraryFormStore;
    const apply = () => {
      const slot = store.getState().category;
      if (slot.key === key) reset(slot.data);
      else {
        store.getState().seedCategory(key, seed);
        reset(seed);
      }
    };
    if (store.persist.hasHydrated()) apply();
    const unsub = store.persist.onFinishHydration(apply);
    void store.persist.rehydrate();
    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, open]);

  // Mirror every change into the sessionStorage-backed draft.
  useEffect(() => {
    const sub = watch((values) =>
      useLibraryFormStore.getState().setCategoryDraft(values as NewLibraryCategoryInput)
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
    startTransition(async () => {
      const res = category
        ? await updateLibraryCategory(category.id, data)
        : await createLibraryCategory(data);
      if (res.error) {
        setErr(res.error);
        return;
      }
      useLibraryFormStore.getState().clearCategory();
      onClose();
    });
  });

  const name = watch("name");
  const icon = watch("icon");
  const status = watch("status");
  const statusOptions = CATEGORY_STATUS_KEYS.map(
    (k) => [k, t("category_status." + k)] as [CategoryStatus, string]
  );

  return (
    <Modal open={open} onClose={onClose} title={category ? t("form.edit_category") : t("form.new_category")}>
      <form onSubmit={onSubmit}>
        <FormRow label={t("form.lang")} hint={t("form.lang_hint")} className="!mb-3">
          <LangTabs active={lang} onChange={setLang} filled={{ en: !!name?.en, fr: !!name?.fr, ar: !!name?.ar }} />
        </FormRow>
        <FormRow label={t("form.name")}>
          <input
            className={fInput}
            dir={dirFor(lang)}
            value={name?.[lang] ?? ""}
            onChange={(e) => setValue(`name.${lang}`, e.target.value, { shouldDirty: true })}
            placeholder={t("ph.category_name")}
          />
          {errors.name?.en && <p className="text-danger text-xs mt-1.5">{errors.name.en.message}</p>}
        </FormRow>
        <FormRow label={t("form.icon")}>
          <IconPicker
            value={icon}
            onChange={(name) => setValue("icon", name, { shouldDirty: true })}
            searchPlaceholder={t("ph.icon_search")}
          />
        </FormRow>
        <div className="grid grid-cols-2 gap-4">
          <FormRow label={t("form.slug")} className="!mb-0">
            <input className={fInput} {...register("slug")} placeholder={t("ph.slug")} />
          </FormRow>
          <FormRow label={t("form.sort_order")} className="!mb-0">
            <input type="number" className={fInput} {...register("sortOrder", { valueAsNumber: true })} />
          </FormRow>
        </div>
        <FormRow label={t("form.status")} className="!mb-0 mt-4">
          <Segmented
            options={statusOptions}
            value={status}
            onChange={(v) => setValue("status", v, { shouldDirty: true })}
          />
        </FormRow>
        {err && <p className="text-danger text-sm mt-3">{err}</p>}
        <div className="flex gap-2.5 justify-end mt-5">
          <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>
            {t("form.cancel")}
          </Button>
          <Button type="submit" loading={saving}>
            {t("form.save")}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
