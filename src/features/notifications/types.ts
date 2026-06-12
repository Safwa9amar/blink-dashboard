// Domain types for the notifications feature.
export type TFn = (k: string, v?: Record<string, string | number>) => string;

export interface NType {
  label: string;
  icon: string;
  color: string;
  bg: string;
}

export type CampaignStatus = "draft" | "scheduled" | "sending" | "sent";

// Lifecycle of a queued broadcast (mirrors the server's
// scheduled_notification_status enum).
export type ScheduledStatus =
  | "pending"
  | "sending"
  | "sent"
  | "failed"
  | "canceled";

// A real scheduled-broadcast row from the DB queue (scheduled_notifications),
// fetched server-side and rendered in the Campaigns table. Serializable —
// no Date objects (scheduledAt is an ISO string).
export interface ScheduledNotification {
  id: string;
  type: string;
  title: string; // canonical display title
  audience: string; // display label: "All" | "Customer" | …
  channels: string[];
  scheduledAt: string; // ISO timestamp
  status: ScheduledStatus;
  recipients: number;
  // Edit payload (only meaningful while status === "pending").
  roles: string[]; // chip labels: ["All"] | ["Customer", …]
  link: string;
  titleByLang: { en: string; fr: string; ar: string };
  msgByLang: { en: string; fr: string; ar: string };
}

export interface CampaignMetrics {
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
}

export interface Campaign {
  id: string;
  title: string;
  type: string;
  chans: string[];
  audience: string;
  segment?: string;
  status: CampaignStatus;
  reach: number;
  opens: string;
  date: string;
  body?: string;
  link?: string;
  createdAt?: number;
  metrics?: CampaignMetrics;
}

export interface Template {
  id: string;
  name: string;
  type: string;
  message: string;
}

export interface Segment {
  id: string;
  name: string;
  description: string;
  count: number;
}

export interface InboxItem {
  id: string;
  type: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  link?: string;
}

export interface ComposeDraft {
  type?: string;
  title?: string;
  body?: string;
}

export interface NewCampaignInput {
  title: string;
  type: string;
  chans: string[];
  audience: string;
  segment?: string;
  body?: string;
  link?: string;
  status: CampaignStatus;
  reach: number;
  date: string;
}
