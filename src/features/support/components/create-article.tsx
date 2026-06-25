"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Card,
  Button,
  Badge,
  FormRow,
  Segmented,
  RoleChips,
  LangTabs,
  RichEditor,
  fInput,
  emptyLang,
  dirFor,
  toggleInList,
  LANGS,
  type Lang,
} from "@/components/ui";
import {
  createKbArticle,
  updateKbArticle,
  deleteKbArticle,
  publishKbArticle,
} from "@/app/d/support/action";
import { ROLES, ROLE_VARIANT } from "../data";
import { useKbStore } from "../kb-store";
import type {
  SupportArticleContent,
  SupportArticleRow,
  SupportArticleStatus,
  SupportArticleType,
  SupportCategoryRow,
  TFn,
} from "../types";

// Seed a per-language text record (title or body) from an existing row.
function langField(row: SupportArticleRow | undefined, field: keyof SupportArticleContent): Record<Lang, string> {
  const out = emptyLang();
  if (!row) return out;
  const cols: [Lang, SupportArticleContent | null][] = [
    ["en", row.content_eng],
    ["fr", row.content_fr],
    ["ar", row.content_ar],
  ];
  cols.forEach(([l, c]) => {
    if (c) out[l] = c[field];
  });
  return out;
}

function categoryLabel(c: SupportCategoryRow, locale: string): string {
  if (locale === "fr") return c.label_fr ?? c.label_eng;
  if (locale === "ar") return c.label_ar ?? c.label_eng;
  return c.label_eng;
}

// Strip HTML tags to test whether a body has real text content.
const hasText = (html: string) => !!html.replace(/<[^>]*>/g, "").trim();

export function CreateArticle({
  t,
  onCancel,
  initial,
  defaultType = "article",
}: {
  t: TFn;
  onCancel: () => void;
  initial?: SupportArticleRow;
  /** When creating, the default type chosen from the KB tab's New buttons. */
  defaultType?: SupportArticleType;
}) {
  const td = useTranslations("dash");
  const isEdit = !!initial;
  const categories = useKbStore((s) => s.categories);

  const [lang, setLang] = useState<Lang>("en");
  const [type, setType] = useState<SupportArticleType>(initial?.type ?? defaultType);
  const [title, setTitle] = useState(() => langField(initial, "title"));
  const [body, setBody] = useState(() => langField(initial, "body"));
  const [cat, setCat] = useState(initial?.category ?? "");
  const [roles, setRoles] = useState<string[]>(initial?.target_roles ?? ["All"]);
  const [status, setStatus] = useState<SupportArticleStatus>(initial?.status ?? "draft");
  const [cover, setCover] = useState(initial?.cover_url ?? "");
  const [author, setAuthor] = useState(initial?.author ?? "");

  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [removing, setRemoving] = useState(false);

  // Default the category to the first one once categories load (create mode).
  const catKey = useMemo(() => {
    if (cat) return cat;
    return categories[0]?.key ?? "";
  }, [cat, categories]);

  const langFilled = { en: !!title.en, fr: !!title.fr, ar: !!title.ar };

  function buildContent(): {
    content_eng: SupportArticleContent | null;
    content_fr: SupportArticleContent | null;
    content_ar: SupportArticleContent | null;
  } {
    const pick = (l: Lang): SupportArticleContent | null => {
      const tt = title[l].trim();
      const bb = body[l] ?? "";
      if (!tt && !hasText(bb)) return null;
      return { title: title[l], body: bb };
    };
    return { content_eng: pick("en"), content_fr: pick("fr"), content_ar: pick("ar") };
  }

  async function save(nextStatus: SupportArticleStatus) {
    if (pending) return;
    setError(null);

    if (!catKey) {
      setError(t("art.err_category"));
      return;
    }
    if (roles.length === 0) {
      setError(t("art.err_audience"));
      return;
    }
    // Publishing / sending to review requires every language filled in.
    if (nextStatus !== "draft") {
      for (const l of ["en", "fr", "ar"] as Lang[]) {
        if (!title[l].trim()) {
          setLang(l);
          setError(t("art.err_title", { lang: l.toUpperCase() }));
          return;
        }
        if (!hasText(body[l] ?? "")) {
          setLang(l);
          setError(t("art.err_body", { lang: l.toUpperCase() }));
          return;
        }
      }
    }

    const payload = {
      type,
      category: catKey,
      target_roles: roles,
      status: nextStatus,
      cover_url: cover.trim() || null,
      author: author.trim() || null,
      ...buildContent(),
    };

    setPending(true);
    const res = isEdit && initial
      ? await updateKbArticle(initial.id, payload)
      : await createKbArticle(payload);
    setPending(false);

    if (res.error) {
      setError(res.error);
      return;
    }
    setStatus(nextStatus);
    onCancel(); // back to the KB list
  }

  // Quick publish/unpublish toggle (edit mode only).
  async function togglePublish() {
    if (!initial || pending) return;
    const next: SupportArticleStatus = initial.status === "published" ? "draft" : "published";
    setPending(true);
    const res = await publishKbArticle(initial.id, next);
    setPending(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    onCancel();
  }

  async function remove() {
    if (!initial || removing) return;
    setRemoving(true);
    const res = await deleteKbArticle(initial.id);
    setRemoving(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    onCancel();
  }

  const isFaq = type === "faq";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-5 items-start">
      <Card title={isEdit ? t("art.edit") : t("art.new")} description={isEdit ? t("art.edit_desc") : t("art.new_desc")}>
        <FormRow label={t("art.type")} hint={t("art.type_hint")}>
          <Segmented
            options={[
              ["article", t("kb.type_article")],
              ["faq", t("kb.type_faq")],
            ]}
            value={type}
            onChange={setType}
          />
        </FormRow>

        <FormRow label={t("art.lang")} hint={t("art.lang_hint")}>
          <LangTabs active={lang} onChange={setLang} filled={langFilled} />
        </FormRow>

        <FormRow label={t("art.title")}>
          <input
            className={fInput}
            dir={dirFor(lang)}
            value={title[lang]}
            onChange={(e) => setTitle((o) => ({ ...o, [lang]: e.target.value }))}
            placeholder={isFaq ? t("art.question_ph") : t("art.title_ph")}
          />
        </FormRow>

        <FormRow label={t("art.category")}>
          <select className={fInput} value={catKey} onChange={(e) => setCat(e.target.value)}>
            {categories.length === 0 && <option value="">{t("art.no_categories")}</option>}
            {categories.map((c) => (
              <option key={c.key} value={c.key}>
                {categoryLabel(c, lang)}
              </option>
            ))}
          </select>
        </FormRow>

        <FormRow label={t("art.audience")} hint={t("art.audience_hint")}>
          <RoleChips roles={ROLES} selected={roles} onToggle={(r) => setRoles((rs) => toggleInList(rs, r))} />
        </FormRow>

        <FormRow label={t("art.cover")} hint={t("art.cover_hint")}>
          <input
            className={fInput}
            value={cover}
            onChange={(e) => setCover(e.target.value)}
            placeholder="https://…"
            dir="ltr"
          />
        </FormRow>

        <FormRow label={t("art.author")} hint={t("art.author_hint")}>
          <input
            className={fInput}
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder={t("art.author_ph")}
          />
        </FormRow>

        <FormRow label={isFaq ? t("art.answer") : t("art.body")} className="!mb-0">
          {isFaq ? (
            <textarea
              className={`${fInput} min-h-40 leading-relaxed resize-y`}
              dir={dirFor(lang)}
              value={body[lang]}
              onChange={(e) => setBody((o) => ({ ...o, [lang]: e.target.value }))}
              placeholder={t("art.answer_ph")}
            />
          ) : (
            // key={lang} gives each language its own editor instance + undo history.
            <RichEditor
              key={lang}
              value={body[lang]}
              onChange={(html) => setBody((o) => ({ ...o, [lang]: html }))}
              dir={dirFor(lang)}
              placeholder={t("art.body_ph")}
            />
          )}
        </FormRow>
      </Card>

      <div className="space-y-4">
        <Card title={t("art.status_publish")}>
          <FormRow label={t("art.status")}>
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
          {error && (
            <p className="mb-3 rounded-lg border border-danger/30 bg-danger-light px-3 py-2 text-xs text-danger">
              {error}
            </p>
          )}
          <Button onClick={() => save(status)} loading={pending} disabled={pending} className="w-full">
            {status === "published" ? td("publish") : td("save")}
          </Button>
          <div className="flex gap-2.5 mt-2.5">
            <Button variant="secondary" onClick={onCancel} disabled={pending} className="flex-1">
              {td("cancel")}
            </Button>
            {isEdit && (
              <Button variant="secondary" onClick={togglePublish} disabled={pending} className="flex-1">
                {initial?.status === "published" ? t("art.unpublish") : td("publish")}
              </Button>
            )}
          </div>
          {isEdit && (
            <button
              type="button"
              onClick={remove}
              disabled={removing}
              className="mt-3 w-full text-center text-[13px] font-semibold text-danger hover:underline disabled:opacity-50 cursor-pointer"
            >
              {removing ? `${t("art.delete")}…` : t("art.delete")}
            </button>
          )}
        </Card>

        <Card title={td("live_preview")}>
          <div className="border border-border rounded-xl p-4 bg-background" dir={dirFor(lang)}>
            <div className="flex gap-1.5 mb-2.5 flex-wrap">
              <Badge variant={isFaq ? "info" : "default"}>{isFaq ? t("kb.type_faq") : t("kb.type_article")}</Badge>
              {roles.map((r) => (
                <Badge key={r} variant={ROLE_VARIANT[r]}>
                  {r}
                </Badge>
              ))}
            </div>
            <h4 className="text-base font-bold text-text mb-1.5">{title[lang] || t("art.preview_title")}</h4>
            {isFaq ? (
              <p className="text-[13px] text-subtext leading-relaxed whitespace-pre-wrap">
                {body[lang] || t("art.preview_body")}
              </p>
            ) : body[lang] ? (
              <div
                className="blink-prose text-[13px] text-subtext leading-relaxed"
                dangerouslySetInnerHTML={{ __html: body[lang] }}
              />
            ) : (
              <p className="text-[13px] text-subtext leading-relaxed">{t("art.preview_body")}</p>
            )}
          </div>
          <div className="text-[11px] text-subtext mt-1.5">
            {t("art.previewing")} <b className="mx-1">{LANGS.find((l) => l[0] === lang)![1]}</b>
          </div>
        </Card>
      </div>
    </div>
  );
}
