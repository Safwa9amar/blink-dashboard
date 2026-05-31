"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Card,
  Button,
  FormRow,
  Segmented,
  RoleChips,
  LangTabs,
  Badge,
  DashIcon,
  RichEditor,
  fInput,
  emptyLang,
  dirFor,
  toggleInList,
  type Lang,
} from "@/components/ui";
import { N_CATS, N_CAT_NAMES, N_ROLES, N_ROLE_VARIANT, COVERS } from "../data";
import type { PostStatus, PostContent } from "../types";
import { useNewsStore } from "../store";
import { CoverPick } from "./cover-pick";
import { ToggleRow } from "./toggle-row";
import { PostPreview, type PreviewData } from "./post-preview";

export function Compose({ onCancel }: { onCancel: () => void }) {
  const t = useTranslations("news");
  const td = useTranslations("dash");
  const createPost = useNewsStore((s) => s.createPost);
  const posts = useNewsStore((s) => s.posts);
  const scheduled = useMemo(
    () =>
      posts
        .filter((p) => p.status === "scheduled")
        .sort((a, b) => (a.scheduledAt ?? "").localeCompare(b.scheduledAt ?? "")),
    [posts]
  );

  const [lang, setLang] = useState<Lang>("en");
  const [title, setTitle] = useState(emptyLang());
  const [sum, setSum] = useState(emptyLang());
  const [body, setBody] = useState(emptyLang());
  const [cat, setCat] = useState("Network");
  const [cover, setCover] = useState(COVERS[0]);
  const [roles, setRoles] = useState(["All"]);
  const [when, setWhen] = useState<"now" | "schedule">("now");
  const [scheduledAt, setScheduledAt] = useState("2026-06-01T09:00");
  const [expiresOn, setExpiresOn] = useState(false);
  const [expiresAt, setExpiresAt] = useState("");
  const [pin, setPin] = useState(false);
  const [push, setPush] = useState(true);
  const [cta, setCta] = useState("Learn more");
  const [previewOpen, setPreviewOpen] = useState(false);
  const catColor = N_CATS.find((c) => c.name === cat)?.color;

  const draftContent: Partial<Record<Lang, PostContent>> = {
    en: { title: title.en, sum: sum.en, body: body.en },
    fr: { title: title.fr, sum: sum.fr, body: body.fr },
    ar: { title: title.ar, sum: sum.ar, body: body.ar },
  };
  const previewData: PreviewData = { cover, cat, cta, roles, content: draftContent, title: title.en, sum: sum.en };

  function submit(status: PostStatus) {
    const content: Partial<Record<Lang, PostContent>> = {};
    (["en", "fr", "ar"] as Lang[]).forEach((l) => {
      const hasBody = !!body[l] && body[l] !== "<p></p>";
      if (title[l].trim() || sum[l].trim() || hasBody) {
        content[l] = { title: title[l], sum: sum[l], body: body[l] };
      }
    });
    createPost({
      content,
      cat,
      cover,
      roles,
      status,
      pin,
      push,
      cta,
      scheduledAt: status === "scheduled" ? scheduledAt : undefined,
      expiresAt: expiresOn && expiresAt ? expiresAt : undefined,
    });
    onCancel();
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-5 items-start">
      <Card title={t("form.compose")} description={t("form.compose_desc")}>
        <FormRow label={t("form.cover")}>
          <CoverPick covers={COVERS} value={cover} onChange={setCover} uploadLabel={t("form.upload")} />
        </FormRow>
        <FormRow label={t("form.lang")} hint={t("form.lang_hint")}>
          <LangTabs active={lang} onChange={setLang} filled={{ en: !!title.en, fr: !!title.fr, ar: !!title.ar }} />
        </FormRow>
        <FormRow label={t("form.title")}>
          <input
            className={fInput}
            dir={dirFor(lang)}
            value={title[lang]}
            onChange={(e) => setTitle((o) => ({ ...o, [lang]: e.target.value }))}
            placeholder={t("form.title_ph")}
          />
        </FormRow>
        <FormRow label={t("form.summary")}>
          <input
            className={fInput}
            dir={dirFor(lang)}
            value={sum[lang]}
            onChange={(e) => setSum((o) => ({ ...o, [lang]: e.target.value }))}
            placeholder={t("form.summary_ph")}
          />
        </FormRow>
        <FormRow label={t("form.category")}>
          <select className={fInput} value={cat} onChange={(e) => setCat(e.target.value)}>
            {N_CAT_NAMES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </FormRow>
        <FormRow label={t("form.audience")} hint={t("form.audience_hint")}>
          <RoleChips roles={N_ROLES} selected={roles} onToggle={(r) => setRoles((rs) => toggleInList(rs, r))} />
        </FormRow>
        <FormRow label={t("form.body")} hint={t("form.body_hint")}>
          {/* key={lang} gives each language its own editor instance + undo history,
              so an undo in one language can never pull another language's content in. */}
          <RichEditor
            key={lang}
            value={body[lang]}
            onChange={(html) => setBody((o) => ({ ...o, [lang]: html }))}
            dir={dirFor(lang)}
            placeholder={t("form.body_ph")}
          />
        </FormRow>
        <FormRow label={t("form.cta")} className="!mb-0">
          <input className={fInput} value={cta} onChange={(e) => setCta(e.target.value)} placeholder={t("form.cta_ph")} />
        </FormRow>
      </Card>

      <div className="space-y-4">
        <Card title={t("form.publish")}>
          <FormRow label={td("schedule")}>
            <Segmented
              options={[
                ["now", td("publish_now")],
                ["schedule", td("schedule")],
              ]}
              value={when}
              onChange={setWhen}
            />
            {when === "schedule" && (
              <input
                type="datetime-local"
                className={`${fInput} mt-2.5`}
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                aria-label={t("form.publish_at")}
              />
            )}
          </FormRow>
          <ToggleRow icon="pin" title={t("form.pin")} desc={t("form.pin_desc")} on={pin} onClick={() => setPin((p) => !p)} />
          <ToggleRow icon="bell" title={t("form.push")} desc={t("form.push_desc")} on={push} onClick={() => setPush((p) => !p)} />
          <ToggleRow
            icon="clock"
            title={t("form.auto_unpublish")}
            desc={t("form.auto_unpublish_desc")}
            on={expiresOn}
            onClick={() => setExpiresOn((p) => !p)}
            last
          />
          {expiresOn && (
            <input
              type="datetime-local"
              className={`${fInput} mt-3`}
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              aria-label={t("form.auto_unpublish")}
            />
          )}
          <Button onClick={() => submit(when === "schedule" ? "scheduled" : "published")} className="w-full mt-4">
            {when === "schedule" ? td("schedule") : td("publish")}
          </Button>
          <div className="flex gap-2.5 mt-2.5">
            <Button variant="secondary" onClick={onCancel} className="flex-1">
              {td("cancel")}
            </Button>
            <Button variant="secondary" onClick={() => submit("draft")} className="flex-1">
              {t("form.save_draft")}
            </Button>
          </div>
        </Card>

        <Card
          title={td("live_preview")}
          action={
            <Button size="sm" variant="secondary" icon="eye" onClick={() => setPreviewOpen(true)}>
              {t("preview_modal.open")}
            </Button>
          }
        >
          <div className="w-[248px] mx-auto rounded-[26px] bg-background border border-border overflow-hidden shadow-2xl">
            <div className="relative h-[120px] bg-cover bg-center bg-muted" style={{ backgroundImage: `url(${cover})` }}>
              <span
                className="absolute top-2.5 start-2.5 bg-white/90 text-[9px] font-extrabold px-2.5 py-[3px] rounded-full uppercase tracking-wide"
                style={{ color: catColor }}
              >
                {cat}
              </span>
            </div>
            <div className="px-[15px] pt-3.5 pb-[18px]" dir={dirFor(lang)}>
              <h4 className="text-[15px] font-bold text-text leading-tight">{title[lang] || t("preview.headline")}</h4>
              <p className="text-xs text-subtext mt-[7px] leading-normal">{sum[lang] || t("preview.summary")}</p>
              <span className="mt-3 inline-flex items-center gap-1.5 bg-primary text-white text-xs font-bold px-4 py-2.5 rounded-full">
                {cta || t("form.cta_ph")}
              </span>
            </div>
          </div>
          <div className="flex gap-1.5 justify-center mt-3 flex-wrap">
            {roles.map((r) => (
              <Badge key={r} variant={N_ROLE_VARIANT[r]}>
                {r}
              </Badge>
            ))}
            {push && <Badge variant="primary">{t("preview.push_on")}</Badge>}
            {pin && <Badge variant="warning">{t("preview.pinned")}</Badge>}
          </div>
        </Card>

        {scheduled.length > 0 && (
          <Card title={t("form.upcoming")} description={t("form.upcoming_desc")}>
            <div className="space-y-2.5">
              {scheduled.map((p) => (
                <div key={p.id} className="flex items-center gap-3 p-3 bg-background border border-border rounded-xl">
                  <span className="w-9 h-9 rounded-lg bg-info-light text-info flex items-center justify-center shrink-0">
                    <DashIcon name="calendar2" className="w-[18px] h-[18px]" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-bold text-text truncate">{p.title}</div>
                    <div className="text-[11px] text-subtext">{p.cat}</div>
                  </div>
                  <Badge variant="info">{p.date}</Badge>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      <PostPreview open={previewOpen} onClose={() => setPreviewOpen(false)} data={previewData} lang={lang} />
    </div>
  );
}
