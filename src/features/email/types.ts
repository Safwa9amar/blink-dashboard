// Domain types for the customer email inbox. The DB rows mirror blink-server's
// Drizzle schema (src/db/schema/email-threads.ts + email-messages.ts) and come
// back from supabase-js in snake_case.

// The trilingual translator passed to components (next-intl's `t`).
export type TFn = (key: string, values?: Record<string, string | number>) => string;

export type EmailThreadStatus = "open" | "assigned" | "closed";
export type EmailDirection = "inbound" | "outbound";

// One customer email conversation.
export interface EmailThreadRow {
  id: string;
  customer_email: string;
  customer_name: string | null;
  user_id: string | null;
  subject: string | null;
  normalized_subject: string;
  status: EmailThreadStatus;
  assigned_agent_id: string | null;
  last_message_at: string;
  last_message_preview: string | null;
  last_direction: EmailDirection | null;
  unread_for_staff: number;
  message_count: number;
  created_at: string;
  updated_at: string;
}

// One email within a thread (inbound from a customer, or an outbound staff reply).
export interface EmailMessageRow {
  id: string;
  thread_id: string;
  direction: EmailDirection;
  message_id: string | null;
  in_reply_to: string | null;
  from_email: string;
  from_name: string | null;
  to_email: string;
  subject: string | null;
  body_text: string;
  body_html: string | null;
  sender_id: string | null;
  meta: Record<string, unknown> | null;
  created_at: string;
}

// Attachment summary the poller stores under message.meta.attachments.
export interface EmailAttachmentMeta {
  filename: string | null;
  contentType: string | null;
  size: number | null;
}
