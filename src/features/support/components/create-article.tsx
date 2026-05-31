"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  Card,
  Button,
  Badge,
  FormRow,
  Segmented,
  RoleChips,
  LangTabs,
  fInput,
  emptyLang,
  dirFor,
  toggleInList,
  LANGS,
  type Lang,
} from "@/components/ui";
import { CATEGORIES, ROLES, ROLE_VARIANT } from "../data";
import type { TFn } from "../types";


export function CreateArticle({ t, onCancel }: { t: TFn; onCancel: () => void }) {
  const td = useTranslations("dash");
  const [lang, setLang] = useState<Lang>("en");
  const [title, setTitle] = useState(emptyLang());
  const [cat, setCat] = useState(CATEGORIES[0]);
  const [roles, setRoles] = useState(["Customer"]);
  const [visibility, setVisibility] = useState<"public" | "inapp" | "internal">("public");
  const [status, setStatus] = useState<"draft" | "review" | "published">("draft");
  const [body, setBody] = useState(emptyLang());

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-5 items-start">
      <Card title={t("art.new")} description={t("art.new_desc")}>
        <FormRow label={t("art.lang")} hint={t("art.lang_hint")}>
          <LangTabs active={lang} onChange={setLang} filled={{ en: !!title.en, fr: !!title.fr, ar: !!title.ar }} />
        </FormRow>
        <FormRow label={t("art.title")}>
          <input
            className={fInput}
            dir={dirFor(lang)}
            value={title[lang]}
            onChange={(e) => setTitle((o) => ({ ...o, [lang]: e.target.value }))}
            placeholder={t("art.title_ph")}
          />
        </FormRow>
        <FormRow label={t("art.category")}>
          <select className={fInput} value={cat} onChange={(e) => setCat(e.target.value)}>
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </FormRow>
        <FormRow label={t("art.audience")} hint={t("art.audience_hint")}>
          <RoleChips roles={ROLES} selected={roles} onToggle={(r) => setRoles((rs) => toggleInList(rs, r))} />
        </FormRow>
        <FormRow label={t("art.visibility")}>
          <Segmented
            options={[
              ["public", t("art.vis_public")],
              ["inapp", t("art.vis_inapp")],
              ["internal", t("art.vis_internal")],
            ]}
            value={visibility}
            onChange={setVisibility}
          />
        </FormRow>
        <FormRow label={t("art.body")} className="!mb-0">
          <textarea
            className={`${fInput} min-h-40 leading-relaxed resize-y`}
            dir={dirFor(lang)}
            value={body[lang]}
            onChange={(e) => setBody((o) => ({ ...o, [lang]: e.target.value }))}
            placeholder={t("art.body_ph")}
          />
          <div className="text-[11.5px] text-subtext mt-1.5">{t("art.body_hint")}</div>
        </FormRow>
      </Card>

      <div className="space-y-4">
        <Card title={t("art.status_publish")}>
          <FormRow label={t("art.status")} className="!mb-0">
            <Segmented
              options={[
                ["draft", t("art.draft")],
                ["review", t("art.review")],
                ["published", t("art.published")],
              ]}
              value={status}
              onChange={setStatus}
            />
          </FormRow>
          <div className="flex gap-2.5 mt-4">
            <Button variant="secondary" onClick={onCancel} className="flex-1">
              {td("cancel")}
            </Button>
            <Button onClick={onCancel} className="flex-1">
              {status === "published" ? td("publish") : td("save")}
            </Button>
          </div>
        </Card>
        <Card title={td("live_preview")}>
          <div className="border border-border rounded-xl p-4 bg-background" dir={dirFor(lang)}>
            <div className="flex gap-1.5 mb-2.5 flex-wrap">
              <Badge variant="default">{cat}</Badge>
              {roles.map((r) => (
                <Badge key={r} variant={ROLE_VARIANT[r]}>
                  {r}
                </Badge>
              ))}
            </div>
            <h4 className="text-base font-bold text-text mb-1.5">{title[lang] || t("art.preview_title")}</h4>
            <p className="text-[13px] text-subtext leading-relaxed">{body[lang] || t("art.preview_body")}</p>
          </div>
          <div className="text-[11px] text-subtext mt-1.5">
            {t("art.previewing")} <b className="mx-1">{LANGS.find((l) => l[0] === lang)![1]}</b>
          </div>
        </Card>
      </div>
    </div>
  );
}
