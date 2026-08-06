import type { EmailAttachmentMeta, EmailThreadRow, EmailMessageRow } from "./types";

// Display name for a thread/message party: the sender's name, else their address.
export function partyName(name: string | null | undefined, email: string): string {
  return name?.trim() || email;
}

export function threadName(thread: EmailThreadRow): string {
  return partyName(thread.customer_name, thread.customer_email);
}

// Short timestamp for a message row (time today, else "Mon 5").
export function fmtWhen(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  return sameDay
    ? d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : d.toLocaleDateString([], { month: "short", day: "numeric" });
}

// Full timestamp for the thread header ("Jul 9, 2026, 14:30").
export function fmtFull(iso: string): string {
  return new Date(iso).toLocaleString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Attachment summaries the poller stored on message.meta.
export function attachmentsOf(msg: EmailMessageRow): EmailAttachmentMeta[] {
  const list = (msg.meta as { attachments?: EmailAttachmentMeta[] } | null)?.attachments;
  return Array.isArray(list) ? list : [];
}

// A thread is waiting on us when the most recent message came in and it isn't closed.
export function needsReply(thread: EmailThreadRow): boolean {
  return thread.status !== "closed" && thread.last_direction === "inbound";
}
