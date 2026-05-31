"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  Card,
  Button,
  Toggle,
  FormRow,
  Segmented,
  RoleChips,
  Badge,
  DashIcon,
  fInput,
  toggleInList,
} from "@/components/ui";
import { P_CATS, P_ROLES, P_ROLE_VARIANT, P_COVERS, type Promo } from "../data";
import { PromoCard } from "./promo-card";

export function PromoCreate({ onCancel }: { onCancel: () => void }) {
  const t = useTranslations("promotions");
  const td = useTranslations("dash");
  const [title, setTitle] = useState("");
  const [sub, setSub] = useState("");
  const [cat, setCat] = useState("Rides");
  const [cover, setCover] = useState(1);
  const [type, setType] = useState<"activate" | "copy">("activate");
  const [code, setCode] = useState("SUMMER40");
  const [roles, setRoles] = useState(["Customer"]);
  const [budget, setBudget] = useState("50000");
  const [when, setWhen] = useState<"now" | "schedule">("now");
  const [shareable, setShareable] = useState(true);

  const preview: Promo = {
    title,
    sub,
    cat,
    type,
    code: type === "copy" ? code : null,
    cover,
    status: when === "schedule" ? "scheduled" : "active",
    reach: 0,
    redeemed: 0,
    ctr: "—",
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-5 items-start">
      <Card title={t("form.create")} description={t("form.create_desc")}>
        <FormRow label={t("form.cover")}>
          <div className="flex gap-2 mt-2">
            {P_COVERS.map((c, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setCover(i)}
                className={`w-16 h-[42px] rounded-[9px] bg-cover bg-center cursor-pointer border-2 ${
                  cover === i ? "border-primary" : "border-transparent"
                }`}
                style={{ backgroundImage: `url(${c})` }}
              />
            ))}
          </div>
        </FormRow>
        <FormRow label={t("form.title")}>
          <input className={fInput} value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t("form.title_ph")} />
        </FormRow>
        <FormRow label={t("form.subtitle")}>
          <input className={fInput} value={sub} onChange={(e) => setSub(e.target.value)} placeholder={t("form.subtitle_ph")} />
        </FormRow>
        <div className="flex gap-3.5">
          <FormRow label={t("form.category")} className="flex-1">
            <select className={fInput} value={cat} onChange={(e) => setCat(e.target.value)}>
              {P_CATS.filter((c) => c !== "All").map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </FormRow>
          <FormRow label={t("form.budget")} className="flex-1">
            <input className={fInput} value={budget} onChange={(e) => setBudget(e.target.value)} />
          </FormRow>
        </div>
        <FormRow label={t("form.action_type")} hint={t("form.action_hint")}>
          <Segmented
            options={[
              ["activate", t("form.activate")],
              ["copy", t("form.copy")],
            ]}
            value={type}
            onChange={setType}
          />
          {type === "copy" && (
            <input
              className={`${fInput} mt-2.5 max-w-56`}
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder={t("form.code_ph")}
            />
          )}
        </FormRow>
        <FormRow label={t("form.audience")} hint={t("form.audience_hint")} className="!mb-0">
          <RoleChips roles={P_ROLES} selected={roles} onToggle={(r) => setRoles((rs) => toggleInList(rs, r))} />
        </FormRow>
      </Card>

      <div className="space-y-4">
        <Card title={t("form.publish")}>
          <FormRow label={t("form.schedule")} className="!mb-0">
            <Segmented
              options={[
                ["now", td("publish_now")],
                ["schedule", td("schedule")],
              ]}
              value={when}
              onChange={setWhen}
            />
            {when === "schedule" && <input className={`${fInput} mt-2.5`} defaultValue="2026-06-03 09:00" />}
          </FormRow>
          <div className="flex items-center justify-between p-3.5 bg-background border border-border rounded-xl mt-3.5">
            <div>
              <b className="flex items-center gap-1.5 text-[13.5px] font-bold text-text">
                <DashIcon name="send" className="w-[15px] h-[15px] text-primary" />
                {t("form.shareable")}
              </b>
              <span className="block text-[11.5px] text-subtext mt-0.5">{t("form.shareable_desc")}</span>
            </div>
            <Toggle on={shareable} onClick={() => setShareable((p) => !p)} />
          </div>
          <div className="flex gap-2.5 mt-4">
            <Button variant="secondary" onClick={onCancel} className="flex-1">
              {td("cancel")}
            </Button>
            <Button onClick={onCancel} className="flex-1">
              {when === "schedule" ? td("schedule") : td("publish")}
            </Button>
          </div>
        </Card>
        <Card title={td("live_preview")}>
          <PromoCard p={preview} />
          <div className="flex gap-1.5 justify-center mt-3 flex-wrap">
            {roles.map((r) => (
              <Badge key={r} variant={P_ROLE_VARIANT[r]}>
                {r}
              </Badge>
            ))}
            {shareable && <Badge variant="primary">shareable</Badge>}
          </div>
        </Card>
      </div>
    </div>
  );
}
