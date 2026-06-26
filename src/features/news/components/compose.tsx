"use client";

import { useMemo, useRef, useState } from "react";
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
  AIGenerateModal,
  EnhanceButton,
  fInput,
  emptyLang,
  dirFor,
  toggleInList,
  type Lang,
  type AIStreamChunk,
  type LinkChoice,
} from "@/components/ui";
import { DeepLinkPickerModal } from "@/features/deep-links";
import { parseDraftJSON } from "@/lib/ai/parse";
import { streamEnhance } from "@/lib/ai/enhance-client";
import { normalizeNewsDraft, type NewsDraft } from "@/features/news";
import { N_CATS, N_CAT_NAMES, N_ROLES, N_ROLE_VARIANT, COVERS, primaryOf } from "../data";
import type { Post, PostStatus, PostContent } from "../types";
import { useNewsStore } from "../store";
import { useNewsSettingsStore } from "../settings-store";
import { createNewsUploadUrl } from "@/app/d/news/action";
import { useAISettingsStore, activeBaseUrl } from "@/features/settings";
import { createClient } from "@/lib/supabase/client";
import { CoverPick } from "./cover-pick";
import { ToggleRow } from "./toggle-row";
import { PostPreview, type PreviewData } from "./post-preview";

// A news AI route, at /d/news/<path>. On the dashboard subdomain the middleware
// rewrites /news/* → /d/news/*, but on a bare /d/... URL (local dev) the path
// already includes /d — pick the right prefix from the current location.
function aiUrl(path: string): string {
  const p = typeof window !== "undefined" ? window.location.pathname : "";
  const onD = p === "/d" || p.startsWith("/d/");
  return onD ? `/d/news/${path}` : `/news/${path}`;
}

// Uploads a cover / body image straight to Supabase Storage via a staff-gated
// signed URL (the file bytes bypass the server action — no body-size limit).
async function uploadImage(file: File): Promise<string> {
  const ext = file.name.split(".").pop() || "bin";
  const { path, token, error } = await createNewsUploadUrl(ext);
  if (error || !path || !token) throw new Error(error ?? "Upload failed");

  const supabase = createClient();
  const { error: upErr } = await supabase.storage
    .from("news")
    .uploadToSignedUrl(path, token, file, { contentType: file.type });
  if (upErr) throw new Error(upErr.message);

  return supabase.storage.from("news").getPublicUrl(path).data.publicUrl;
}

// Per-language values for one content field (title/sum/body), seeded from a post.
function langField(
  content: Partial<Record<Lang, PostContent>> | undefined,
  field: keyof PostContent
): Record<Lang, string> {
  const out = emptyLang();
  if (content)
    (["en", "fr", "ar"] as Lang[]).forEach((l) => {
      if (content[l]) out[l] = content[l]![field];
    });
  return out;
}

// Used for both composing a new post and editing an existing one (pass `initial`).
export function Compose({ initial, onCancel }: { initial?: Post; onCancel: () => void }) {
  const isEdit = !!initial;
  const t = useTranslations("news");
  const td = useTranslations("dash");
  const createPost = useNewsStore((s) => s.createPost);
  const updatePost = useNewsStore((s) => s.updatePost);
  const posts = useNewsStore((s) => s.posts);
  const maxBodyImages = useNewsSettingsStore((s) => s.maxBodyImages);
  const maxBodyLength = useNewsSettingsStore((s) => s.maxBodyLength);
  const scheduled = useMemo(
    () =>
      posts
        .filter((p) => p.status === "scheduled" && p.id !== initial?.id)
        .sort((a, b) => (a.scheduledAt ?? "").localeCompare(b.scheduledAt ?? "")),
    [posts, initial?.id]
  );

  const [lang, setLang] = useState<Lang>("en");
  const [title, setTitle] = useState(() => langField(initial?.content, "title"));
  const [sum, setSum] = useState(() => langField(initial?.content, "sum"));
  const [body, setBody] = useState(() => langField(initial?.content, "body"));
  const [cat, setCat] = useState(initial?.cat ?? "Network");
  const [cover, setCover] = useState(initial?.cover ?? COVERS[0]);
  const [roles, setRoles] = useState(initial?.roles ?? ["All"]);
  const [when, setWhen] = useState<"now" | "schedule">(
    initial?.status === "scheduled" ? "schedule" : "now"
  );
  const [scheduledAt, setScheduledAt] = useState(initial?.scheduledAt ?? "");
  const [expiresOn, setExpiresOn] = useState(!!initial?.expiresAt);
  const [expiresAt, setExpiresAt] = useState(initial?.expiresAt ?? "");
  const [pin, setPin] = useState(initial?.pin ?? false);
  const [push, setPush] = useState(initial?.push ?? true);
  const [cta, setCta] = useState(initial?.cta ?? "Learn more");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);

  // Deep-link picker for the body editor's Link button. `pickLink` opens the
  // modal and returns a promise the editor awaits; the modal handlers resolve it.
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkHref, setLinkHref] = useState("");
  const linkResolve = useRef<((c: LinkChoice | null) => void) | null>(null);

  function pickLink(current: string | null): Promise<LinkChoice | null> {
    setLinkHref(current ?? "");
    setLinkOpen(true);
    return new Promise((resolve) => {
      linkResolve.current = resolve;
    });
  }
  function onLinkPick(href: string, label?: string) {
    linkResolve.current?.({ href, text: label });
    linkResolve.current = null;
    setLinkOpen(false);
  }
  function cancelLink() {
    linkResolve.current?.(null);
    linkResolve.current = null;
    setLinkOpen(false);
  }
  const [limitError, setLimitError] = useState<string | null>(null);
  const [pending, setPending] = useState<PostStatus | null>(null);
  const catColor = N_CATS.find((c) => c.name === cat)?.color;

  // Stream a full trilingual draft from the local model and return the parsed
  // result (the modal previews it; applyDraft commits it). Reports tokens for the
  // live view; throws on failure so the modal surfaces the message.
  async function aiGenerate(
    topic: string,
    report: (chunk: AIStreamChunk) => void,
    signal: AbortSignal
  ): Promise<NewsDraft> {
    // Forward the operator's saved AI settings (model, temperature, length, TTL).
    const ai = useAISettingsStore.getState();
    const res = await fetch(aiUrl("ai-draft"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      signal,
      body: JSON.stringify({
        topic,
        category: cat,
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

    // Tolerant of shape drift (array / aliased keys) — see normalizeNewsDraft.
    return normalizeNewsDraft(parseDraftJSON(content));
  }

  // Commits a reviewed draft into the compose form (called from the modal's Apply).
  function applyDraft(draft: NewsDraft) {
    setTitle({ en: draft.en.title, fr: draft.fr.title, ar: draft.ar.title });
    setSum({ en: draft.en.sum, fr: draft.fr.sum, ar: draft.ar.sum });
    setBody({ en: draft.en.body, fr: draft.fr.body, ar: draft.ar.body });
    if (draft.category && N_CAT_NAMES.includes(draft.category)) setCat(draft.category);
    if (draft.cta?.trim()) setCta(draft.cta);
    setLimitError(null);
  }

  // Review preview shown in the AI modal — the trilingual title/summary + meta.
  function renderDraftPreview(draft: NewsDraft) {
    const langs: [Lang, string][] = [
      ["en", "EN"],
      ["fr", "FR"],
      ["ar", "AR"],
    ];
    return (
      <div className="space-y-2.5">
        <div className="flex flex-wrap gap-1.5">
          {draft.category && <Badge variant="info">{draft.category}</Badge>}
          {draft.cta && <Badge variant="primary">{draft.cta}</Badge>}
        </div>
        {langs.map(([l, code]) => {
          const c = draft[l];
          if (!c?.title && !c?.sum) return null;
          return (
            <div key={l} dir={dirFor(l)} className="rounded-lg border border-border bg-card p-2.5">
              <div className="mb-1 text-[10px] font-bold uppercase tracking-wide text-subtext">{code}</div>
              <div className="text-[13px] font-bold text-text">{c.title}</div>
              {c.sum && <div className="mt-0.5 text-xs text-subtext">{c.sum}</div>}
            </div>
          );
        })}
      </div>
    );
  }

  // Inline "enhance" buttons: rewrite the active language's title / summary /
  // body in place. `enhancing` tracks which field is busy. Title & summary stream
  // live into their inputs; the body (rich HTML) is set once at the end to avoid
  // re-parsing partial HTML in the editor on every token.
  const [enhancing, setEnhancing] = useState<null | "title" | "sum" | "body">(null);

  function setField(field: "title" | "sum" | "body", value: string) {
    const upd = (o: Record<Lang, string>) => ({ ...o, [lang]: value });
    if (field === "title") setTitle(upd);
    else if (field === "sum") setSum(upd);
    else setBody(upd);
  }

  // `enhanceErr` surfaces a per-field problem (e.g. a reasoning model that only
  // "thinks" and returns no answer). A total-timeout + abort guarantees the
  // spinner can never hang forever; title/summary also cancel on a second click.
  const [enhanceErr, setEnhanceErr] = useState<{ field: "title" | "sum" | "body"; msg: string } | null>(null);
  const enhanceCtrl = useRef<AbortController | null>(null);

  async function enhance(field: "title" | "sum" | "body") {
    if (enhancing === field) {
      enhanceCtrl.current?.abort("user"); // clicking the spinning button cancels
      return;
    }
    if (enhancing) return;
    const src = field === "title" ? title : field === "sum" ? sum : body;
    const current = src[lang]?.trim();
    if (!current) return;

    setEnhanceErr(null);
    setEnhancing(field);
    const isHtml = field === "body"; // body streams as HTML; set once at the end
    // Title & summary are single-line — if the model returns several variants,
    // keep the first non-empty line so they don't mash together in the input.
    const shape = (s: string) =>
      isHtml ? s : s.split(/\r?\n/).map((l) => l.trim()).find(Boolean) ?? s.trim();
    const ctrl = new AbortController();
    enhanceCtrl.current = ctrl;
    const timer = setTimeout(() => ctrl.abort("timeout"), 120_000);
    const ai = useAISettingsStore.getState();
    try {
      const result = await streamEnhance({
        url: aiUrl("ai-enhance"),
        body: {
          text: current,
          field: field === "title" ? "title" : field === "sum" ? "summary" : "body",
          lang,
          category: cat,
          audience: roles,
          baseUrl: activeBaseUrl(ai),
          model: ai.model,
          temperature: ai.temperature,
          maxTokens: ai.maxTokens,
          ttl: ai.ttl,
        },
        isHtml,
        credentials: "include",
        // Stream live into plain inputs; for the rich body, set once at the end
        // to avoid re-parsing partial HTML in the editor on every token.
        onLive: isHtml ? () => {} : (text) => setField(field, shape(text)),
        signal: ctrl.signal,
      });
      if (result) {
        setField(field, shape(result));
      } else {
        setField(field, current);
        setEnhanceErr({ field, msg: t("form.enhance_empty") });
      }
    } catch (e) {
      setField(field, current); // restore the original on failure
      if (ctrl.signal.reason !== "user") {
        const msg =
          ctrl.signal.reason === "timeout"
            ? t("form.enhance_timeout")
            : e instanceof Error
              ? e.message
              : t("form.enhance_failed");
        setEnhanceErr({ field, msg });
      }
    } finally {
      clearTimeout(timer);
      enhanceCtrl.current = null;
      setEnhancing(null);
    }
  }

  const draftContent: Partial<Record<Lang, PostContent>> = {
    en: { title: title.en, sum: sum.en, body: body.en },
    fr: { title: title.fr, sum: sum.fr, body: body.fr },
    ar: { title: title.ar, sum: sum.ar, body: body.ar },
  };
  const previewData: PreviewData = { cover, cat, cta, roles, content: draftContent, title: title.en, sum: sum.en };

  async function submit(status: PostStatus) {
    if (pending) return; // guard against double-submit

    // Required fields — every input must be filled to publish/schedule (drafts
    // may be saved incomplete). Jumps to the offending language tab.
    if (status !== "draft") {
      for (const l of ["en", "fr", "ar"] as Lang[]) {
        const code = l.toUpperCase();
        if (!title[l].trim()) {
          setLang(l);
          setLimitError(t("required.title", { lang: code }));
          return;
        }
        if (!sum[l].trim()) {
          setLang(l);
          setLimitError(t("required.summary", { lang: code }));
          return;
        }
        if (!(body[l] || "").replace(/<[^>]*>/g, "").trim()) {
          setLang(l);
          setLimitError(t("required.body", { lang: code }));
          return;
        }
      }
      if (roles.length === 0) {
        setLimitError(t("required.audience"));
        return;
      }
      if (!cta.trim()) {
        setLimitError(t("required.cta"));
        return;
      }
      // A scheduled post needs a real future time, or the publish cron can never
      // fire it (a null scheduled_at never matches, a past one fires instantly).
      if (status === "scheduled") {
        const at = new Date(scheduledAt);
        if (!scheduledAt || Number.isNaN(at.getTime()) || at.getTime() <= Date.now()) {
          setLimitError(t("required.schedule_future"));
          return;
        }
      }
    }

    // Enforce the editorial caps from Settings → News (per language body).
    for (const l of ["en", "fr", "ar"] as Lang[]) {
      const html = body[l] || "";
      const images = (html.match(/<img/gi) ?? []).length;
      if (images > maxBodyImages) {
        setLimitError(t("limits.error_images", { max: maxBodyImages }));
        return;
      }
      const textLen = html.replace(/<[^>]*>/g, "").trim().length;
      if (textLen > maxBodyLength) {
        setLimitError(t("limits.error_length", { max: maxBodyLength, lang: l.toUpperCase() }));
        return;
      }
    }
    setLimitError(null);

    const content: Partial<Record<Lang, PostContent>> = {};
    (["en", "fr", "ar"] as Lang[]).forEach((l) => {
      const hasBody = !!body[l] && body[l] !== "<p></p>";
      if (title[l].trim() || sum[l].trim() || hasBody) {
        content[l] = { title: title[l], sum: sum[l], body: body[l] };
      }
    });
    const fields = {
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
    };
    setPending(status);
    let res: { error: string | null };
    if (isEdit && initial) {
      // Carry the derived list-display title/sum so the optimistic UI stays fresh.
      const primary = primaryOf(content);
      res = await updatePost(initial.id, { ...fields, title: primary.title, sum: primary.sum });
    } else {
      res = await createPost(fields);
    }
    setPending(null);

    if (res.error) {
      setLimitError(res.error); // keep the form open so the author can retry
      return;
    }
    onCancel();
  }

  const langFilled = { en: !!title.en, fr: !!title.fr, ar: !!title.ar };
  const primaryAction = when === "schedule" ? "scheduled" : "published";

  return (
    <div className="space-y-5">
      {/* Studio header — identity + the creative AI action, always in reach. */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-soft-pink text-primary">
            <DashIcon name="newspaper" className="h-[22px] w-[22px]" />
          </span>
          <div>
            <h2 className="text-xl font-bold text-text">{isEdit ? t("form.edit") : t("form.compose")}</h2>
            <p className="text-[13px] text-subtext">{isEdit ? t("form.edit_desc") : t("form.compose_desc")}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" icon="eye" onClick={() => setPreviewOpen(true)}>
            {t("preview_modal.open")}
          </Button>
          <Button icon="sparkles" onClick={() => setAiOpen(true)}>
            {t("ai.title")}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-5 items-start">
        {/* ── Left: cover hero → writing canvas → targeting ── */}
        <div className="space-y-5">
          {/* Cover hero: the card's headline image, with the live title overlaid. */}
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            <div className="relative h-44 bg-muted bg-cover bg-center" style={{ backgroundImage: `url(${cover})` }}>
              <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
              <span
                className="absolute start-3 top-3 rounded-full bg-white/95 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wide shadow-sm"
                style={{ color: catColor }}
              >
                {cat}
              </span>
              <div className="absolute inset-x-4 bottom-3 text-white" dir={dirFor(lang)}>
                <div className="line-clamp-2 text-lg font-bold leading-tight drop-shadow-md">
                  {title[lang] || t("preview.headline")}
                </div>
              </div>
            </div>
            <div className="p-4">
              <span className="text-[12.5px] font-bold text-text">{t("form.cover")}</span>
              <CoverPick covers={COVERS} value={cover} onChange={setCover} uploadLabel={t("form.upload")} onUpload={uploadImage} />
            </div>
          </div>

          {/* Writing canvas: language switch + big headline + subtitle + body. */}
          <Card>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-base font-bold text-text">{t("form.write")}</h3>
              <LangTabs active={lang} onChange={setLang} filled={langFilled} />
            </div>

            <FormRow label={t("form.title")}>
              <div className="relative" dir={dirFor(lang)}>
                <input
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 pe-11 text-[15px] font-semibold text-text outline-none transition-colors focus:border-primary placeholder:font-normal placeholder:text-subtext/60"
                  dir={dirFor(lang)}
                  value={title[lang]}
                  onChange={(e) => setTitle((o) => ({ ...o, [lang]: e.target.value }))}
                  placeholder={t("form.title_ph")}
                />
                <EnhanceButton
                  busy={enhancing === "title"}
                  disabled={enhancing ? enhancing !== "title" : !title[lang]?.trim()}
                  label={enhancing === "title" ? td("cancel") : t("form.enhance")}
                  onClick={() => enhance("title")}
                  className="top-1/2 -translate-y-1/2"
                />
              </div>
              {enhanceErr?.field === "title" && (
                <p className="text-danger text-xs mt-1.5">{enhanceErr.msg}</p>
              )}
            </FormRow>
            <FormRow label={t("form.summary")}>
              <div className="relative" dir={dirFor(lang)}>
                <input
                  className={`${fInput} pe-10`}
                  dir={dirFor(lang)}
                  value={sum[lang]}
                  onChange={(e) => setSum((o) => ({ ...o, [lang]: e.target.value }))}
                  placeholder={t("form.summary_ph")}
                />
                <EnhanceButton
                  busy={enhancing === "sum"}
                  disabled={enhancing ? enhancing !== "sum" : !sum[lang]?.trim()}
                  label={enhancing === "sum" ? td("cancel") : t("form.enhance")}
                  onClick={() => enhance("sum")}
                  className="top-1/2 -translate-y-1/2"
                />
              </div>
              {enhanceErr?.field === "sum" && (
                <p className="text-danger text-xs mt-1.5">{enhanceErr.msg}</p>
              )}
            </FormRow>

            <div className="mb-4 h-px bg-border" />

            {/* key={lang} gives each language its own editor instance + undo history,
                so an undo in one language can never pull another language's content in. */}
            <RichEditor
              key={lang}
              value={body[lang]}
              onChange={(html) => setBody((o) => ({ ...o, [lang]: html }))}
              dir={dirFor(lang)}
              placeholder={t("form.body_ph")}
              onUploadImage={uploadImage}
              maxImages={maxBodyImages}
              maxLength={maxBodyLength}
              onEnhance={() => enhance("body")}
              enhancing={enhancing === "body"}
              enhanceDisabled={enhancing !== null && enhancing !== "body"}
              enhanceLabel={t("form.enhance")}
              onPickLink={pickLink}
              linkLabel={t("form.link")}
            />
            {enhanceErr?.field === "body" && (
              <p className="text-danger text-xs mt-1.5">{enhanceErr.msg}</p>
            )}

            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
              <label className="text-[12.5px] font-bold text-text sm:w-28 sm:shrink-0">{t("form.cta")}</label>
              <input className={fInput} value={cta} onChange={(e) => setCta(e.target.value)} placeholder={t("form.cta_ph")} />
            </div>
          </Card>

          {/* Targeting: category as colour-dot pills + audience chips. */}
          <Card title={t("form.targeting")}>
            <FormRow label={t("form.category")}>
              <div className="flex flex-wrap gap-2">
                {N_CATS.map((c) => {
                  const on = cat === c.name;
                  return (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() => setCat(c.name)}
                      className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-[13px] font-bold transition-colors ${
                        on ? "border-primary bg-soft-pink text-primary" : "border-border bg-background text-subtext hover:border-subtext"
                      }`}
                    >
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: c.color }} />
                      {c.name}
                    </button>
                  );
                })}
              </div>
            </FormRow>
            <FormRow label={t("form.audience")} hint={t("form.audience_hint")} className="!mb-0">
              <RoleChips roles={N_ROLES} selected={roles} onToggle={(r) => setRoles((rs) => toggleInList(rs, r))} />
            </FormRow>
          </Card>
        </div>

        {/* ── Right: sticky preview + publish + upcoming ── */}
        <div className="space-y-5 lg:sticky lg:top-4 self-start">
          <Card title={td("live_preview")}>
            <div className="mx-auto w-[248px] overflow-hidden rounded-[26px] border-[6px] border-[#15131f] bg-background shadow-2xl">
              <div className="relative h-[120px] bg-muted bg-cover bg-center" style={{ backgroundImage: `url(${cover})` }}>
                <span
                  className="absolute start-2.5 top-2.5 rounded-full bg-white/90 px-2.5 py-[3px] text-[9px] font-extrabold uppercase tracking-wide"
                  style={{ color: catColor }}
                >
                  {cat}
                </span>
              </div>
              <div className="px-[15px] pb-[18px] pt-3.5" dir={dirFor(lang)}>
                <h4 className="text-[15px] font-bold leading-tight text-text">{title[lang] || t("preview.headline")}</h4>
                <p className="mt-[7px] text-xs leading-normal text-subtext">{sum[lang] || t("preview.summary")}</p>
                <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2.5 text-xs font-bold text-white">
                  {cta || t("form.cta_ph")}
                </span>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap justify-center gap-1.5">
              {roles.map((r) => (
                <Badge key={r} variant={N_ROLE_VARIANT[r]}>
                  {r}
                </Badge>
              ))}
              {push && <Badge variant="primary">{t("preview.push_on")}</Badge>}
              {pin && <Badge variant="warning">{t("preview.pinned")}</Badge>}
            </div>
          </Card>

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
            {limitError && (
              <p className="mt-3 rounded-lg border border-danger/30 bg-danger-light px-3 py-2 text-xs text-danger">
                {limitError}
              </p>
            )}
            <Button
              onClick={() => submit(primaryAction)}
              loading={pending === primaryAction}
              disabled={pending !== null}
              className="mt-4 w-full"
            >
              {isEdit ? td("save") : when === "schedule" ? td("schedule") : td("publish")}
            </Button>
            <div className="mt-2.5 flex gap-2.5">
              <Button variant="secondary" onClick={onCancel} disabled={pending !== null} className="flex-1">
                {td("cancel")}
              </Button>
              <Button
                variant="secondary"
                onClick={() => submit("draft")}
                loading={pending === "draft"}
                disabled={pending !== null}
                className="flex-1"
              >
                {t("form.save_draft")}
              </Button>
            </div>
          </Card>

          {scheduled.length > 0 && (
            <Card title={t("form.upcoming")} description={t("form.upcoming_desc")}>
              <div className="space-y-2.5">
                {scheduled.map((p) => (
                  <div key={p.id} className="flex items-center gap-3 rounded-xl border border-border bg-background p-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-info-light text-info">
                      <DashIcon name="calendar2" className="h-[18px] w-[18px]" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13px] font-bold text-text">{p.title}</div>
                      <div className="text-[11px] text-subtext">{p.cat}</div>
                    </div>
                    <Badge variant="info">{p.date}</Badge>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>

      <PostPreview open={previewOpen} onClose={() => setPreviewOpen(false)} data={previewData} lang={lang} />

      {linkOpen && (
        <DeepLinkPickerModal
          open
          onClose={cancelLink}
          onPick={onLinkPick}
          audienceRoles={roles}
          initialHref={linkHref}
        />
      )}

      <AIGenerateModal<NewsDraft>
        open={aiOpen}
        onClose={() => setAiOpen(false)}
        title={t("ai.title")}
        description={t("ai.desc")}
        placeholder={t("ai.placeholder")}
        buttonLabel={t("ai.button")}
        applyLabel={t("ai.apply")}
        regenerateLabel={t("ai.regenerate")}
        stopLabel={t("ai.stop")}
        reasoningLabel={t("ai.thinking")}
        draftingLabel={t("ai.drafting")}
        onGenerate={aiGenerate}
        onApply={applyDraft}
        renderResult={renderDraftPreview}
      />
    </div>
  );
}
