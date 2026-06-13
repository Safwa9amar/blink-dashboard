// AI draft generation for Blink notifications — the prompt + tolerant normalizer
// handed to the shared LM Studio client (src/lib/ai). Pure data/strings (no
// server-only code), so it's safe to import from the streaming route. The
// reusable client + the <AIGenerateModal> card supply the plumbing; this file is
// the notifications-specific brief. Mirrors src/features/news/ai.ts.

import type { ChatMessage } from "@/lib/ai";
import type { Lang } from "@/components/ui";
import { NTYPE_KEYS, NTYPES, N_ROLES } from "./data";

// One language's notification copy — the two fields the composer fills.
export interface NotifContent {
  title: string;
  message: string;
}

// What the model returns: a trilingual notification plus a suggested type.
export interface NotifDraft {
  type: string; // one of NTYPE_KEYS
  en: NotifContent;
  fr: NotifContent;
  ar: NotifContent;
}

// Optional context from the compose form so the draft aligns with the operator's
// current selections.
export interface NotifDraftRequest {
  topic: string;
  type?: string;
  audience?: string[];
}

// Human-readable "key — Label" list so the model knows the allowed types.
const TYPE_LIST = NTYPE_KEYS.map((k) => `${k} (${NTYPES[k].label})`).join(", ");

const SYSTEM = `You are the messaging assistant for Blink, a multi-service delivery super-app for the Algerian market (currency is Algerian Dinar, written "Da"). You write short push / in-app notifications aimed at customers, riders, merchants and agents.

Write each notification in THREE languages: English (en), French (fr) and Arabic (ar). The Arabic must be natural Modern Standard Arabic (it renders right-to-left). Do not transliterate — write idiomatic copy in each language, not a literal word-for-word translation.

For every language produce:
- title: a punchy notification title (~6 words max, no trailing period)
- message: a single short sentence (push-friendly, under ~140 characters)

Also pick the single best "type" key from this allowed list: ${TYPE_LIST}.
Voice: energetic, casual, Title Case for the title. You may use the placeholders {name}, {promo} and {amount} where natural.

Respond with ONLY this exact JSON object — no markdown, no commentary, no arrays:
{
  "type": "<one of: ${NTYPE_KEYS.join(", ")}>",
  "en": { "title": "...", "message": "..." },
  "fr": { "title": "...", "message": "..." },
  "ar": { "title": "...", "message": "..." }
}
Use exactly the top-level keys "type", "en", "fr", "ar". Do NOT wrap the languages in an array or use any other key names.`;

// Builds the chat messages for one draft request, weaving in the form's context.
export function notifDraftMessages(req: NotifDraftRequest): ChatMessage[] {
  const lines = [`Notification brief: ${req.topic}`];
  if (req.type && NTYPE_KEYS.includes(req.type)) {
    lines.push(`Preferred type: ${req.type} (use it unless a better fit is obvious).`);
  }
  const audience = (req.audience ?? []).filter((r) => N_ROLES.includes(r) && r !== "All");
  if (audience.length) {
    lines.push(`Target audience: ${audience.join(", ")} — tailor the angle to them.`);
  }
  return [
    { role: "system", content: SYSTEM },
    { role: "user", content: lines.join("\n") },
  ];
}

// ─── Single-field enhancement ────────────────────────────────────────
// Rewrites ONE already-written field (title or message) in place, in the same
// language, returning plain text (no JSON) — the inline "enhance" buttons.

export type NotifField = "title" | "message";

const LANG_NAME: Record<Lang, string> = {
  en: "English",
  fr: "French",
  ar: "Arabic (Modern Standard Arabic, right-to-left)",
};

export interface EnhanceRequest {
  text: string;
  field: NotifField;
  lang: Lang;
  type?: string;
  audience?: string[];
}

export function enhanceMessages(req: EnhanceRequest): ChatMessage[] {
  const langName = LANG_NAME[req.lang] ?? "English";
  const constraint =
    req.field === "title"
      ? "It is a notification TITLE: punchy, ~6 words max, Title Case, no trailing period."
      : "It is a notification MESSAGE: a single short sentence, push-friendly, under ~140 characters.";

  const ctx: string[] = [];
  if (req.type && NTYPE_KEYS.includes(req.type)) {
    ctx.push(`Notification type: ${req.type} (${NTYPES[req.type].label}).`);
  }
  const audience = (req.audience ?? []).filter((r) => N_ROLES.includes(r) && r !== "All");
  if (audience.length) ctx.push(`Audience: ${audience.join(", ")}.`);

  const system = `You are a copy editor for Blink, a multi-service delivery super-app for the Algerian market (currency "Da"). Improve the notification copy you are given.

Rules:
- Write the result in ${langName} — the SAME language as the input. Do not translate.
- Keep the original meaning and any placeholders like {name}, {promo}, {amount}.
- Make it clearer, tighter and more engaging. Voice: energetic, casual, on-brand.
- ${constraint}
${ctx.length ? `\nContext: ${ctx.join(" ")}` : ""}

Return ONLY the improved text — no quotes, no markdown, no explanation, no alternatives, no preamble.`;

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
// any of those into the NotifDraft the form expects. Throws if no content found.

const LANG_ALIASES: Record<Lang, string[]> = {
  en: ["en", "eng", "english", "anglais"],
  fr: ["fr", "fra", "french", "francais", "français"],
  ar: ["ar", "ara", "arabic", "arabe"],
};

const str = (v: unknown): string => (typeof v === "string" ? v : "");

function toContent(v: unknown): NotifContent | null {
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  const title = str(o.title ?? o.headline ?? o.heading);
  const message = str(o.message ?? o.body ?? o.text ?? o.description ?? o.content);
  return title || message ? { title, message } : null;
}

function langOf(v: unknown): Lang | null {
  const s = str(v).toLowerCase().trim();
  for (const [lang, aliases] of Object.entries(LANG_ALIASES) as [Lang, string[]][]) {
    if (aliases.includes(s)) return lang;
  }
  return null;
}

export function normalizeNotifDraft(raw: unknown): NotifDraft {
  const root = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const found: Partial<Record<Lang, NotifContent>> = {};

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
      const untagged: NotifContent[] = [];
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

  const empty: NotifContent = { title: "", message: "" };
  const rawType = str(root.type ?? root.notification_type ?? root.kind);
  return {
    type: NTYPE_KEYS.includes(rawType) ? rawType : "",
    en: found.en ?? empty,
    fr: found.fr ?? empty,
    ar: found.ar ?? empty,
  };
}
