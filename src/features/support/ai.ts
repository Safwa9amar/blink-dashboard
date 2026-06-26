// AI draft + enhance briefs for Support help content (articles & FAQs) — the
// prompts + chat-message builders handed to the shared LM Studio client
// (src/lib/ai). Pure data/strings (only TYPE imports), so it's safe to import
// from both the route handlers and the client compose form. The reusable
// <AIGenerateModal> card + the streaming routes supply the plumbing; this file
// is the support-specific brief, mirroring src/features/news/ai.ts.

import type { ChatMessage } from "@/lib/ai";
import type { Lang } from "@/components/ui";
import { ROLES } from "./data";
import type { SupportArticleContent, SupportArticleType } from "./types";

// What the model returns: a trilingual title + body. For an "article" the body is
// HTML; for a "faq" it's a short plain-text answer.
export interface SupportDraft {
  en: SupportArticleContent;
  fr: SupportArticleContent;
  ar: SupportArticleContent;
}

export interface SupportDraftRequest {
  topic: string;
  type: SupportArticleType;
  category?: string;
  audience?: string[];
}

// Allowed HTML for an article body — must match what the RichEditor (TipTap) renders.
const BODY_TAGS = "<p>, <h2>, <h3>, <strong>, <em>, <ul>, <ol>, <li>, <blockquote>";

// Targetable roles (the audience chips, minus the catch-all "All").
const ROLE_NAMES = ROLES.filter((r) => r !== "All");

const INTRO = `You are the help-center editor for Blink, a multi-service delivery super-app for the Algerian market (currency is the Algerian Dinar, written "Da"). You write support content for customers, riders, merchants and agents.

Write the content in THREE languages: English (en), French (fr) and Arabic (ar). The Arabic must be natural Modern Standard Arabic (it renders right-to-left). Write idiomatic copy in each language — not a literal word-for-word translation.`;

function draftSystem(type: SupportArticleType): string {
  const perLang =
    type === "faq"
      ? `For every language produce:
- title: the question, phrased the way a user would actually ask it (end it with "?").
- body: a short, direct answer in PLAIN TEXT (no HTML, no markdown) — 2–4 sentences.`
      : `For every language produce:
- title: a clear, specific help-article headline (~10 words, no trailing period).
- body: the full article as valid HTML using ONLY these tags: ${BODY_TAGS}. Keep it concise and scannable — 2–4 short paragraphs, with a heading and a bulleted or numbered list of steps where it helps.`;

  const shape =
    type === "faq"
      ? `{
  "en": { "title": "...", "body": "..." },
  "fr": { "title": "...", "body": "..." },
  "ar": { "title": "...", "body": "..." }
}`
      : `{
  "en": { "title": "...", "body": "<p>...</p>" },
  "fr": { "title": "...", "body": "<p>...</p>" },
  "ar": { "title": "...", "body": "<p>...</p>" }
}`;

  return `${INTRO}

${perLang}

Voice: clear, friendly and practical. Be accurate — never invent Blink features, fees or policies.

Respond with ONLY this exact JSON object — no markdown, no commentary, no arrays:
${shape}
Use exactly the top-level keys "en", "fr", "ar". Do NOT wrap the languages in an array or use any other key names.`;
}

// Builds the chat messages for one draft request, weaving in the form's context.
export function supportDraftMessages(req: SupportDraftRequest): ChatMessage[] {
  const lines = [
    `Content type: ${req.type === "faq" ? "FAQ (question + short answer)" : "Help article"}.`,
    `Topic / brief: ${req.topic}`,
  ];
  if (req.category?.trim()) lines.push(`Category: ${req.category}.`);
  const audience = (req.audience ?? []).filter((r) => r === "All" || ROLE_NAMES.includes(r));
  if (audience.length) lines.push(`Audience: ${audience.join(", ")} — tailor it to them.`);
  return [
    { role: "system", content: draftSystem(req.type) },
    { role: "user", content: lines.join("\n") },
  ];
}

// ─── Single-field enhancement ────────────────────────────────────────
// Rewrites ONE already-written field (title / body) in place, in the same
// language — the inline "enhance" buttons. Returns plain text (HTML for an
// article body). No JSON wrapper.

export type SupportField = "title" | "body";

const LANG_NAME: Record<Lang, string> = {
  en: "English",
  fr: "French",
  ar: "Arabic (Modern Standard Arabic, right-to-left)",
};

export interface SupportEnhanceRequest {
  text: string;
  field: SupportField;
  type: SupportArticleType;
  lang: Lang;
  category?: string;
  audience?: string[];
}

export function supportEnhanceMessages(req: SupportEnhanceRequest): ChatMessage[] {
  const langName = LANG_NAME[req.lang] ?? "English";
  const isFaq = req.type === "faq";
  const constraint =
    req.field === "title"
      ? isFaq
        ? "It is an FAQ question — phrase it the way a user would ask, ending with a question mark. Return plain text only."
        : "It is a help-article title: clear, specific, ~10 words max, no trailing period. Return plain text only."
      : isFaq
        ? "It is a short FAQ answer in PLAIN TEXT — keep it to 2–4 direct sentences, no HTML, no markdown. Return plain text only."
        : `It is the article body, written as HTML using ONLY these tags: ${BODY_TAGS}. Keep (and improve) that HTML structure — concise paragraphs, a heading and a list of steps where they help. Return ONLY the HTML.`;

  const ctx: string[] = [];
  if (req.category?.trim()) ctx.push(`Category: ${req.category}.`);
  const audience = (req.audience ?? []).filter((r) => r === "All" || ROLE_NAMES.includes(r));
  if (audience.length) ctx.push(`Audience: ${audience.join(", ")}.`);

  const wantsHtml = req.field === "body" && !isFaq;
  const system = `You are the help-center editor for Blink, a multi-service delivery super-app for the Algerian market (currency "Da"). Improve the support copy you are given.

Rules:
- Write the result in ${langName} — the SAME language as the input. Do not translate.
- Keep the original meaning. Make it clearer, more accurate and easier to follow. Voice: clear, friendly, practical.
- ${constraint}
${ctx.length ? `\nContext: ${ctx.join(" ")}` : ""}

Return ONLY the improved ${wantsHtml ? "HTML" : "text"} — no quotes, no markdown fences, no explanation, no preamble.`;

  return [
    { role: "system", content: system },
    { role: "user", content: req.text },
  ];
}

// ─── Tolerant draft normalization ────────────────────────────────────
// Without a JSON-schema constraint (which breaks reasoning models — see the route
// handler), the model sometimes returns the trilingual content in a different
// shape: keyed `english`/`fr`/`ara`, nested under `languages`/`translations`, or
// as an array (tagged with a `lang` field, or just ordered en→fr→ar). This coerces
// any of those into the SupportDraft the form expects. Throws if no content found.

const LANG_ALIASES: Record<Lang, string[]> = {
  en: ["en", "eng", "english", "anglais"],
  fr: ["fr", "fra", "french", "francais", "français"],
  ar: ["ar", "ara", "arabic", "arabe"],
};

const str = (v: unknown): string => (typeof v === "string" ? v : "");

function toContent(v: unknown): SupportArticleContent | null {
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  const title = str(o.title ?? o.question ?? o.heading ?? o.headline);
  const body = str(o.body ?? o.answer ?? o.content ?? o.html ?? o.text);
  return title || body ? { title, body } : null;
}

function langOf(v: unknown): Lang | null {
  const s = str(v).toLowerCase().trim();
  for (const [lang, aliases] of Object.entries(LANG_ALIASES) as [Lang, string[]][]) {
    if (aliases.includes(s)) return lang;
  }
  return null;
}

export function normalizeSupportDraft(raw: unknown): SupportDraft {
  const root = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const found: Partial<Record<Lang, SupportArticleContent>> = {};

  // Look at the root and any common wrapper containers.
  const containers: Record<string, unknown>[] = [root];
  for (const key of ["languages", "translations", "content", "contents", "data", "result"]) {
    const c = root[key];
    if (c && typeof c === "object") containers.push(c as Record<string, unknown>);
  }

  for (const container of containers) {
    // a) keyed by language alias: { en: {...}, french: {...}, ... }
    for (const [lang, aliases] of Object.entries(LANG_ALIASES) as [Lang, string[]][]) {
      if (found[lang]) continue;
      for (const alias of aliases) {
        const c = toContent(container[alias]);
        if (c) {
          found[lang] = c;
          break;
        }
      }
    }
    // b) arrays of content — tagged with a lang field, else taken in en→fr→ar order.
    for (const val of Object.values(container)) {
      if (!Array.isArray(val)) continue;
      const untagged: SupportArticleContent[] = [];
      for (const item of val) {
        const c = toContent(item);
        if (!c) continue;
        const o = item as Record<string, unknown>;
        const lang = langOf(o.lang ?? o.language ?? o.locale ?? o.code);
        if (lang) {
          if (!found[lang]) found[lang] = c;
        } else {
          untagged.push(c);
        }
      }
      for (const lang of ["en", "fr", "ar"] as Lang[]) {
        if (!found[lang] && untagged.length) found[lang] = untagged.shift()!;
      }
    }
  }

  if (!found.en && !found.fr && !found.ar) {
    throw new Error("The model returned an unexpected JSON shape — try again or switch model.");
  }

  const empty: SupportArticleContent = { title: "", body: "" };
  return { en: found.en ?? empty, fr: found.fr ?? empty, ar: found.ar ?? empty };
}
