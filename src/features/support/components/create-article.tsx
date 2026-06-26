"use client";

import { useMemo, useRef, useState } from "react";
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
  AIGenerateModal,
  EnhanceButton,
  fInput,
  emptyLang,
  dirFor,
  toggleInList,
  LANGS,
  type Lang,
  type AIStreamChunk,
} from "@/components/ui";
import {
  createKbArticle,
  updateKbArticle,
  deleteKbArticle,
  publishKbArticle,
} from "@/app/d/support/action";
import { parseDraftJSON } from "@/lib/ai/parse";
import { streamEnhance } from "@/lib/ai/enhance-client";
import { useAISettingsStore, activeBaseUrl } from "@/features/settings";
import { ROLES, ROLE_VARIANT } from "../data";
import { normalizeSupportDraft, type SupportDraft } from "../ai";
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

// A support AI route, at /d/support/<path>. On the dashboard subdomain the
// middleware rewrites /support/* → /d/support/*, but on a bare /d/... URL (local
// dev) the path already includes /d — pick the right prefix from the location.
function aiUrl(path: string): string {
  const p = typeof window !== "undefined" ? window.location.pathname : "";
  const onD = p === "/d" || p.startsWith("/d/");
  return onD ? `/d/support/${path}` : `/support/${path}`;
}

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

  // AI: the "Generate with AI" trilingual-draft modal + inline per-field enhance.
  const [aiOpen, setAiOpen] = useState(false);
  const [enhancing, setEnhancing] = useState<null | "title" | "body">(null);
  const [enhanceErr, setEnhanceErr] = useState<{ field: "title" | "body"; msg: string } | null>(null);
  const enhanceCtrl = useRef<AbortController | null>(null);

  // Default the category to the first one once categories load (create mode).
  const catKey = useMemo(() => {
    if (cat) return cat;
    return categories[0]?.key ?? "";
  }, [cat, categories]);

  const isFaq = type === "faq";

  // Stream a full trilingual draft from the local model; the modal previews it and
  // applyDraft commits it. Reports tokens for the live view; throws on failure.
  async function aiGenerate(
    topic: string,
    report: (chunk: AIStreamChunk) => void,
    signal: AbortSignal,
  ): Promise<SupportDraft> {
    const ai = useAISettingsStore.getState();
    const res = await fetch(aiUrl("ai-draft"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      signal,
      body: JSON.stringify({
        topic,
        type,
        category: catKey,
        audience: roles,
        baseUrl: activeBaseUrl(ai),
        model: ai.model,
        temperature: ai.temperature,
        maxTokens: ai.maxTokens,
        ttl: ai.ttl,
      }),
    });
    if (!res.ok || !res.body) {
      const detail = await res.json().catch(() => null);
      throw new Error(detail?.error ?? `Generation failed (${res.status}).`);
    }

    // Read the NDJSON stream: {type:"reasoning"|"content"|"done"|"error", …}.
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let content = "";
    let streamError: string | null = null;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.trim()) continue;
        const msg = JSON.parse(line) as { type: string; text?: string; message?: string };
        if (msg.type === "reasoning") report({ reasoning: msg.text });
        else if (msg.type === "content") {
          content += msg.text ?? "";
          report({ content: msg.text });
        } else if (msg.type === "error") streamError = msg.message ?? "Generation failed";
      }
    }
    if (streamError) throw new Error(streamError);

    return normalizeSupportDraft(parseDraftJSON(content));
  }

  // Commit a reviewed draft into the form (called from the modal's Apply).
  function applyDraft(draft: SupportDraft) {
    setTitle({ en: draft.en.title, fr: draft.fr.title, ar: draft.ar.title });
    setBody({ en: draft.en.body, fr: draft.fr.body, ar: draft.ar.body });
    setError(null);
  }

  // Trilingual title + body preview shown in the AI modal before applying.
  function renderDraftPreview(draft: SupportDraft) {
    const langs: [Lang, string][] = [
      ["en", "EN"],
      ["fr", "FR"],
      ["ar", "AR"],
    ];
    return (
      <div className="space-y-2.5">
        {langs.map(([l, code]) => {
          const c = draft[l];
          if (!c?.title && !c?.body) return null;
          const plain = c.body.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
          return (
            <div key={l} dir={dirFor(l)} className="rounded-lg border border-border bg-card p-2.5">
              <div className="mb-1 text-[10px] font-bold uppercase tracking-wide text-subtext">{code}</div>
              <div className="text-[13px] font-bold text-text">{c.title}</div>
              {plain && <div className="mt-0.5 text-xs text-subtext line-clamp-3">{plain}</div>}
            </div>
          );
        })}
      </div>
    );
  }

  function setFieldVal(field: "title" | "body", value: string) {
    if (field === "title") setTitle((o) => ({ ...o, [lang]: value }));
    else setBody((o) => ({ ...o, [lang]: value }));
  }

  // Inline "enhance": rewrite the active language's title / body in place. A
  // total-timeout + abort guarantees the spinner can't hang; a second click on a
  // busy field cancels. The article body streams as HTML and is set once at the
  // end; titles and FAQ answers (plain text) stream live into their inputs.
  async function enhance(field: "title" | "body") {
    if (enhancing === field) {
      enhanceCtrl.current?.abort("user");
      return;
    }
    if (enhancing) return;
    const src = field === "title" ? title : body;
    const current = src[lang]?.trim();
    if (!current) return;

    setEnhanceErr(null);
    setEnhancing(field);
    const isHtmlBody = field === "body" && !isFaq; // only the article body is HTML
    const collapse = field === "title"; // titles are single-line
    const shape = (s: string) =>
      collapse ? (s.split(/\r?\n/).map((l) => l.trim()).find(Boolean) ?? s.trim()) : s.trim();
    const ctrl = new AbortController();
    enhanceCtrl.current = ctrl;
    const timer = setTimeout(() => ctrl.abort("timeout"), 120_000);
    const ai = useAISettingsStore.getState();
    try {
      const result = await streamEnhance({
        url: aiUrl("ai-enhance"),
        body: {
          text: current,
          field,
          type,
          lang,
          category: catKey,
          audience: roles,
          baseUrl: activeBaseUrl(ai),
          model: ai.model,
          temperature: ai.temperature,
          maxTokens: ai.maxTokens,
          ttl: ai.ttl,
        },
        isHtml: isHtmlBody,
        credentials: "include",
        onLive: isHtmlBody ? () => {} : (text) => setFieldVal(field, shape(text)),
        signal: ctrl.signal,
      });
      if (result) {
        setFieldVal(field, shape(result));
      } else {
        setFieldVal(field, current);
        setEnhanceErr({ field, msg: t("art.enhance_empty") });
      }
    } catch (e) {
      setFieldVal(field, current); // restore the original on failure
      if (ctrl.signal.reason !== "user") {
        const msg =
          ctrl.signal.reason === "timeout"
            ? t("art.enhance_timeout")
            : e instanceof Error
              ? e.message
              : t("art.enhance_failed");
        setEnhanceErr({ field, msg });
      }
    } finally {
      clearTimeout(timer);
      enhanceCtrl.current = null;
      setEnhancing(null);
    }
  }

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

  return (
    <>
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-5 items-start">
      <Card
        title={isEdit ? t("art.edit") : t("art.new")}
        description={isEdit ? t("art.edit_desc") : t("art.new_desc")}
        action={
          <Button icon="sparkles" size="sm" onClick={() => setAiOpen(true)}>
            {t("art.ai.title")}
          </Button>
        }
      >
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
          <div className="relative" dir={dirFor(lang)}>
            <input
              className={`${fInput} pe-10`}
              dir={dirFor(lang)}
              value={title[lang]}
              onChange={(e) => setTitle((o) => ({ ...o, [lang]: e.target.value }))}
              placeholder={isFaq ? t("art.question_ph") : t("art.title_ph")}
            />
            <EnhanceButton
              busy={enhancing === "title"}
              disabled={enhancing ? enhancing !== "title" : !title[lang]?.trim()}
              label={enhancing === "title" ? td("cancel") : t("art.enhance")}
              onClick={() => enhance("title")}
              className="top-1/2 -translate-y-1/2"
            />
          </div>
          {enhanceErr?.field === "title" && (
            <p className="text-danger text-xs mt-1.5">{enhanceErr.msg}</p>
          )}
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
            <>
              <div className="relative" dir={dirFor(lang)}>
                <textarea
                  className={`${fInput} min-h-40 leading-relaxed resize-y pe-10`}
                  dir={dirFor(lang)}
                  value={body[lang]}
                  onChange={(e) => setBody((o) => ({ ...o, [lang]: e.target.value }))}
                  placeholder={t("art.answer_ph")}
                />
                <EnhanceButton
                  busy={enhancing === "body"}
                  disabled={enhancing ? enhancing !== "body" : !body[lang]?.trim()}
                  label={enhancing === "body" ? td("cancel") : t("art.enhance")}
                  onClick={() => enhance("body")}
                  className="bottom-2.5"
                />
              </div>
              {enhanceErr?.field === "body" && (
                <p className="text-danger text-xs mt-1.5">{enhanceErr.msg}</p>
              )}
            </>
          ) : (
            <>
              {/* key={lang} gives each language its own editor instance + undo history. */}
              <RichEditor
                key={lang}
                value={body[lang]}
                onChange={(html) => setBody((o) => ({ ...o, [lang]: html }))}
                dir={dirFor(lang)}
                placeholder={t("art.body_ph")}
                onEnhance={() => enhance("body")}
                enhancing={enhancing === "body"}
                enhanceDisabled={enhancing !== null && enhancing !== "body"}
                enhanceLabel={t("art.enhance")}
              />
              {enhanceErr?.field === "body" && (
                <p className="text-danger text-xs mt-1.5">{enhanceErr.msg}</p>
              )}
            </>
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

      <AIGenerateModal<SupportDraft>
        open={aiOpen}
        onClose={() => setAiOpen(false)}
        title={t("art.ai.title")}
        description={t("art.ai.desc")}
        placeholder={isFaq ? t("art.ai.placeholder_faq") : t("art.ai.placeholder")}
        buttonLabel={t("art.ai.button")}
        applyLabel={t("art.ai.apply")}
        regenerateLabel={t("art.ai.regenerate")}
        stopLabel={t("art.ai.stop")}
        reasoningLabel={t("art.ai.thinking")}
        draftingLabel={t("art.ai.drafting")}
        onGenerate={aiGenerate}
        onApply={applyDraft}
        renderResult={renderDraftPreview}
      />
    </>
  );
}
