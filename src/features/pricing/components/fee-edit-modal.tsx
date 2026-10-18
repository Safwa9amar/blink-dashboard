"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { useTranslations } from "next-intl";
import { Button, Modal } from "@/components/ui";
import { previewPricing, updateDefault } from "@/app/d/pricing/action";
import { fieldDefs, formToValue, formatValueInline, valueToForm, type FeeForm } from "../format";
import type { CandidateExample, Fee, TFn } from "../types";
import { BeforeAfter } from "./fee-example";
import { FeeValueFields } from "./fee-value-fields";

// Edit a default: the fee's fields, a live before -> after example from the server, and the
// existing `expected_updated_at` stale check.
export function FeeEditModal({ fee, onClose }: { fee: Fee | null; onClose: () => void }) {
  const t = useTranslations("pricing");
  return (
    <Modal open={!!fee} onClose={onClose} title={fee ? t("edit.title") : ""} widthClassName="max-w-xl">
      {fee && <Body key={fee.key} fee={fee} onClose={onClose} />}
    </Modal>
  );
}

function Body({ fee, onClose }: { fee: Fee; onClose: () => void }) {
  const t = useTranslations("pricing");
  const tf = t as unknown as TFn;
  const router = useRouter();
  const fields = useMemo(() => fieldDefs(fee), [fee]);
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FeeForm>({ defaultValues: valueToForm(fields, fee.value) });
  const live = useWatch({ control });
  const candidate = useMemo(() => formToValue(fields, (live ?? {}) as FeeForm), [fields, live]);
  const candidateKey = JSON.stringify(candidate);
  const [preview, setPreview] = useState<{ id: string; ex: CandidateExample } | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, start] = useTransition();

  useEffect(() => {
    if (!candidate) return;
    let alive = true;
    const id = candidateKey;
    const timer = setTimeout(() => {
      previewPricing({}, undefined, { key: fee.key, value: candidate }).then((res) => {
        if (alive && res.ok && res.data.candidate_example) setPreview({ id, ex: res.data.candidate_example });
      });
    }, 400);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candidateKey, fee.key]);

  const fresh = preview && preview.id === candidateKey ? preview.ex : null;
  const shown = preview?.ex;

  const submit = handleSubmit((form) => {
    const value = formToValue(fields, form);
    if (!value) return;
    setMessage(null);
    start(async () => {
      const res = await updateDefault(fee.key, value, fee.updated_at);
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

  return (
    <form onSubmit={submit} className="max-h-[75vh] overflow-y-auto pe-1 space-y-4">
      <div>
        <h4 className="text-base font-bold text-text">{t(`fees.${fee.key}.name`)}</h4>
        <p className="text-[12.5px] text-subtext mt-0.5">{t(`fees.${fee.key}.desc`)}</p>
        <p className="text-[12px] text-subtext mt-1">
          {t("modal.current_default", { value: formatValueInline(fee.key, fee.value, tf) })}
        </p>
      </div>
      <FeeValueFields fields={fields} register={register as never} errors={errors as never} disabled={pending} />
      {shown ? (
        <BeforeAfter feeKey={fee.key} before={shown.before} after={shown.after} loading={!fresh} />
      ) : null}
      {message && <p className="text-sm text-danger">{message}</p>}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={pending}>
          {t("actions.cancel")}
        </Button>
        <Button type="submit" size="sm" loading={pending}>
          {t("actions.save")}
        </Button>
      </div>
    </form>
  );
}
