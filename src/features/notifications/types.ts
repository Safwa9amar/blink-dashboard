// Domain types for the notifications feature.
export type TFn = (k: string, v?: Record<string, string | number>) => string;

export interface NType {
  label: string;
  icon: string;
  color: string;
  bg: string;
}

export type CampaignStatus = "draft" | "scheduled" | "sending" | "sent";

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
