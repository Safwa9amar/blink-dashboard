"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { useLocale, useTranslations } from "next-intl";
import { Badge, Button, Modal } from "@/components/ui";
import { archiveOverride, createOverride, previewPricing, updateDefault, updateOverride } from "@/app/d/pricing/action";
import { fieldDefs, formToValue, formatValueInline, valueToForm, type FeeForm } from "../format";
import type { CandidateExample, Fee, Override, Tier, TFn } from "../types";
import { tierName } from "../zones";
import { BeforeAfter } from "./fee-example";
import { FeeValueFields } from "./fee-value-fields";
import { useZoneData } from "./use-zone-data";

/** Edit a tier's price instead of the default: creates the undated tier-only override, or patches it. */
export type TierTarget = {
  tier: string;
  /** Row service for per-service fees. */
  service?: string | null;
  /** The existing tier override, if any. */
  override?: Override | null;
  /** Value to start from when there is no override (the cell's inherited value). */
  initialValue?: Fee["value"];
};

// Edit a default (or a tier price): the fee's fields, a live before -> after example from the
// server, and the existing `expected_updated_at` stale check.
export function FeeEditModal({
  fee,
  onClose,
  tiers,
  target,
}: {
  fee: Fee | null;
  onClose: () => void;
  tiers?: Tier[];
  target?: TierTarget | null;
}) {
  const t = useTranslations("pricing");
  return (
    <Modal open={!!fee} onClose={onClose} title={fee ? (target ? t("edit.tier_title") : t("edit.title")) : ""} widthClassName="max-w-xl">
      {fee && <Body key={`${fee.key}:${target?.tier ?? ""}:${target?.service ?? ""}`} fee={fee} onClose={onClose} tiers={tiers} target={target} />}
    </Modal>
  );
}

function Body({ fee, onClose, tiers: providedTiers, target }: { fee: Fee; onClose: () => void; tiers?: Tier[]; target?: TierTarget | null }) {
  const t = useTranslations("pricing");
  const tf = t as unknown as TFn;
  const locale = useLocale();
  const router = useRouter();
  const { tiers } = useZoneData({ tiers: providedTiers });
  const fields = useMemo(() => fieldDefs(fee), [fee]);
  const startValue = target ? (target.override?.value ?? target.initialValue ?? fee.value) : fee.value;
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FeeForm>({ defaultValues: valueToForm(fields, startValue) });
  const live = useWatch({ control });
  const candidate = useMemo(() => formToValue(fields, (live ?? {}) as FeeForm), [fields, live]);
  const candidateKey = JSON.stringify(candidate);
  const [preview, setPreview] = useState<{ id: string; ex: CandidateExample } | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const ctx = useMemo(
    () => (target ? { tier: target.tier, ...(target.service ? { service: target.service } : {}) } : {}),
    [target],
  );

  useEffect(() => {
    if (!candidate) return;
    let alive = true;
    const id = candidateKey;
    const timer = setTimeout(() => {
      previewPricing(ctx, undefined, { key: fee.key, value: candidate }).then((res) => {
        if (alive && res.ok && res.data.candidate_example) setPreview({ id, ex: res.data.candidate_example });
      });
    }, 400);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candidateKey, fee.key, ctx]);

  const fresh = preview && preview.id === candidateKey ? preview.ex : null;
  const shown = preview?.ex;

  const submit = handleSubmit((form) => {
    const value = formToValue(fields, form);
    if (!value) return;
    setMessage(null);
    start(async () => {
      const res = target
        ? target.override
          ? await updateOverride(target.override.id, { value })
          : await createOverride({
              key: fee.key,
              tier: target.tier,
              ...(target.service ? { service: target.service } : {}),
              value,
              starts_at: null,
              ends_at: null,
            })
        : await updateDefault(fee.key, value, fee.updated_at);
      if (!res.ok) {
        // Stale: refresh so `fee` carries the new updated_at, but keep what the user typed.
        if (res.stale) {
          setMessage(t("errors.stale_modal"));
          router.refresh();
          return;
        }
        setMessage(res.error);
        return;
      }
      router.refresh();
      onClose();
    });
  });

  // Removing a tier price makes the tier fall back to the default again.
  const removeTierPrice = () => {
    if (!target?.override) return;
    setMessage(null);
    start(async () => {
      const res = await archiveOverride(target.override!.id);
      if (!res.ok) return setMessage(res.error);
      router.refresh();
      onClose();
    });
  };

  return (
    <form onSubmit={submit} className="max-h-[75vh] overflow-y-auto pe-1 space-y-4">
      <div>
        <h4 className="text-base font-bold text-text">{t(`fees.${fee.key}.name`)}</h4>
        <p className="text-[12.5px] text-subtext mt-0.5">{t(`fees.${fee.key}.desc`)}</p>
        {target ? (
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <Badge variant="primary">{tierName(tiers, target.tier, locale)}</Badge>
            {target.service && <Badge variant="info">{t(`services.${target.service}`)}</Badge>}
            <span className="text-[12px] text-subtext">
              {target.override ? t("edit.tier_has_override") : t("edit.tier_inherits", { value: formatValueInline(fee.key, fee.value, tf) })}
            </span>
          </div>
        ) : (
          <p className="text-[12px] text-subtext mt-1">
            {t("modal.current_default", { value: formatValueInline(fee.key, fee.value, tf) })}
          </p>
        )}
      </div>
      <FeeValueFields
        fields={fields}
        register={register as never}
        control={control as never}
        tiers={tiers}
        errors={errors as never}
        disabled={pending}
      />
      {shown ? <BeforeAfter feeKey={fee.key} before={shown.before} after={shown.after} loading={!fresh} /> : null}
      {message && <p className="text-sm text-danger">{message}</p>}
      <div className="flex items-center justify-between gap-2">
        <div>
          {target?.override && (
            <Button type="button" variant="ghost" size="sm" onClick={removeTierPrice} disabled={pending} className="hover:!text-danger">
              {t("edit.remove_tier_price")}
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={pending}>
            {t("actions.cancel")}
          </Button>
          <Button type="submit" size="sm" loading={pending}>
            {t("actions.save")}
          </Button>
        </div>
      </div>
    </form>
  );
}
