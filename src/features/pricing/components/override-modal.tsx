"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { useLocale, useTranslations } from "next-intl";
import { Button, FormRow, Modal, fInput } from "@/components/ui";
import { createOverride, previewPricing, updateOverride } from "@/app/d/pricing/action";
import { exampleLine, formToValue, formatValueInline, valueToForm, type EffectiveMap, type FeeForm } from "../format";
import type { Fee, Override, PartnerHit, PartnerKind, PricingKey, TFn } from "../types";
import { WILAYA_OPTIONS } from "../wilayas";
import { FeeValueFields } from "./fee-value-fields";
import { PartnerPicker } from "./partner-picker";

// Africa/Algiers is a fixed UTC+1 (no DST): datetime-local <-> ISO without a tz library.
const ALGIERS_OFFSET_MS = 60 * 60 * 1000;
export const toInputDate = (iso: string | null | undefined) =>
  iso ? new Date(new Date(iso).getTime() + ALGIERS_OFFSET_MS).toISOString().slice(0, 16) : "";
const fromInputDate = (local: string) => (local ? new Date(`${local}:00+01:00`).toISOString() : null);

interface FormShape {
  key: PricingKey;
  service: string;
  wilaya_code: string;
  starts_at: string;
  ends_at: string;
  note: string;
  value: FeeForm;
}

export interface OverridePreset {
  kind: PartnerKind;
  partner: PartnerHit;
}

const partnerOf = (o: Override | null | undefined): PartnerHit | null =>
  o && (o.merchant_id || o.agent_id)
    ? { id: (o.merchant_id ?? o.agent_id) as string, name: o.partner_name ?? "", sub: "" }
    : null;

export function OverrideModal({
  open,
  onClose,
  fees,
  override,
  preset,
  initialKey,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  fees: Fee[];
  /** Set to edit (scope read-only). */
  override?: Override | null;
  /** Pre-fill (and lock) the partner — the deals card. */
  preset?: OverridePreset | null;
  initialKey?: PricingKey;
  onSaved?: () => void;
}) {
  const t = useTranslations("pricing");
  const locale = useLocale();
  const tf = t as unknown as TFn;
  const editing = !!override;

  const selectable = useMemo(() => (preset ? fees.filter((f) => f.scopes[preset.kind]) : fees), [fees, preset]);
  const startKey = (override?.key ??
    (initialKey && selectable.some((f) => f.key === initialKey) ? initialKey : selectable[0]?.key) ??
    "service_fee") as PricingKey;

  const initial = (): FormShape => ({
    key: startKey,
    service: override?.service ?? "",
    wilaya_code: override?.wilaya_code ?? "",
    starts_at: toInputDate(override?.starts_at),
    ends_at: toInputDate(override?.ends_at),
    note: override?.note ?? "",
    value: valueToForm(startKey, override?.value ?? fees.find((f) => f.key === startKey)?.value),
  });

  const {
    register,
    handleSubmit,
    watch,
    reset,
    getValues,
    formState: { errors },
  } = useForm<FormShape>({ defaultValues: initial() });

  const key = watch("key");
  const service = watch("service");
  const wilaya = watch("wilaya_code");
  const liveValue = watch("value");
  const fee = fees.find((f) => f.key === key);
  const partnerKind: PartnerKind | null = fee?.scopes.merchant ? "merchant" : fee?.scopes.agent ? "agent" : null;

  const [partner, setPartner] = useState<PartnerHit | null>(partnerOf(override) ?? preset?.partner ?? null);
  const [error, setError] = useState<{ text: string; conflictId?: string } | null>(null);
  const [effective, setEffective] = useState<EffectiveMap>({});
  const [pending, start] = useTransition();
  const touched = useRef(false);

  // Reset whenever the modal opens for another target.
  useEffect(() => {
    if (!open) return;
    reset(initial());
    setPartner(partnerOf(override) ?? preset?.partner ?? null);
    setError(null);
    touched.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, override, preset, initialKey]);

  // Effective values at the chosen scope: pre-fill the value (create mode, until the
  // user types) and feed the example line.
  const partnerId = partner?.id;
  useEffect(() => {
    if (!open) return;
    const ctx = {
      ...(service ? { service } : {}),
      ...(wilaya ? { wilaya_code: wilaya } : {}),
      ...(partnerId && partnerKind ? { [`${partnerKind}_id`]: partnerId } : {}),
    };
    let alive = true;
    previewPricing(ctx).then((res) => {
      if (!alive || !res.ok) return;
      const map: EffectiveMap = {};
      res.data.values.forEach((v) => (map[v.key] = v.value));
      setEffective(map);
      if (!editing && !touched.current && map[key]) reset({ ...getValues(), value: valueToForm(key, map[key]) });
    });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, key, service, wilaya, partnerId, partnerKind, editing]);

  const example = useMemo(() => {
    const v = formToValue(key, liveValue ?? {});
    return v ? exampleLine(key, v, effective, tf) : null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, liveValue, effective]);

  const scopeLabel = [
    service && t(`services.${service}`),
    wilaya && (WILAYA_OPTIONS.find((w) => w.code === wilaya)?.[locale === "ar" ? "name_ar" : "name"] ?? wilaya),
    partner?.name,
  ]
    .filter(Boolean)
    .join(" · ");

  const needsPartner = !editing && !!partnerKind && !partner && !!preset;

  const submit = handleSubmit((form) => {
    const value = formToValue(key, form.value);
    if (!value || needsPartner) return;
    const starts = fromInputDate(form.starts_at);
    const ends = fromInputDate(form.ends_at);
    if (starts && ends && ends <= starts) {
      setError({ text: t("modal.window_invalid") });
      return;
    }
    setError(null);
    const note = form.note.trim() || null;
    start(async () => {
      const res = editing
        ? await updateOverride(override!.id, { value, starts_at: starts, ends_at: ends, note })
        : await createOverride({
            key,
            ...(form.service ? { service: form.service } : {}),
            ...(form.wilaya_code ? { wilaya_code: form.wilaya_code } : {}),
            ...(partner && partnerKind ? { [`${partnerKind}_id`]: partner.id } : {}),
            value,
            starts_at: starts,
            ends_at: ends,
            note,
          });
      if (!res.ok) {
        setError({ text: res.error, conflictId: res.conflictId });
        return;
      }
      onSaved?.();
      onClose();
    });
  });

  const onKeyChange = (next: PricingKey) => {
    touched.current = false;
    reset({
      ...getValues(),
      key: next,
      service: "",
      wilaya_code: "",
      value: valueToForm(next, effective[next] ?? fees.find((f) => f.key === next)?.value),
    });
    if (!preset) setPartner(null);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? t("modal.edit_title") : t("modal.create_title")}
      widthClassName="max-w-2xl"
    >
      <form onSubmit={submit} className="max-h-[75vh] overflow-y-auto pe-1">
        <FormRow label={t("modal.fee")}>
          <select
            className={fInput}
            disabled={editing}
            {...register("key", { onChange: (e) => onKeyChange(e.target.value as PricingKey) })}
          >
            {(editing ? fees : selectable).map((f) => (
              <option key={f.key} value={f.key}>
                {t(`fees.${f.key}.name`)}
              </option>
            ))}
          </select>
        </FormRow>

        {fee && (
          <>
            <p className="text-[12px] font-bold text-text mb-2">{t("modal.scope")}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
              {fee.scopes.service && (
                <label className="block">
                  <span className="block text-[12px] text-subtext mb-1">{t("modal.service")}</span>
                  <select className={fInput} disabled={editing} {...register("service")}>
                    <option value="">{t("modal.any")}</option>
                    {fee.scopes.service.map((s) => (
                      <option key={s} value={s}>
                        {t(`services.${s}`)}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              {fee.scopes.wilaya && (
                <label className="block">
                  <span className="block text-[12px] text-subtext mb-1">{t("modal.wilaya")}</span>
                  <select className={fInput} disabled={editing} {...register("wilaya_code")}>
                    <option value="">{t("modal.any_wilaya")}</option>
                    {WILAYA_OPTIONS.map((w) => (
                      <option key={w.code} value={w.code}>
                        {w.code} · {locale === "ar" ? w.name_ar : w.name}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              {partnerKind && (
                <div className="sm:col-span-2">
                  <span className="block text-[12px] text-subtext mb-1">{t(`modal.${partnerKind}`)}</span>
                  <PartnerPicker kind={partnerKind} value={partner} onChange={setPartner} disabled={editing || !!preset} />
                </div>
              )}
              {!fee.scopes.service && !fee.scopes.wilaya && !partnerKind && (
                <p className="text-sm text-subtext sm:col-span-2">{t("modal.no_scopes")}</p>
              )}
            </div>

            <p className="text-[12px] font-bold text-text mb-1">{t("modal.value")}</p>
            <p className="text-[12px] text-subtext mb-3">{t("modal.value_hint")}</p>
            <div className="mb-3" onChangeCapture={() => (touched.current = true)}>
              <FeeValueFields
                key={key}
                feeKey={key}
                register={register as never}
                prefix="value."
                errors={errors.value as Record<string, { message?: string }> | undefined}
              />
            </div>
            {example ? (
              <p className="text-[12.5px] rounded-lg bg-soft-pink text-primary px-3 py-2 mb-5">
                {scopeLabel ? `${scopeLabel} · ` : ""}
                {example}
              </p>
            ) : (
              <p className="text-[12px] text-subtext mb-5">
                {t("modal.current_default", { value: formatValueInline(key, fee.value, tf) })}
              </p>
            )}
          </>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
          <label className="block">
            <span className="block text-[12px] text-subtext mb-1">{t("modal.starts_at")}</span>
            <input type="datetime-local" className={fInput} {...register("starts_at")} />
          </label>
          <label className="block">
            <span className="block text-[12px] text-subtext mb-1">{t("modal.ends_at")}</span>
            <input type="datetime-local" className={fInput} {...register("ends_at")} />
          </label>
          <p className="text-[11.5px] text-subtext sm:col-span-2">{t("modal.tz_hint")}</p>
        </div>

        <FormRow label={t("modal.note")}>
          <textarea
            className={`${fInput} min-h-[72px]`}
            maxLength={300}
            placeholder={t("modal.note_placeholder")}
            {...register("note")}
          />
        </FormRow>

        {error && (
          <p className="text-sm text-danger mb-3">
            {error.text}{" "}
            {error.conflictId && (
              <Link
                href={`/pricing/overrides?key=${key}&highlight=${error.conflictId}`}
                className="underline font-semibold"
                onClick={onClose}
              >
                {t("modal.see_conflict")}
              </Link>
            )}
          </p>
        )}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={pending}>
            {t("actions.cancel")}
          </Button>
          <Button type="submit" size="sm" loading={pending} disabled={!fee || needsPartner}>
            {editing ? t("actions.save") : t("actions.create")}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
