"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { useLocale, useTranslations } from "next-intl";
import { Badge, Button, Card, DataTable, fInput, type Column } from "@/components/ui";
import { previewPricing } from "@/app/d/pricing/action";
import { formatValueInline } from "../format";
import type { PartnerHit, PartnerKind, PreviewValue, TFn } from "../types";
import { WILAYA_OPTIONS } from "../wilayas";
import { PartnerPicker } from "./partner-picker";
import { ScopeChips } from "./scope-chips";

const SERVICES = ["merchant", "shopper", "courier", "ride", "deposit", "withdrawal"] as const;

interface PreviewForm {
  service: string;
  wilaya_code: string;
  partnerKind: PartnerKind;
  at: string;
}

export function PreviewView() {
  const t = useTranslations("pricing");
  const tf = t as unknown as TFn;
  const locale = useLocale();
  const { register, handleSubmit, watch } = useForm<PreviewForm>({
    defaultValues: { service: "", wilaya_code: "", partnerKind: "merchant", at: "" },
  });
  const kind = watch("partnerKind");
  const [partner, setPartner] = useState<PartnerHit | null>(null);
  const [rows, setRows] = useState<PreviewValue[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const run = handleSubmit((f) => {
    setError(null);
    start(async () => {
      const res = await previewPricing({
        ...(f.service ? { service: f.service } : {}),
        ...(f.wilaya_code ? { wilaya_code: f.wilaya_code } : {}),
        ...(partner ? { [`${f.partnerKind}_id`]: partner.id } : {}),
        // datetime-local is Africa/Algiers (UTC+1, no DST)
        ...(f.at ? { at: new Date(`${f.at}:00+01:00`).toISOString() } : {}),
      });
      if (!res.ok) return setError(res.error);
      setRows(res.data.values);
    });
  });

  const columns: Column<PreviewValue>[] = [
    {
      key: "key",
      label: t("overrides.col.fee"),
      render: (r) => <span className="font-semibold text-text">{t(`fees.${r.key}.name`)}</span>,
    },
    {
      key: "value",
      label: t("overrides.col.value"),
      sortable: false,
      render: (r) => <span className="text-sm">{formatValueInline(r.key, r.value, tf)}</span>,
    },
    {
      key: "source",
      label: t("preview.col.source"),
      sortable: false,
      render: (r) =>
        r.override_id ? (
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="primary">{t("preview.override")}</Badge>
            {r.scope && (
              <ScopeChips
                service={r.scope.service}
                wilaya_code={r.scope.wilaya_code}
                partner={r.scope.merchant_id || r.scope.agent_id ? (partner?.name ?? t("preview.partner")) : null}
              />
            )}
          </div>
        ) : (
          <Badge>{t("preview.default")}</Badge>
        ),
    },
  ];

  return (
    <div className="space-y-6">
      <Card title={t("preview.context")} description={t("preview.context_desc")}>
        <form onSubmit={run} className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="block">
            <span className="block text-[12px] text-subtext mb-1">{t("modal.service")}</span>
            <select className={fInput} {...register("service")}>
              <option value="">{t("preview.no_service")}</option>
              {SERVICES.map((s) => (
                <option key={s} value={s}>
                  {t(`services.${s}`)}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="block text-[12px] text-subtext mb-1">{t("modal.wilaya")}</span>
            <select className={fInput} {...register("wilaya_code")}>
              <option value="">{t("preview.no_wilaya")}</option>
              {WILAYA_OPTIONS.map((w) => (
                <option key={w.code} value={w.code}>
                  {w.code} · {locale === "ar" ? w.name_ar : w.name}
                </option>
              ))}
            </select>
          </label>
          <div>
            <span className="block text-[12px] text-subtext mb-1">{t("preview.partner")}</span>
            <div className="flex gap-2">
              <select
                className={`${fInput} !w-auto`}
                {...register("partnerKind", { onChange: () => setPartner(null) })}
              >
                <option value="merchant">{t("modal.merchant")}</option>
                <option value="agent">{t("modal.agent")}</option>
              </select>
              <div className="flex-1">
                <PartnerPicker kind={kind} value={partner} onChange={setPartner} />
              </div>
            </div>
          </div>
          <label className="block">
            <span className="block text-[12px] text-subtext mb-1">{t("preview.date")}</span>
            <input type="datetime-local" className={fInput} {...register("at")} />
            <span className="block text-[11.5px] text-subtext mt-1">{t("modal.tz_hint")}</span>
          </label>
          <div className="md:col-span-2 flex justify-end">
            <Button type="submit" size="sm" loading={pending}>
              {t("preview.run")}
            </Button>
          </div>
        </form>
      </Card>

      {error && <p className="text-sm text-danger">{error}</p>}
      {rows && <DataTable columns={columns} data={rows} keyField="key" enablePagination={false} />}
    </div>
  );
}
