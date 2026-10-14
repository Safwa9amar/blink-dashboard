"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button, Card, FormRow, Segmented, fInput } from "@/components/ui";
import { issueCoupon, searchCustomers } from "@/app/d/coupons/action";
import { genCode } from "@/features/promotions";
import { COUPON_ART } from "../status";
import { EMPTY_ISSUE, validateIssue, type IssueErrors, type IssueValues } from "../issue";
import type { CustomerHit, PromotionOption } from "../types";

export function IssueCoupon({ promotions }: { promotions: PromotionOption[] }) {
  const t = useTranslations("coupons");
  const router = useRouter();
  const [pending, start] = useTransition();
  const [v, setV] = useState<IssueValues>(() => ({ ...EMPTY_ISSUE, code: genCode(8) }));
  const [expiryDay, setExpiryDay] = useState("");
  const [errors, setErrors] = useState<IssueErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<CustomerHit[]>([]);
  const [picked, setPicked] = useState<CustomerHit | null>(null);
  // Query the current `hits` belong to; null while a request is in flight.
  const [searched, setSearched] = useState<string | null>(null);

  const active = !picked && query.trim().length >= 2;
  const visibleHits = active ? hits : [];
  const searching = active && searched !== query;
  const noMatch = active && !searching && hits.length === 0;
  const set = <K extends keyof IssueValues>(k: K, val: IssueValues[K]) => setV((p) => ({ ...p, [k]: val }));

  useEffect(() => {
    if (picked || query.trim().length < 2) return;
    let live = true;
    const id = setTimeout(() => {
      searchCustomers(query).then((r) => {
        if (!live) return;
        setHits(r);
        setSearched(query);
      });
    }, 250);
    return () => {
      live = false;
      clearTimeout(id);
    };
  }, [query, picked]);

  const errMsg = (k: keyof IssueValues) =>
    errors[k] ? <p className="text-danger text-xs mt-1">{t(`errors.${errors[k]}` as never)}</p> : null;

  const submit = () => {
    setFormError(null);
    const payload: IssueValues = { ...v, expires_at: expiryDay ? new Date(`${expiryDay}T23:59:59`).toISOString() : "" };
    const errs = validateIssue(payload);
    setErrors(errs);
    if (Object.keys(errs).length) return;
    start(async () => {
      const res = await issueCoupon(payload);
      if ("fieldErrors" in res) return setErrors(res.fieldErrors as IssueErrors);
      if (res.error) return setFormError(t.has(`errors.${res.error}` as never) ? t(`errors.${res.error}` as never) : res.error);
      router.push(`/coupons`);
      router.refresh();
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-5 items-start">
      <div className="space-y-5">
        <Card title={t("issue.customer")} description={t("issue.customer_desc")}>
          {picked ? (
            <div className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2.5">
              <div>
                <div className="font-semibold text-sm text-text" dir="auto">{picked.name || "—"}</div>
                <div className="text-xs text-subtext" dir="ltr">{picked.phone}</div>
              </div>
              <Button
                type="button"
                size="xs"
                variant="ghost"
                onClick={() => {
                  setPicked(null);
                  set("userId", "");
                }}
              >
                {t("issue.change")}
              </Button>
            </div>
          ) : (
            <div className="relative">
              <input className={fInput} value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("issue.search_ph")} />
              {(searching || noMatch) && (
                <div className="absolute z-10 start-0 end-0 mt-1 bg-card border border-border rounded-lg shadow-lg px-3 py-2 text-sm text-subtext" role="status">
                  {searching ? t("issue.searching") : <span dir="auto">{t("issue.no_match", { q: query.trim() })}</span>}
                </div>
              )}
              {visibleHits.length > 0 && !searching && (
                <ul className="absolute z-10 start-0 end-0 mt-1 bg-card border border-border rounded-lg shadow-lg overflow-hidden">
                  {visibleHits.map((h) => (
                    <li key={h.id}>
                      <button
                        type="button"
                        className="w-full text-start px-3 py-2 hover:bg-card-hover flex justify-between gap-3 text-sm"
                        onClick={() => {
                          setPicked(h);
                          set("userId", h.id);
                          setQuery("");
                        }}
                      >
                        <span className="font-medium text-text" dir="auto">{h.name || "—"}</span>
                        <span className="text-subtext" dir="ltr">{h.phone}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
          {errMsg("userId")}
        </Card>

        <Card title={t("issue.what")}>
          <FormRow label={t("issue.mode")}>
            <Segmented
              options={[
                ["promotion", t("issue.from_promotion")],
                ["custom", t("issue.custom")],
              ]}
              value={v.mode}
              onChange={(m) => set("mode", m)}
            />
          </FormRow>

          {v.mode === "promotion" ? (
            <FormRow label={t("issue.promotion")} hint={t("issue.promotion_hint")}>
              <select className={fInput} value={v.promotionId} onChange={(e) => set("promotionId", e.target.value)}>
                <option value="">{t("issue.pick_promotion")}</option>
                {promotions
                  .filter((p) => !p.archived)
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title}
                    </option>
                  ))}
              </select>
              {errMsg("promotionId")}
            </FormRow>
          ) : (
            <>
              <FormRow label={t("issue.title")}>
                <input className={fInput} value={v.title} onChange={(e) => set("title", e.target.value)} placeholder={t("issue.title_ph")} />
                {errMsg("title")}
              </FormRow>
              <div className="flex gap-3.5 flex-wrap">
                <FormRow label={t("issue.dtype")} className="flex-1">
                  <select className={fInput} value={v.discount_type} onChange={(e) => set("discount_type", e.target.value as IssueValues["discount_type"])}>
                    <option value="percent">{t("issue.pct")}</option>
                    <option value="fixed">{t("issue.fixed")}</option>
                    <option value="free_delivery">{t("free_delivery")}</option>
                  </select>
                </FormRow>
                <FormRow label={t("issue.art")} className="flex-1">
                  <select className={fInput} value={v.art} onChange={(e) => set("art", e.target.value)}>
                    {COUPON_ART.map((a) => (
                      <option key={a} value={a}>
                        {t(`art.${a}` as never)}
                      </option>
                    ))}
                  </select>
                </FormRow>
              </div>
              <div className="flex gap-3.5 flex-wrap">
                {v.discount_type !== "free_delivery" && (
                  <FormRow label={v.discount_type === "percent" ? t("issue.percent_off") : t("issue.amount")} className="flex-1">
                    <input type="number" min="0" step="any" className={fInput} value={v.discount_value} onChange={(e) => set("discount_value", e.target.value)} dir="ltr" />
                    {errMsg("discount_value")}
                  </FormRow>
                )}
                <FormRow label={t("issue.min_order")} className="flex-1">
                  <input type="number" min="0" step="any" className={fInput} value={v.min_order} onChange={(e) => set("min_order", e.target.value)} dir="ltr" />
                  {errMsg("min_order")}
                </FormRow>
                {v.discount_type === "percent" && (
                  <FormRow label={t("issue.max_discount")} className="flex-1">
                    <input type="number" min="0" step="any" className={fInput} value={v.max_discount} onChange={(e) => set("max_discount", e.target.value)} dir="ltr" />
                    {errMsg("max_discount")}
                  </FormRow>
                )}
              </div>
              <FormRow label={t("issue.expires")} className="!mb-0">
                <input type="date" className={`${fInput} max-w-48`} value={expiryDay} onChange={(e) => setExpiryDay(e.target.value)} dir="ltr" />
                {errMsg("expires_at")}
              </FormRow>
            </>
          )}
        </Card>
      </div>

      <Card title={t("issue.finish")}>
        <FormRow label={t("issue.code")} hint={t("issue.code_hint")}>
          <div className="flex gap-2">
            <input className={`${fInput} font-mono uppercase`} value={v.code} onChange={(e) => set("code", e.target.value.toUpperCase())} dir="ltr" />
            <Button type="button" variant="secondary" onClick={() => set("code", genCode(8))}>
              {t("issue.regenerate")}
            </Button>
          </div>
          {errMsg("code")}
        </FormRow>
        <FormRow label={t("issue.note")} hint={t("dialog.optional")}>
          <textarea className={fInput} dir="auto" rows={3} value={v.note} onChange={(e) => set("note", e.target.value)} />
        </FormRow>
        {formError && <p className="text-danger text-sm mb-3">{formError}</p>}
        <div className="flex gap-2.5">
          <Button type="button" variant="secondary" className="flex-1" onClick={() => router.push("/coupons")}>
            {t("dialog.cancel")}
          </Button>
          <Button type="button" className="flex-1" loading={pending} onClick={submit}>
            {t("issue.submit")}
          </Button>
        </div>
      </Card>
    </div>
  );
}
