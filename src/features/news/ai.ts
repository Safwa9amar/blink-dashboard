// AI draft generation for Blink News — the prompt + JSON Schema handed to the
// shared LM Studio client (src/lib/ai). Pure data/strings (no server-only code),
// so it's safe to import from the news Server Action. The reusable client + the
// <AIGenerate> card supply the plumbing; this file is the news-specific brief.

import type { ChatMessage, JSONSchemaSpec } from "@/lib/ai";
import type { Lang } from "@/components/ui";
import { N_CAT_NAMES, N_ROLES } from "./data";
import type { PostContent } from "./types";

// What the model returns: a full trilingual draft plus a suggested category & CTA.
export interface NewsDraft {
  category: string;
  cta: string;
  en: PostContent;
  fr: PostContent;
  ar: PostContent;
}

// Optional context from the compose form so the draft aligns with the operator's
// current selections.
export interface NewsDraftRequest {
  topic: string;
  category?: string;
  audience?: string[];
}

// Allowed HTML for the body — must match what the RichEditor (TipTap) renders.
const BODY_TAGS = "<p>, <h2>, <h3>, <strong>, <em>, <ul>, <ol>, <li>, <blockquote>";

const contentProps = {
  title: { type: "string", description: "Headline, ~8 words max, no trailing period." },
  sum: { type: "string", description: "One-sentence teaser shown on the news card." },
  body: { type: "string", description: `Full article as HTML using only ${BODY_TAGS}.` },
} as const;

const contentSchema = {
  type: "object",
  properties: contentProps,
  required: ["title", "sum", "body"],
  additionalProperties: false,
};

export const NEWS_DRAFT_SCHEMA: JSONSchemaSpec = {
  name: "blink_news_draft",
  schema: {
    type: "object",
    properties: {
      category: { type: "string", enum: N_CAT_NAMES },
      cta: { type: "string", description: "Short call-to-action button label, e.g. 'Learn more'." },
      en: contentSchema,
      fr: contentSchema,
      ar: contentSchema,
    },
    required: ["category", "cta", "en", "fr", "ar"],
    additionalProperties: false,
  },
};

const SYSTEM = `You are the editorial assistant for Blink, a multi-service delivery super-app for the Algerian market (currency is Algerian Dinar, written "Da"). You write in-app news cards aimed at customers, riders, merchants and agents.

Write each post in THREE languages: English (en), French (fr) and Arabic (ar). The Arabic must be natural Modern Standard Arabic (it renders right-to-left). Do not transliterate — write idiomatic copy in each language, not a literal word-for-word translation.

For every language produce:
- title: a punchy headline (~8 words, no trailing period)
- sum: a single-sentence teaser for the card
- body: the full article as valid HTML using ONLY these tags: ${BODY_TAGS}. Keep it 2–4 short paragraphs; use a heading and a list where it helps.

Also pick the best "category" from the allowed list and a short "cta" button label.
Voice: energetic, casual, Title Case labels.

Respond with ONLY this exact JSON object — no markdown, no commentary, no arrays:
{
  "category": "<one of: ${N_CAT_NAMES.join(", ")}>",
  "cta": "<short button label>",
  "en": { "title": "...", "sum": "...", "body": "<p>...</p>" },
  "fr": { "title": "...", "sum": "...", "body": "<p>...</p>" },
  "ar": { "title": "...", "sum": "...", "body": "<p>...</p>" }
}
Use exactly the top-level keys "category", "cta", "en", "fr", "ar". Do NOT wrap the languages in an array or use any other key names.`;

// Builds the chat messages for one draft request, weaving in the form's context.
export function newsDraftMessages(req: NewsDraftRequest): ChatMessage[] {
  const lines = [`Topic / brief: ${req.topic}`];
  if (req.category && N_CAT_NAMES.includes(req.category)) {
    lines.push(`Preferred category: ${req.category} (use it unless a better fit is obvious).`);
  }
  const audience = (req.audience ?? []).filter((r) => N_ROLES.includes(r));
  if (audience.length) {
    lines.push(`Target audience: ${audience.join(", ")} — tailor the angle to them.`);
  }
  return [
    { role: "system", content: SYSTEM },
    { role: "user", content: lines.join("\n") },
  ];
}

// ─── Tolerant draft normalization ────────────────────────────────────
// Without a JSON-schema constraint (which breaks reasoning models — see the route
// handler), the model sometimes returns the trilingual content in a different
// shape: keyed `english`/`fr`/`ara`, nested under `languages`/`translations`, or
// as an array (tagged with a `lang` field, or just ordered en→fr→ar). This coerces
// any of those into the NewsDraft the form expects. Throws if no content is found.

const LANG_ALIASES: Record<Lang, string[]> = {
  en: ["en", "eng", "english", "anglais"],
  fr: ["fr", "fra", "french", "francais", "français"],
  ar: ["ar", "ara", "arabic", "arabe"],
};

const str = (v: unknown): string => (typeof v === "string" ? v : "");

function toContent(v: unknown): PostContent | null {
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  const title = str(o.title ?? o.headline ?? o.heading);
  const sum = str(o.sum ?? o.summary ?? o.teaser ?? o.subtitle ?? o.description);
  const body = str(o.body ?? o.content ?? o.html ?? o.article ?? o.text);
  return title || sum || body ? { title, sum, body } : null;
}

function langOf(v: unknown): Lang | null {
  const s = str(v).toLowerCase().trim();
  for (const [lang, aliases] of Object.entries(LANG_ALIASES) as [Lang, string[]][]) {
    if (aliases.includes(s)) return lang;
  }
  return null;
}

export function normalizeNewsDraft(raw: unknown): NewsDraft {
  const root = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const found: Partial<Record<Lang, PostContent>> = {};

  // Look at the root and any common wrapper containers.
  const containers: Record<string, unknown>[] = [root];
  for (const key of ["languages", "translations", "content", "contents", "posts", "data", "result"]) {
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
      const untagged: PostContent[] = [];
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

  const empty: PostContent = { title: "", sum: "", body: "" };
  return {
    category: str(root.category ?? root.cat ?? root.type),
    cta: str(root.cta ?? root.cta_label ?? root.call_to_action ?? root.button),
    en: found.en ?? empty,
    fr: found.fr ?? empty,
    ar: found.ar ?? empty,
  };
}
