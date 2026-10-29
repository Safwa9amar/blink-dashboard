"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { useLocale, useTranslations } from "next-intl";
import { Button, Card, FormRow, Modal, fInput } from "@/components/ui";
import { archiveTier, createTier, updateTier } from "@/app/d/pricing/action";
import type { Tier } from "../types";
import { isHexColor, isTierCode, liveTiers, nextTierOrder, tierName } from "../zones";

interface TierForm {
  code: string;
  en: string;
  fr: string;
  ar: string;
  color: string;
  sort_order: string;
  note: string;
}

/** Tier list with add / rename (en, fr, ar) / recolor / reorder / archive. Edit controls need `canEdit`. */
export function TierManager({ tiers, canEdit }: { tiers: Tier[]; canEdit: boolean }) {
  const t = useTranslations("pricing");
  const locale = useLocale();
  const router = useRouter();
  const [editing, setEditing] = useState<Tier | "new" | null>(null);
  const [archiving, setArchiving] = useState<Tier | null>(null);
  const [archiveError, setArchiveError] = useState<{ text: string; count?: number } | null>(null);
  const [pending, start] = useTransition();
  const list = liveTiers(tiers);

  return (
    <Card
      title={t("tiers_card.title")}
      description={t("tiers_card.desc")}
      action={
        canEdit ? (
          <Button size="xs" icon="plus" onClick={() => setEditing("new")}>
            {t("tiers_card.add")}
          </Button>
        ) : undefined
      }
    >
      <ul className="divide-y divide-border">
        {list.map((x) => (
          <li key={x.code} className="flex items-center gap-3 py-2.5">
            <span className="w-3.5 h-3.5 rounded-full shrink-0 border border-border" style={{ background: x.color }} />
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold text-text truncate">{tierName(tiers, x.code, locale)}</p>
              <p className="text-[11.5px] text-subtext">
                {t("tiers_card.usage", { zones: x.zone_count, overrides: x.override_count })} · <code>{x.code}</code>
              </p>
            </div>
            {canEdit && (
              <div className="flex items-center gap-1 shrink-0">
                <Button variant="secondary" size="xs" icon="pencil" onClick={() => setEditing(x)} aria-label={t("actions.edit")} />
                <Button
                  variant="ghost"
                  size="xs"
                  className="hover:!text-danger"
                  onClick={() => {
                    setArchiveError(null);
                    setArchiving(x);
                  }}
                >
                  {t("actions.archive")}
                </Button>
              </div>
            )}
          </li>
        ))}
        {!list.length && <li className="py-3 text-sm text-subtext">{t("tiers_card.empty")}</li>}
      </ul>

      {canEdit && (
        <>
          <Modal
            open={!!editing}
            onClose={() => setEditing(null)}
            title={editing === "new" ? t("tiers_card.new_title") : t("tiers_card.edit_title")}
            widthClassName="max-w-lg"
          >
            {editing && (
              <TierFormBody
                key={editing === "new" ? "new" : editing.code}
                tier={editing === "new" ? null : editing}
                nextOrder={nextTierOrder(tiers)}
                onClose={() => setEditing(null)}
                onSaved={() => {
                  setEditing(null);
                  router.refresh();
                }}
              />
            )}
          </Modal>
          <Modal open={!!archiving} onClose={() => setArchiving(null)} title={t("tiers_card.archive_title")}>
            <p className="text-sm text-subtext mb-4">
              {t("tiers_card.archive_body", { tier: archiving ? tierName(tiers, archiving.code, locale) : "" })}
            </p>
            {archiveError && (
              <p className="text-sm text-danger mb-3">
                {archiveError.text}{" "}
                {archiveError.count !== undefined && archiving && (
                  <Link href={`/pricing/overrides?tier=${archiving.code}`} className="underline font-semibold">
                    {t("tiers_card.see_overrides")}
                  </Link>
                )}
              </p>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setArchiving(null)} disabled={pending}>
                {t("actions.cancel")}
              </Button>
              <Button
                variant="danger"
                size="sm"
                loading={pending}
                onClick={() =>
                  start(async () => {
                    const res = await archiveTier(archiving!.code);
                    if (!res.ok) return setArchiveError({ text: res.error, count: res.code === "tier_in_use" ? (res.overrideCount ?? 0) : undefined });
                    setArchiving(null);
                    router.refresh();
                  })
                }
              >
                {t("actions.archive")}
              </Button>
            </div>
          </Modal>
        </>
      )}
    </Card>
  );
}

function TierFormBody({
  tier,
  nextOrder,
  onClose,
  onSaved,
}: {
  tier: Tier | null;
  nextOrder: number;
  onClose: () => void;
  onSaved: () => void;
}) {
  const t = useTranslations("pricing");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<TierForm>({
    defaultValues: {
      code: tier?.code ?? "",
      en: tier?.names.en ?? "",
      fr: tier?.names.fr ?? "",
      ar: tier?.names.ar ?? "",
      color: tier?.color ?? "#6B7280",
      sort_order: String(tier?.sort_order ?? nextOrder),
      note: tier?.note ?? "",
    },
  });
  const color = useWatch({ control, name: "color" });

  const submit = handleSubmit((f) => {
    const names = { en: f.en.trim(), fr: f.fr.trim(), ar: f.ar.trim() };
    const sort_order = Math.round(Number(f.sort_order));
    const note = f.note.trim() || null;
    setMessage(null);
    start(async () => {
      const res = tier
        ? await updateTier(tier.code, { names, color: f.color, sort_order, note, expected_updated_at: tier.updated_at })
        : await createTier({ code: f.code.trim(), names, color: f.color, sort_order, note });
      if (!res.ok) return setMessage(res.error);
      onSaved();
    });
  });

  const req = { required: t("errors.required"), validate: (v: string) => v.trim().length > 0 || t("errors.required") };
  return (
    <form onSubmit={submit} className="space-y-3 max-h-[75vh] overflow-y-auto pe-1">
      {!tier && (
        <FormRow label={t("tiers_card.code")}>
          <input
            className={fInput}
            placeholder="suburban"
            dir="ltr"
            {...register("code", { validate: (v) => isTierCode(v.trim()) || t("tiers_card.code_invalid") })}
          />
          <span className="block text-[11.5px] text-subtext mt-1">{t("tiers_card.code_hint")}</span>
          {errors.code && <span className="block text-[11.5px] text-danger mt-1">{errors.code.message}</span>}
        </FormRow>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <FormRow label={t("tiers_card.name_en")}>
          <input className={fInput} dir="ltr" {...register("en", req)} />
          {errors.en && <span className="block text-[11.5px] text-danger mt-1">{errors.en.message}</span>}
        </FormRow>
        <FormRow label={t("tiers_card.name_fr")}>
          <input className={fInput} dir="ltr" {...register("fr", req)} />
          {errors.fr && <span className="block text-[11.5px] text-danger mt-1">{errors.fr.message}</span>}
        </FormRow>
        <FormRow label={t("tiers_card.name_ar")}>
          <input className={fInput} dir="rtl" {...register("ar", req)} />
          {errors.ar && <span className="block text-[11.5px] text-danger mt-1">{errors.ar.message}</span>}
        </FormRow>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormRow label={t("tiers_card.color")}>
          <div className="flex items-center gap-2">
            <input
              type="color"
              aria-label={t("tiers_card.color")}
              value={isHexColor(color) ? color : "#6B7280"}
              onChange={(e) => setValue("color", e.target.value.toUpperCase(), { shouldValidate: true })}
              className="h-9 w-10 rounded-lg border border-border bg-card cursor-pointer p-0.5"
            />
            <input className={fInput} dir="ltr" maxLength={7} {...register("color", { validate: (v) => isHexColor(v) || t("tiers_card.color_invalid") })} />
          </div>
          {errors.color && <span className="block text-[11.5px] text-danger mt-1">{errors.color.message}</span>}
        </FormRow>
        <FormRow label={t("tiers_card.order")}>
          <input type="number" step={1} className={fInput} {...register("sort_order", { validate: (v) => Number.isInteger(Number(v)) || t("errors.integer") })} />
          {errors.sort_order && <span className="block text-[11.5px] text-danger mt-1">{errors.sort_order.message}</span>}
        </FormRow>
      </div>
      <FormRow label={t("modal.note")}>
        <textarea className={`${fInput} min-h-[56px]`} maxLength={300} {...register("note")} />
      </FormRow>
      {message && <p className="text-sm text-danger">{message}</p>}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={pending}>
          {t("actions.cancel")}
        </Button>
        <Button type="submit" size="sm" loading={pending}>
          {tier ? t("actions.save") : t("actions.create")}
        </Button>
      </div>
    </form>
  );
}
