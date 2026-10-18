"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import { Badge, Button, Card, EmptyState } from "@/components/ui";
import { updateDefault } from "@/app/d/pricing/action";
import { formToValue, formatValueLines, valueToForm, type FeeForm } from "../format";
import type { Fee, FeeGroup, TFn } from "../types";
import { FeeValueFields } from "./fee-value-fields";

const GROUPS: FeeGroup[] = ["customer", "partner", "tax"];

export function DefaultsBoard({ fees, canEdit, error }: { fees: Fee[]; canEdit: boolean; error?: string }) {
  const t = useTranslations("pricing");
  if (error) return <p className="text-sm text-danger">{error}</p>;
  if (!fees.length) return <EmptyState title={t("defaults.empty")} />;

  return (
    <div className="space-y-6">
      {GROUPS.map((g) => {
        const list = fees.filter((f) => f.group === g);
        if (!list.length) return null;
        return (
          <Card key={g} title={t(`groups.${g}`)} description={t(`groups.${g}_desc`)}>
            <div className="divide-y divide-border">
              {list.map((fee) => (
                <FeeRow key={`${fee.key}:${fee.updated_at}`} fee={fee} canEdit={canEdit} />
              ))}
            </div>
          </Card>
        );
      })}
    </div>
  );
}

function FeeRow({ fee, canEdit }: { fee: Fee; canEdit: boolean }) {
  const t = useTranslations("pricing");
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState<{ text: string; stale?: boolean } | null>(null);
  const [pending, start] = useTransition();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FeeForm>({ defaultValues: valueToForm(fee.key, fee.value) });

  const submit = handleSubmit((form) => {
    const value = formToValue(fee.key, form);
    if (!value) return;
    setMessage(null);
    start(async () => {
      const res = await updateDefault(fee.key, value, fee.updated_at);
      if (!res.ok) {
        setMessage({ text: res.error, stale: res.stale });
        if (res.stale) router.refresh();
        return;
      }
      setEditing(false);
      router.refresh();
    });
  });

  const lines = formatValueLines(fee.key, fee.value, t as unknown as TFn);

  return (
    <div className="py-4 first:pt-0 last:pb-0">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-text">{t(`fees.${fee.key}.name`)}</p>
          <p className="text-[12.5px] text-subtext mt-0.5">{t(`fees.${fee.key}.desc`)}</p>
          {!editing && (
            <div className="mt-2 space-y-0.5">
              {lines.map((l) => (
                <p key={l} className="text-sm font-semibold text-text">
                  {l}
                </p>
              ))}
            </div>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {fee.active_overrides > 0 ? (
              <Link href={`/pricing/overrides?key=${fee.key}&status=active`}>
                <Badge variant="primary">{t("defaults.active_overrides", { count: fee.active_overrides })}</Badge>
              </Link>
            ) : (
              <span className="text-xs text-subtext">{t("defaults.no_overrides")}</span>
            )}
          </div>
        </div>
        {canEdit && !editing && (
          <Button variant="secondary" size="sm" icon="pencil" onClick={() => setEditing(true)}>
            {t("actions.edit")}
          </Button>
        )}
      </div>

      {editing && (
        <form onSubmit={submit} className="mt-4 space-y-4">
          <FeeValueFields feeKey={fee.key} register={register as never} errors={errors as never} disabled={pending} />
          {message && <p className="text-sm text-danger">{message.text}</p>}
          <div className="flex items-center gap-2">
            <Button type="submit" size="sm" loading={pending}>
              {t("actions.save")}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={pending}
              onClick={() => {
                reset(valueToForm(fee.key, fee.value));
                setMessage(null);
                setEditing(false);
              }}
            >
              {t("actions.cancel")}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
