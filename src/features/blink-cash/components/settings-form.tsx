"use client";

import { useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Button, Card, Toggle } from "@/components/ui";
import { fInput } from "@/components/ui/primitives";
import { saveSettings } from "@/app/d/blink-cash/ops-action";
import { formatDateTime } from "../lib/format";
import {
  ACCOUNT_TYPES,
  toSettingsForm,
  validateSettings,
  type BlinkCashSettings,
  type SettingsErrors,
  type SettingsForm,
} from "../lib/settings";
import type { TFn } from "../types";
import { Field, MigrationNotice } from "./ops-shared";

type NumKey =
  | "deposit_fee_pct"
  | "withdrawal_fee_pct"
  | "min_amount"
  | "max_amount"
  | "daily_deposit_limit"
  | "daily_withdrawal_limit"
  | "monthly_deposit_limit"
  | "monthly_withdrawal_limit"
  | "pending_expiry_minutes"
  | "agent_credit_limit"
  | "adjust_limit_finance_admin";

export function SettingsFormView({
  settings,
  migrationPending,
  error,
}: {
  settings: BlinkCashSettings | null;
  migrationPending?: boolean;
  error?: string;
}) {
  const t = useTranslations("blink_cash") as unknown as TFn;
  const locale = useLocale();
  const [form, setForm] = useState<SettingsForm | null>(() => (settings ? toSettingsForm(settings) : null));
  const [errors, setErrors] = useState<SettingsErrors>({});
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();

  if (!form) {
    return (
      <>
        {migrationPending && <MigrationNotice t={t} />}
        {error && !migrationPending && <p className="text-sm text-danger font-mono break-all">{error}</p>}
      </>
    );
  }

  const set = <K extends keyof SettingsForm>(k: K, v: SettingsForm[K]) => {
    setMsg(null);
    setForm((f) => (f ? { ...f, [k]: v } : f));
  };
  const err = (k: keyof SettingsForm) => (errors[k] ? t(`settings.${errors[k]}`) : undefined);
  const num = (k: NumKey, label: string, hint?: string) => (
    <Field label={label} hint={hint} error={err(k)}>
      <input className={fInput} dir="ltr" inputMode="decimal" value={form[k]} onChange={(e) => set(k, e.target.value)} />
    </Field>
  );

  function save() {
    if (!form) return;
    const v = validateSettings(form);
    if (!v.ok) {
      setErrors(v.errors);
      setMsg({ ok: false, text: t("settings.fix_errors") });
      return;
    }
    setErrors({});
    start(async () => {
      const res = await saveSettings(form);
      setMsg(res.ok ? { ok: true, text: t("settings.saved") } : { ok: false, text: res.error });
    });
  }

  return (
    <>
      {migrationPending && <MigrationNotice t={t} />}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        <Card title={t("settings.fees")} description={t("settings.fees_desc")}>
          <div className="grid grid-cols-2 gap-3">
            {num("deposit_fee_pct", t("settings.deposit_fee"), "%")}
            {num("withdrawal_fee_pct", t("settings.withdrawal_fee"), "%")}
          </div>
        </Card>
        <Card title={t("settings.limits")} description={t("settings.limits_desc")}>
          <div className="grid grid-cols-2 gap-3">
            {num("min_amount", t("settings.min_amount"), "DA")}
            {num("max_amount", t("settings.max_amount"), "DA")}
            {num("daily_deposit_limit", t("settings.daily_deposit"), "DA")}
            {num("daily_withdrawal_limit", t("settings.daily_withdrawal"), "DA")}
            {num("monthly_deposit_limit", t("settings.monthly_deposit"), "DA")}
            {num("monthly_withdrawal_limit", t("settings.monthly_withdrawal"), "DA")}
          </div>
        </Card>
        <Card title={t("settings.operations")} description={t("settings.operations_desc")}>
          <div className="grid grid-cols-2 gap-3">
            {num("pending_expiry_minutes", t("settings.expiry"), t("settings.minutes"))}
            {num("agent_credit_limit", t("settings.agent_limit"), "DA")}
            {num("adjust_limit_finance_admin", t("settings.adjust_limit"), "DA")}
          </div>
          <Field label={t("settings.quick_amounts")} hint={t("settings.quick_hint")} error={err("quick_amounts")}>
            <input className={fInput} dir="ltr" value={form.quick_amounts} onChange={(e) => set("quick_amounts", e.target.value)} />
          </Field>
          <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5">
            <div>
              <p className="text-[13px] font-semibold text-text">{t("settings.require_pin")}</p>
              <p className="text-xs text-subtext">{t("settings.require_pin_desc")}</p>
            </div>
            <Toggle on={form.require_pin_for_withdrawal} onClick={() => set("require_pin_for_withdrawal", !form.require_pin_for_withdrawal)} />
          </div>
        </Card>
        <Card title={t("settings.dues_methods")} description={t("settings.dues_methods_desc")}>
          {form.dues_payment_methods.map((m, i) => (
            <div key={i} className="flex gap-2 mb-2">
              <input
                className={fInput}
                dir="ltr"
                placeholder={t("settings.method_id")}
                value={m.id}
                onChange={(e) => set("dues_payment_methods", form.dues_payment_methods.map((x, j) => (j === i ? { ...x, id: e.target.value } : x)))}
              />
              <input
                className={fInput}
                dir="auto"
                placeholder={t("settings.method_label")}
                value={m.label}
                onChange={(e) => set("dues_payment_methods", form.dues_payment_methods.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))}
              />
              <Button variant="ghost" size="sm" aria-label={t("settings.remove")} icon="x" onClick={() => set("dues_payment_methods", form.dues_payment_methods.filter((_, j) => j !== i))} />
            </div>
          ))}
          {err("dues_payment_methods") && <p className="text-xs text-danger mb-2">{err("dues_payment_methods")}</p>}
          <Button variant="secondary" size="sm" icon="plus" onClick={() => set("dues_payment_methods", [...form.dues_payment_methods, { id: "", label: "" }])}>
            {t("settings.add_method")}
          </Button>
        </Card>
      </div>

      <Card title={t("settings.electronic")} description={t("settings.electronic_desc")} className="mb-5">
        <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5 mb-4">
          <div>
            <p className="text-[13px] font-semibold text-text">{t("settings.electronic_enabled")}</p>
            <p className="text-xs text-subtext">{t("settings.electronic_enabled_desc")}</p>
          </div>
          <Toggle on={form.electronic_enabled} onClick={() => set("electronic_enabled", !form.electronic_enabled)} />
        </div>
        {form.electronic_accounts.map((a, i) => {
          const upd = (patch: Partial<typeof a>) => set("electronic_accounts", form.electronic_accounts.map((x, j) => (j === i ? { ...x, ...patch } : x)));
          return (
            <div key={i} className="grid grid-cols-2 lg:grid-cols-[1fr_9rem_1fr_1fr_auto] gap-2 mb-2 items-center">
              <input className={fInput} dir="auto" placeholder={t("settings.acct_label")} value={a.label} onChange={(e) => upd({ label: e.target.value })} />
              <select className={fInput} value={a.type} onChange={(e) => upd({ type: e.target.value as typeof a.type })}>
                {ACCOUNT_TYPES.map((x) => (
                  <option key={x} value={x}>
                    {t(`acct_type.${x}`)}
                  </option>
                ))}
              </select>
              <input className={fInput} dir="ltr" placeholder={t("settings.acct_number")} value={a.number} onChange={(e) => upd({ number: e.target.value })} />
              <input className={fInput} dir="auto" placeholder={t("settings.acct_holder")} value={a.holder} onChange={(e) => upd({ holder: e.target.value })} />
              <Button variant="ghost" size="sm" aria-label={t("settings.remove")} icon="x" onClick={() => set("electronic_accounts", form.electronic_accounts.filter((_, j) => j !== i))} />
            </div>
          );
        })}
        {err("electronic_accounts") && <p className="text-xs text-danger mb-2">{err("electronic_accounts")}</p>}
        <Button variant="secondary" size="sm" icon="plus" onClick={() => set("electronic_accounts", [...form.electronic_accounts, { label: "", type: "ccp", number: "", holder: "" }])}>
          {t("settings.add_account")}
        </Button>
      </Card>

      <div className="flex flex-wrap items-center gap-3">
        <Button loading={pending} onClick={save} disabled={migrationPending}>
          {t("settings.save")}
        </Button>
        {msg && (
          <span className={`text-sm ${msg.ok ? "text-success" : "text-danger"}`} role={msg.ok ? "status" : "alert"}>
            {msg.text}
          </span>
        )}
        {settings?.updated_at && <span className="text-xs text-subtext ms-auto">{t("settings.updated", { when: formatDateTime(settings.updated_at, locale) })}</span>}
      </div>
    </>
  );
}
