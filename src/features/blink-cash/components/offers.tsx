"use client";

import { useEffect, useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Badge, Button, Card, DashIcon, DataTable, LangTabs, Toggle, dirFor, type Column, type Lang } from "@/components/ui";
import { fInput } from "@/components/ui/primitives";
import { createOffer, setOfferActive, updateOffer } from "@/app/d/blink-cash/ops-action";
import { formatDA } from "../data";
import { formatDateTime } from "../lib/format";
import { emptyOfferForm, offerState, offerToForm, validateOffer, type Offer, type OfferErrors, type OfferForm, type OfferState } from "../lib/offers";
import type { TFn } from "../types";
import { Field, LoadError, MigrationNotice } from "./ops-shared";

const STATE_VARIANT = { live: "success", scheduled: "info", ended: "default", inactive: "default", exhausted: "warning" } as const;

function pickTitle(o: Offer, locale: string) {
  return (o.title as unknown as Record<string, string>)[locale] || o.title.en || o.title.fr || o.title.ar || "—";
}

function Drawer({ t, offer, onClose }: { t: TFn; offer: Offer | null; onClose: () => void }) {
  const [form, setForm] = useState<OfferForm>(() => (offer ? offerToForm(offer) : emptyOfferForm()));
  const [lang, setLang] = useState<Lang>("en");
  const [errors, setErrors] = useState<OfferErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const set = <K extends keyof OfferForm>(k: K, v: OfferForm[K]) => setForm((f) => ({ ...f, [k]: v }));
  const tri = (k: "title" | "description", v: string) => setForm((f) => ({ ...f, [k]: { ...f[k], [lang]: v } }));
  const err = (k: keyof OfferErrors) => (errors[k] ? t(`offers.${errors[k]}`) : undefined);
  const filled = { en: !!form.title.en.trim(), fr: !!form.title.fr.trim(), ar: !!form.title.ar.trim() };

  function save() {
    const v = validateOffer(form);
    if (!v.ok) {
      setErrors(v.errors);
      return;
    }
    setErrors({});
    setError(null);
    start(async () => {
      const res = offer ? await updateOffer(offer.id, form) : await createOffer(form);
      if (res.ok) onClose();
      else setError(res.error);
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-slate-900/50" onClick={onClose} aria-hidden />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={offer ? t("offers.edit") : t("offers.new")}
        className="relative z-10 w-full max-w-lg h-full bg-card border-s border-border shadow-2xl flex flex-col"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 className="text-sm font-semibold text-text">{offer ? t("offers.edit") : t("offers.new")}</h3>
          <button type="button" onClick={onClose} aria-label={t("cancel")} className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-subtext hover:text-text hover:bg-card-hover cursor-pointer">
            <DashIcon name="x" className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <LangTabs active={lang} onChange={setLang} filled={filled} />
          <Field label={t("offers.f_title")} error={err("title")}>
            <input className={fInput} dir={dirFor(lang)} value={form.title[lang]} maxLength={80} onChange={(e) => tri("title", e.target.value)} />
          </Field>
          <Field label={t("offers.f_desc")} hint={t("wallet.optional")}>
            <textarea className={`${fInput} min-h-16`} dir={dirFor(lang)} value={form.description[lang]} maxLength={240} onChange={(e) => tri("description", e.target.value)} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t("offers.f_min")} hint="DA" error={err("min_deposit")}>
              <input className={fInput} dir="ltr" inputMode="decimal" value={form.min_deposit} onChange={(e) => set("min_deposit", e.target.value)} />
            </Field>
            <Field label={t("offers.f_type")}>
              <select className={fInput} value={form.bonus_type} onChange={(e) => set("bonus_type", e.target.value === "percent" ? "percent" : "fixed")}>
                <option value="fixed">{t("offers.type_fixed")}</option>
                <option value="percent">{t("offers.type_percent")}</option>
              </select>
            </Field>
            <Field label={t("offers.f_value")} hint={form.bonus_type === "percent" ? "%" : "DA"} error={err("bonus_value")}>
              <input className={fInput} dir="ltr" inputMode="decimal" value={form.bonus_value} onChange={(e) => set("bonus_value", e.target.value)} />
            </Field>
            {form.bonus_type === "percent" && (
              <Field label={t("offers.f_max_bonus")} hint="DA" error={err("max_bonus")}>
                <input className={fInput} dir="ltr" inputMode="decimal" value={form.max_bonus} onChange={(e) => set("max_bonus", e.target.value)} />
              </Field>
            )}
            <Field label={t("offers.f_starts")} error={err("window")}>
              <input type="datetime-local" className={fInput} value={form.starts_at} onChange={(e) => set("starts_at", e.target.value)} />
            </Field>
            <Field label={t("offers.f_ends")}>
              <input type="datetime-local" className={fInput} value={form.ends_at} onChange={(e) => set("ends_at", e.target.value)} />
            </Field>
            <Field label={t("offers.f_per_user")} error={err("per_user_limit")}>
              <input className={fInput} dir="ltr" inputMode="numeric" value={form.per_user_limit} onChange={(e) => set("per_user_limit", e.target.value)} />
            </Field>
            <Field label={t("offers.f_budget")} hint={t("wallet.optional")} error={err("budget")}>
              <input className={fInput} dir="ltr" inputMode="decimal" value={form.budget} onChange={(e) => set("budget", e.target.value)} />
            </Field>
          </div>
          <p className="text-xs text-subtext mb-4">{t("offers.tz_note")}</p>
          <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5">
            <span className="text-[13px] font-semibold text-text">{t("offers.f_active")}</span>
            <Toggle on={form.active} onClick={() => set("active", !form.active)} />
          </div>
          {error && (
            <p className="text-sm text-danger mt-4" role="alert">
              {error}
            </p>
          )}
        </div>
        <div className="flex justify-end gap-2.5 px-5 py-4 border-t border-border">
          <Button variant="secondary" onClick={onClose} disabled={pending}>
            {t("cancel")}
          </Button>
          <Button loading={pending} onClick={save}>
            {t("settings.save")}
          </Button>
        </div>
      </aside>
    </div>
  );
}

function ActiveToggle({ offer }: { offer: Offer }) {
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  return (
    <div>
      <Toggle
        on={offer.active}
        onClick={() => {
          if (pending) return;
          setErr(null);
          start(async () => {
            const r = await setOfferActive(offer.id, !offer.active);
            if (!r.ok) setErr(r.error);
          });
        }}
      />
      {err && <p className="text-xs text-danger mt-1 max-w-[160px]">{err}</p>}
    </div>
  );
}

export function Offers({ offers, migrationPending, error, nowMs }: { offers: Offer[]; migrationPending?: boolean; error?: string; nowMs: number }) {
  const t = useTranslations("blink_cash") as unknown as TFn;
  const locale = useLocale();
  const [drawer, setDrawer] = useState<{ offer: Offer | null } | null>(null);

  const columns: Column<Offer>[] = [
    {
      key: "title",
      label: t("offers.col_offer"),
      sortable: false,
      render: (o) => (
        <div className="min-w-[160px]">
          <p className="font-semibold text-text" dir="auto">
            {pickTitle(o, locale)}
          </p>
          <p className="text-xs text-subtext">{t("offers.min_line", { amount: formatDA(o.min_deposit) })}</p>
        </div>
      ),
    },
    {
      key: "bonus_value",
      label: t("offers.col_bonus"),
      sortable: false,
      render: (o) => (
        <span className="font-mono whitespace-nowrap">
          {o.bonus_type === "percent" ? `${o.bonus_value}%${o.max_bonus ? ` (≤ ${formatDA(o.max_bonus)})` : ""}` : formatDA(o.bonus_value)}
        </span>
      ),
    },
    {
      key: "starts_at",
      label: t("offers.col_window"),
      sortable: false,
      render: (o) => (
        <span className="text-subtext text-xs whitespace-nowrap">
          {formatDateTime(o.starts_at, locale)} →<br />
          {formatDateTime(o.ends_at, locale)}
        </span>
      ),
    },
    {
      key: "used_count",
      label: t("offers.col_usage"),
      sortable: false,
      render: (o) => (
        <div className="whitespace-nowrap text-xs">
          <p className="text-text">
            {o.used_count} · {formatDA(o.used_amount)}
          </p>
          <p className="text-subtext">{o.budget === null ? t("offers.no_budget") : t("offers.of_budget", { budget: formatDA(o.budget) })}</p>
        </div>
      ),
    },
    {
      key: "state",
      label: t("col.status"),
      sortable: false,
      render: (o) => {
        const st: OfferState = offerState(o, nowMs);
        return <Badge variant={STATE_VARIANT[st]}>{t(`offers.state_${st}`)}</Badge>;
      },
    },
    { key: "active", label: t("offers.f_active"), sortable: false, render: (o) => <ActiveToggle offer={o} /> },
    {
      key: "act",
      label: "",
      sortable: false,
      render: (o) => (
        <Button size="xs" variant="secondary" onClick={() => setDrawer({ offer: o })}>
          {t("agents.edit")}
        </Button>
      ),
    },
  ];

  return (
    <>
      {migrationPending && <MigrationNotice t={t} />}
      <div className="flex items-center gap-3 mb-4">
        <p className="text-[13px] text-subtext">{t("offers.desc")}</p>
        <Button className="ms-auto" icon="plus" onClick={() => setDrawer({ offer: null })} disabled={migrationPending}>
          {t("offers.new")}
        </Button>
      </div>
      {error && !migrationPending ? (
        <LoadError t={t} error={error} />
      ) : (
        <Card padding={false}>
          <DataTable columns={columns} data={offers} empty={t("offers.empty")} enablePagination={false} enableSorting={false} />
        </Card>
      )}
      {drawer && <Drawer key={drawer.offer?.id ?? "new"} t={t} offer={drawer.offer} onClose={() => setDrawer(null)} />}
    </>
  );
}
