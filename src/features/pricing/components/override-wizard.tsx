"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useForm, useWatch } from "react-hook-form";
import { useLocale, useTranslations } from "next-intl";
import { Button, FormRow, Modal, Segmented, fInput } from "@/components/ui";
import { createOverride, previewPricing, updateOverride } from "@/app/d/pricing/action";
import { fromInputDate, summaryParts, toInputDate, type SummaryParts } from "../cockpit";
import { fieldDefs, formMatchesValue, formToValue, formatValueShort, valueToForm, type FeeForm } from "../format";
import { fmtDay, wilayaName } from "../labels";
import type {
  CandidateExample,
  Fee,
  FeeGroup,
  FeeValue,
  Override,
  PartnerHit,
  PartnerKind,
  PricingKey,
  TFn,
} from "../types";
import { WILAYA_OPTIONS } from "../wilayas";
import { BeforeAfter } from "./fee-example";
import { FeeValueFields } from "./fee-value-fields";
import { PartnerPicker } from "./partner-picker";
import { ScopeChips } from "./scope-chips";

interface FormShape {
  service: string;
  wilaya_code: string;
  mode: "always" | "range";
  starts_at: string;
  ends_at: string;
  note: string;
  value: FeeForm;
}

export interface OverridePreset {
  kind: PartnerKind;
  partner: PartnerHit;
}

const GROUPS: FeeGroup[] = ["customer", "partner", "tax"];
const hasScope = (f: Fee) => !!f.scopes.service?.length || f.scopes.wilaya || f.scopes.merchant || f.scopes.agent;

const partnerOf = (o: Override | null | undefined): PartnerHit | null =>
  o && (o.merchant_id || o.agent_id)
    ? { id: (o.merchant_id ?? o.agent_id) as string, name: o.partner_name ?? "", sub: "" }
    : null;

/** 3-step wizard (What -> Who / where -> Value & dates). Editing opens at step 3. */
export function OverrideWizard({
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
  override?: Override | null;
  preset?: OverridePreset | null;
  initialKey?: PricingKey;
  onSaved?: () => void;
}) {
  const t = useTranslations("pricing");
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={override ? t("wizard.edit_title") : t("wizard.create_title")}
      widthClassName="max-w-2xl"
    >
      <Body fees={fees} override={override} preset={preset} initialKey={initialKey} onClose={onClose} onSaved={onSaved} />
    </Modal>
  );
}

function Body({
  fees,
  override,
  preset,
  initialKey,
  onClose,
  onSaved,
}: {
  fees: Fee[];
  override?: Override | null;
  preset?: OverridePreset | null;
  initialKey?: PricingKey;
  onClose: () => void;
  onSaved?: () => void;
}) {
  const t = useTranslations("pricing");
  const tf = t as unknown as TFn;
  const locale = useLocale();
  const editing = !!override;

  const selectable = useMemo(
    () => fees.filter((f) => hasScope(f) && (!preset || f.scopes[preset.kind])),
    [fees, preset],
  );
  const [key, setKey] = useState<PricingKey | null>(
    override?.key ?? (initialKey && selectable.some((f) => f.key === initialKey) ? initialKey : null),
  );
  const [step, setStep] = useState<1 | 2 | 3>(editing ? 3 : key && preset ? 3 : 1);
  const fee = fees.find((f) => f.key === key);
  const fields = useMemo(() => fieldDefs(fee), [fee]);
  const partnerKind: PartnerKind | null = preset?.kind ?? (fee?.scopes.merchant ? "merchant" : fee?.scopes.agent ? "agent" : null);

  const { register, handleSubmit, control, reset, getValues, setValue, formState } = useForm<FormShape>({
    defaultValues: {
      service: override?.service ?? "",
      wilaya_code: override?.wilaya_code ?? "",
      mode: override?.starts_at || override?.ends_at ? "range" : "always",
      starts_at: toInputDate(override?.starts_at),
      ends_at: toInputDate(override?.ends_at),
      note: override?.note ?? "",
      value: valueToForm(fieldDefs(fees.find((f) => f.key === key)), override?.value ?? fees.find((f) => f.key === key)?.value),
    },
  });
  const service = useWatch({ control, name: "service" });
  const wilaya = useWatch({ control, name: "wilaya_code" });
  const mode = useWatch({ control, name: "mode" });
  const startsAt = useWatch({ control, name: "starts_at" });
  const endsAt = useWatch({ control, name: "ends_at" });
  const liveValue = useWatch({ control, name: "value" });

  const [partner, setPartner] = useState<PartnerHit | null>(partnerOf(override) ?? preset?.partner ?? null);
  const [error, setError] = useState<{ text: string; conflictId?: string } | null>(null);
  const [scopeError, setScopeError] = useState<string | null>(null);
  const [effective, setEffective] = useState<Partial<Record<PricingKey, FeeValue>>>({});
  const [preview, setPreview] = useState<{ id: string; ex: CandidateExample } | null>(null);
  const [pending, start] = useTransition();
  const [now] = useState(() => new Date());
  const touched = useRef(false);

  const ctx = useMemo(
    () => ({
      ...(service ? { service } : {}),
      ...(wilaya ? { wilaya_code: wilaya } : {}),
      ...(partner && partnerKind ? { [`${partnerKind}_id`]: partner.id } : {}),
    }),
    [service, wilaya, partner, partnerKind],
  );

  // Step 3: value currently effective for the scope pre-fills the fields (until the user types).
  useEffect(() => {
    if (step !== 3 || !key) return;
    let alive = true;
    previewPricing(ctx).then((res) => {
      if (!alive || !res.ok) return;
      const map: Partial<Record<PricingKey, FeeValue>> = {};
      res.data.values.forEach((v) => (map[v.key] = v.value));
      setEffective(map);
      if (!editing && !touched.current && map[key]) setValue("value", valueToForm(fields, map[key]));
    });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, key, ctx, editing]);

  const candidate = useMemo(() => formToValue(fields, liveValue ?? {}), [fields, liveValue]);
  const previewId = JSON.stringify([key, ctx, candidate]);
  useEffect(() => {
    if (step !== 3 || !key || !candidate) return;
    let alive = true;
    const timer = setTimeout(() => {
      previewPricing(ctx, undefined, { key, value: candidate }).then((res) => {
        if (alive && res.ok && res.data.candidate_example) setPreview({ id: previewId, ex: res.data.candidate_example });
      });
    }, 400);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, ctx, key, previewId]);

  const chooseFee = (next: PricingKey) => {
    const f = fees.find((x) => x.key === next)!;
    touched.current = false;
    setKey(next);
    setPreview(null);
    setError(null);
    reset({
      ...getValues(),
      service: "",
      wilaya_code: "",
      value: valueToForm(fieldDefs(f), f.value),
    });
    if (!preset) setPartner(null);
    setStep(2);
  };

  const scopeOk = !!service || !!wilaya || (!!partner && !!partnerKind);
  const goToStep3 = () => {
    if (!scopeOk) return setScopeError(t("wizard.scope_required"));
    setScopeError(null);
    setStep(3);
  };

  const windowIso = {
    starts_at: mode === "range" ? fromInputDate(startsAt) : null,
    ends_at: mode === "range" ? fromInputDate(endsAt) : null,
  };

  const parts: SummaryParts | null =
    fee && candidate
      ? summaryParts({
          fee,
          scope: {
            service,
            wilaya_code: wilaya,
            partnerKind: partner ? partnerKind : null,
            partnerName: partner?.name,
          },
          before: formatValueShort(fee.key, effective[fee.key] ?? fee.value, tf),
          after: formatValueShort(fee.key, candidate, tf),
          window: windowIso,
          now,
        })
      : null;

  const submit = handleSubmit((form) => {
    if (!fee) return;
    const value = formToValue(fields, form.value);
    if (!value) return;
    const range = form.mode === "range";
    const startsChanged = !editing || (range ? form.starts_at : "") !== toInputDate(override!.starts_at);
    const endsChanged = !editing || (range ? form.ends_at : "") !== toInputDate(override!.ends_at);
    const starts = startsChanged ? (range ? fromInputDate(form.starts_at) : null) : (override!.starts_at ?? null);
    const ends = endsChanged ? (range ? fromInputDate(form.ends_at) : null) : (override!.ends_at ?? null);
    if (starts && ends && new Date(ends).getTime() <= new Date(starts).getTime()) {
      setError({ text: t("wizard.window_invalid") });
      return;
    }
    setError(null);
    const note = form.note.trim() || null;
    start(async () => {
      let res;
      if (editing) {
        const patch: { value?: FeeValue; starts_at?: string | null; ends_at?: string | null; note?: string | null } = {};
        if (!formMatchesValue(fields, form.value, override!.value)) patch.value = value;
        if (startsChanged) patch.starts_at = starts;
        if (endsChanged) patch.ends_at = ends;
        if (note !== (override!.note ?? null)) patch.note = note;
        if (!Object.keys(patch).length) return onClose();
        res = await updateOverride(override!.id, patch);
      } else {
        res = await createOverride({
          key: fee.key,
          ...(form.service ? { service: form.service } : {}),
          ...(form.wilaya_code ? { wilaya_code: form.wilaya_code } : {}),
          ...(partner && partnerKind ? { [`${partnerKind}_id`]: partner.id } : {}),
          value,
          starts_at: starts,
          ends_at: ends,
          note,
        });
      }
      if (!res.ok) {
        // A scope rejection belongs to step 2; value / window problems stay on step 3.
        if (!editing && res.status === 400 && /scope|wilaya|merchant|agent|service|partner/i.test(res.error)) {
          setScopeError(res.error);
          setStep(2);
          return;
        }
        setError({ text: res.error, conflictId: res.conflictId });
        return;
      }
      onSaved?.();
      onClose();
    });
  });

  const fresh = preview && preview.id === previewId ? preview.ex : null;
  const shown = fresh ?? preview?.ex ?? null;

  return (
    <form onSubmit={submit} className="max-h-[78vh] overflow-y-auto pe-1">
      {!editing && (
        <div className="mb-4">
          <div className="flex gap-1.5">
            {[1, 2, 3].map((n) => (
              <div key={n} className={`h-1.5 flex-1 rounded-full ${n <= step ? "bg-primary" : "bg-muted"}`} />
            ))}
          </div>
          <p className="text-[12px] text-subtext mt-1.5">
            {t("wizard.step", { n: step })} · {t(`wizard.steps.${step}`)}
          </p>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4">
          {GROUPS.map((g) => {
            const list = selectable.filter((f) => f.group === g);
            if (!list.length) return null;
            return (
              <div key={g}>
                <p className="text-[12px] font-bold text-text mb-2">{t(`groups.${g}`)}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {list.map((f) => (
                    <button
                      key={f.key}
                      type="button"
                      onClick={() => chooseFee(f.key)}
                      className={`text-start rounded-xl border p-3 cursor-pointer transition-colors hover:border-primary ${
                        key === f.key ? "border-primary bg-soft-pink" : "border-border bg-card"
                      }`}
                    >
                      <span className="block text-[13px] font-semibold text-text">{t(`fees.${f.key}.name`)}</span>
                      <span className="block text-[12px] text-subtext mt-0.5">
                        {t("wizard.current", { value: formatValueShort(f.key, f.value, tf) })}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
          {!selectable.length && <p className="text-sm text-subtext">{t("wizard.none")}</p>}
        </div>
      )}

      {step === 2 && fee && (
        <div className="space-y-4">
          <p className="text-[13px] text-text font-semibold">{t(`fees.${fee.key}.name`)}</p>
          <p className="text-[12.5px] text-subtext -mt-2">{t("wizard.scope_hint")}</p>
          {!!fee.scopes.service?.length && (
            <div>
              <span className="block text-[12px] text-subtext mb-1">{t("modal.service")}</span>
              <Segmented
                options={[["", t("modal.any")], ...fee.scopes.service.map((s) => [s, t(`services.${s}`)] as [string, string])]}
                value={service}
                onChange={(v) => setValue("service", v)}
                className="flex-wrap"
              />
            </div>
          )}
          {fee.scopes.wilaya && (
            <label className="block">
              <span className="block text-[12px] text-subtext mb-1">{t("modal.wilaya")}</span>
              <select className={fInput} {...register("wilaya_code")}>
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
            <div>
              <span className="block text-[12px] text-subtext mb-1">{t(`modal.${partnerKind}`)}</span>
              <PartnerPicker kind={partnerKind} value={partner} onChange={setPartner} disabled={!!preset} />
            </div>
          )}
          {scopeError && <p className="text-sm text-danger">{scopeError}</p>}
        </div>
      )}

      {step === 3 && fee && (
        <div className="space-y-4">
          <div>
            <p className="text-[13px] font-semibold text-text">{t(`fees.${fee.key}.name`)}</p>
            {editing ? (
              <div className="mt-1.5">
                <ScopeChips
                  service={override!.service}
                  wilaya_code={override!.wilaya_code}
                  partner={override!.merchant_id || override!.agent_id ? (override!.partner_name ?? "") : null}
                />
                <p className="text-[11.5px] text-subtext mt-1">{t("wizard.scope_locked")}</p>
              </div>
            ) : (
              <div className="mt-1.5">
                <ScopeChips service={service} wilaya_code={wilaya} partner={partner?.name} />
              </div>
            )}
          </div>

          <div onChangeCapture={() => (touched.current = true)}>
            <p className="text-[12px] font-bold text-text mb-1">{t("modal.value")}</p>
            <p className="text-[12px] text-subtext mb-3">{t("modal.value_hint")}</p>
            <FeeValueFields
              key={fee.key}
              fields={fields}
              register={register as never}
              prefix="value."
              errors={formState.errors.value as Record<string, { message?: string }> | undefined}
            />
          </div>

          {shown && <BeforeAfter feeKey={fee.key} before={shown.before} after={shown.after} loading={!fresh} />}

          <div>
            <p className="text-[12px] font-bold text-text mb-2">{t("wizard.when")}</p>
            <Segmented
              options={[
                ["always", t("wizard.always")],
                ["range", t("wizard.range")],
              ]}
              value={mode}
              onChange={(v) => setValue("mode", v)}
            />
            {mode === "range" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
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
            )}
          </div>

          <FormRow label={t("modal.note")}>
            <textarea
              className={`${fInput} min-h-[64px]`}
              maxLength={300}
              placeholder={t("modal.note_placeholder")}
              {...register("note")}
            />
          </FormRow>

          {parts && <p className="rounded-xl border border-border px-3.5 py-2.5 text-[13px] text-text">{summarySentence(parts, tf, locale)}</p>}

          {error && (
            <p className="text-sm text-danger">
              {error.text}{" "}
              {error.conflictId && (
                <Link
                  href={`/pricing/overrides?key=${fee.key}&highlight=${error.conflictId}`}
                  className="underline font-semibold"
                  onClick={onClose}
                >
                  {t("modal.see_conflict")}
                </Link>
              )}
            </p>
          )}
        </div>
      )}

      <div className="flex items-center justify-between gap-2 mt-5">
        <div>
          {step > 1 && !editing && (
            <Button type="button" variant="ghost" size="sm" onClick={() => setStep((step - 1) as 1 | 2)} disabled={pending}>
              {t("wizard.back")}
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={pending}>
            {t("actions.cancel")}
          </Button>
          {step === 2 && (
            <Button type="button" size="sm" onClick={goToStep3}>
              {t("wizard.next")}
            </Button>
          )}
          {step === 3 && (
            <Button type="submit" size="sm" loading={pending} disabled={!fee || !candidate}>
              {editing ? t("actions.save") : t("actions.create")}
            </Button>
          )}
        </div>
      </div>
    </form>
  );
}

/** Assemble the plain-language sentence from `summaryParts` with i18n. */
function summarySentence(p: SummaryParts, t: TFn, locale: string): string {
  const who = [
    p.who.service && t(`services.${p.who.service}`),
    p.who.wilaya && wilayaName(p.who.wilaya, locale),
    p.who.partner && p.who.partner.name,
  ]
    .filter(Boolean)
    .join(" · ");
  const subject = who || t("scope.everywhere");
  const when =
    p.window === "none"
      ? ""
      : t(`wizard.summary.window_${p.window}`, {
          from: p.from ? fmtDay(p.from, locale) : "",
          until: p.until ? fmtDay(p.until, locale) : "",
        });
  return [
    t("wizard.summary.main", {
      subject,
      fee: t(`fees.${p.key}.name`),
      after: p.after,
      before: p.before,
      when,
    }),
    p.reverts ? t("wizard.summary.reverts", { before: p.before }) : "",
    p.notify ? t("wizard.summary.notify") : "",
  ]
    .filter(Boolean)
    .join(" ");
}
