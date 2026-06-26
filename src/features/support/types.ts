// Domain types for the support feature.
export interface Ticket {
  id: string;
  subj: string;
  who: string;
  role: string;
  cat: string;
  prio: string;
  status: string;
  age: string;
}

export interface Article {
  title: string;
  cat: string;
  roles: string[];
  status: string;
  views: number;
  updated: string;
}

// A single message in a ticket thread or live chat — human-agent reply, AI-bot
// reply, customer message, or a system event line (escalated / joined / resolved).
export interface Message {
  from: "customer" | "agent" | "bot" | "note";
  who: string;
  text: string;
  time: string;
  attachmentUrl?: string | null;
  // For `from: "note"` system events — drives the friendly localized label.
  noteType?: "escalated" | "assigned" | "resolved";
  agentName?: string | null;
}

// A live-chat / omnichannel inbox conversation.
export interface Chat {
  id: string;
  who: string;
  role: string;
  channel: string;
  preview: string;
  unread: number;
  wait: string;
  status: "active" | "waiting" | "idle";
}

// A support agent in the roster.
export interface Agent {
  name: string;
  team: string;
  status: "online" | "away" | "offline";
  load: number;
  cap: number;
  csat: number;
  frt: string;
  resolved: number;
}

// A single CSAT survey response.
export interface CsatResponse {
  who: string;
  score: number;
  comment: string;
  agent: string;
  cat: string;
  time: string;
}

// An SLA policy mapping a priority to first-response / resolution targets.
export interface SlaPolicy {
  name: string;
  prio: string;
  frt: string;
  resolution: string;
  met: number;
  breached: number;
}

// An automation / routing rule: when → conditions → actions.
export interface Rule {
  name: string;
  when: string;
  conditions: string[];
  actions: string[];
  runs: number;
  on: boolean;
}

export type TFn = (k: string, v?: Record<string, string | number>) => string;

// ─── Knowledge Base / FAQ DB rows (mirror blink-server src/db/schema/support-articles.ts
//     + support-categories.ts) ───────────────────────────────────────────────
// The dashboard queries via @supabase/supabase-js, so it declares the row shapes
// here. Source of truth is blink-server's Drizzle schema — keep these in sync.
export type SupportArticleType = "article" | "faq";
export type SupportArticleStatus = "draft" | "review" | "published";

// Per-language content. `body` is HTML for articles, the answer (text or simple
// HTML) for FAQs. Null until that language is composed.
export interface SupportArticleContent {
  title: string;
  body: string;
}

export interface SupportArticleRow {
  id: string;
  type: SupportArticleType;
  category: string; // a support_categories.key
  target_roles: string[]; // "All" | "Customer" | "Rider" | "Merchant" | "Agent"
  status: SupportArticleStatus;
  content_eng: SupportArticleContent | null;
  content_fr: SupportArticleContent | null;
  content_ar: SupportArticleContent | null;
  cover_url: string | null;
  author: string | null;
  author_id: string | null;
  views: number;
  helpful_up: number;
  helpful_down: number;
  sort: number;
  created_at: string;
  updated_at: string;
}

export interface SupportCategoryRow {
  id: string;
  key: string;
  target_roles: string[];
  label_eng: string;
  label_fr: string | null;
  label_ar: string | null;
  icon: string;
  color: string;
  sort: number;
  created_at: string;
  updated_at: string;
}

// Payload for inserts/updates via supabase-js (columns with DB defaults optional).
export interface SupportArticleInsert {
  type?: SupportArticleType;
  category: string;
  target_roles?: string[];
  status?: SupportArticleStatus;
  content_eng?: SupportArticleContent | null;
  content_fr?: SupportArticleContent | null;
  content_ar?: SupportArticleContent | null;
  cover_url?: string | null;
  author?: string | null;
  sort?: number;
}
export type SupportArticlePatch = Partial<SupportArticleInsert>;

export interface SupportCategoryInsert {
  key: string;
  target_roles?: string[];
  label_eng: string;
  label_fr?: string | null;
  label_ar?: string | null;
  icon?: string;
  color?: string;
  sort?: number;
}
export type SupportCategoryPatch = Partial<SupportCategoryInsert>;

// ─── Live-chat DB rows (mirror blink-server src/db/schema/support-*.ts) ──────
export type ConversationStatus = "bot" | "waiting" | "assigned" | "resolved";
export type MessageSender = "user" | "bot" | "agent" | "system";

export interface SupportConversationRow {
  id: string;
  user_id: string;
  user_role: string;
  status: ConversationStatus;
  assigned_agent_id: string | null;
  subject: string | null;
  locale: string;
  last_message_at: string;
  last_message_preview: string | null;
  unread_for_staff: number;
  created_at: string;
  updated_at: string;
}

export interface SupportMessageRow {
  id: string;
  conversation_id: string;
  sender: MessageSender;
  sender_id: string | null;
  body: string;
  meta: Record<string, unknown> | null;
  created_at: string;
}

// Map a DB conversation row → the inbox `Chat` display shape.
export function rowToChat(row: SupportConversationRow): Chat {
  const status: Chat["status"] =
    row.status === "waiting" ? "waiting" : row.status === "assigned" ? "active" : "idle";
  return {
    id: row.id,
    who: row.subject ?? row.user_role,
    role: row.user_role,
    channel: "In-app",
    preview: row.last_message_preview ?? "",
    unread: row.unread_for_staff,
    wait: "",
    status,
  };
}

// Map a DB message row → the thread `Message` display shape. Every sender maps to
// a distinct `from` so the bot (AI) is never mistaken for the human agent ("You")
// and system events render as notes rather than raw enum text.
export function rowToMessage(row: SupportMessageRow): Message {
  const from: Message["from"] =
    row.sender === "user"
      ? "customer"
      : row.sender === "agent"
      ? "agent"
      : row.sender === "bot"
      ? "bot"
      : "note"; // system
  const meta = row.meta as
    | { attachmentUrl?: string; type?: Message["noteType"]; agentName?: string }
    | null;
  return {
    from,
    who: row.sender === "bot" ? "Blink Assistant" : row.sender === "agent" ? "You" : "",
    text: row.body,
    time: "",
    attachmentUrl: meta?.attachmentUrl ?? null,
    noteType: from === "note" ? meta?.type : undefined,
    agentName: meta?.agentName ?? null,
  };
}
