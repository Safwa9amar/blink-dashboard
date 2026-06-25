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

// A single message in a ticket thread or live chat — agent reply, customer
// message, or a private internal note.
export interface Message {
  from: "customer" | "agent" | "note";
  who: string;
  text: string;
  time: string;
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

// Map a DB message row → the thread `Message` display shape.
export function rowToMessage(row: SupportMessageRow): Message {
  const from: Message["from"] =
    row.sender === "user"
      ? "customer"
      : row.sender === "agent"
      ? "agent"
      : row.sender === "system"
      ? "note"
      : "agent";
  return {
    from,
    who: row.sender === "bot" ? "Blink Assistant" : row.sender === "agent" ? "You" : "",
    text: row.body,
    time: "",
  };
}
