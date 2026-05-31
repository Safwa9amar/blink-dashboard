"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Card, Button, Toggle, FormRow, Segmented, DashIcon, fInput } from "@/components/ui";
import type { Coupon } from "../data";
import { CouponCard } from "./coupon-card";

export function CreateCoupon({ onCancel }: { onCancel: () => void }) {
  const t = useTranslations("coupons");
  const td = useTranslations("dash");
  const [title, setTitle] = useState("");
  const [dtype, setDtype] = useState<"pct" | "fixed">("pct");
  const [val, setVal] = useState("10");
  const [min, setMin] = useState("1000");
  const [max, setMax] = useState("500");
  const [code, setCode] = useState("WELCOME10");
  const [days, setDays] = useState("14");
  const [locked, setLocked] = useState(false);
  const [points, setPoints] = useState("500");

  const preview: Coupon = {
    disc: dtype === "pct" ? `${val || "0"}%` : val || "0",
    unit: dtype === "pct" ? "OFF" : "DZD",
    title: title || t("form.title"),
    min: Number(min) || 0,
    max: dtype === "pct" ? Number(max) || null : null,
    code: code || "CODE",
    days: Number(days) || 0,
    locked,
    points: Number(points) || 0,
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-5 items-start">
      <Card title={t("form.create")} description={t("form.create_desc")}>
        <FormRow label={t("form.title")}>
          <input className={fInput} value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t("form.title_ph")} />
        </FormRow>
        <FormRow label={t("form.dtype")}>
          <Segmented
            options={[
              ["pct", t("form.pct")],
              ["fixed", t("form.fixed")],
            ]}
            value={dtype}
            onChange={setDtype}
          />
        </FormRow>
        <div className="flex gap-3.5">
          <FormRow label={dtype === "pct" ? t("form.percent_off") : t("form.amount")} className="flex-1">
            <input className={fInput} value={val} onChange={(e) => setVal(e.target.value)} />
          </FormRow>
          <FormRow label={t("form.code")} className="flex-1">
            <input className={fInput} value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} />
          </FormRow>
        </div>
        <div className="flex gap-3.5">
          <FormRow label={t("form.min")} className="flex-1">
            <input className={fInput} value={min} onChange={(e) => setMin(e.target.value)} />
          </FormRow>
          <FormRow label={t("form.max")} hint={t("form.max_hint")} className="flex-1">
            <input
              className={fInput}
              value={max}
              onChange={(e) => setMax(e.target.value)}
              disabled={dtype !== "pct"}
              style={{ opacity: dtype === "pct" ? 1 : 0.5 }}
            />
          </FormRow>
        </div>
        <FormRow label={t("form.days")} className="!mb-0">
          <input className={`${fInput} max-w-40`} value={days} onChange={(e) => setDays(e.target.value)} />
        </FormRow>
      </Card>

      <div className="space-y-4">
        <Card title={t("form.unlock")}>
          <div className="flex items-center justify-between p-3.5 bg-background border border-border rounded-xl">
            <div>
              <b className="flex items-center gap-1.5 text-[13.5px] font-bold text-text">
                <DashIcon name="lock" className="w-[15px] h-[15px] text-primary" />
                {t("form.points_locked")}
              </b>
              <span className="block text-[11.5px] text-subtext mt-0.5">{t("form.points_locked_desc")}</span>
            </div>
            <Toggle on={locked} onClick={() => setLocked((p) => !p)} />
          </div>
          {locked && (
            <FormRow label={t("form.points")} className="!mb-0 mt-3">
              <input className={`${fInput} max-w-40`} value={points} onChange={(e) => setPoints(e.target.value)} />
            </FormRow>
          )}
          <div className="flex gap-2.5 mt-4">
            <Button variant="secondary" onClick={onCancel} className="flex-1">
              {td("cancel")}
            </Button>
            <Button onClick={onCancel} className="flex-1">
              {td("create")}
            </Button>
          </div>
        </Card>
        <Card title={td("live_preview")}>
          <CouponCard c={preview} />
        </Card>
      </div>
    </div>
  );
}
