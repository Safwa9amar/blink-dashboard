// Mock data for the Notifications system — from the Blink Design System handoff (notifications.jsx).
// Notification types are verbatim from the app: types/notifications.ts + getIconConfig().
import type { Variant } from "@/components/ui";

import type { NType, CampaignStatus, CampaignMetrics, Campaign, Template, Segment, InboxItem } from "./types";
export type { TFn, NType, CampaignStatus, CampaignMetrics, Campaign, Template, Segment, InboxItem } from "./types";

export const N_ROLES = ["All", "Customer", "Rider", "Merchant", "Agent"];
export const N_ROLE_VARIANT: Record<string, Variant> = {
  Customer: "info",
  Rider: "success",
  Merchant: "primary",
  Agent: "warning",
  All: "default",
};

export const CHANNELS: [string, string, string][] = [
  ["push", "Push", "bell"],
  ["inapp", "In-app", "chat"],
  ["email", "Email", "mail"],
  ["sms", "SMS", "support"],
];

export const SEGMENTS = ["Everyone", "New users (7d)", "Inactive (30d)", "High spenders", "By city: Algiers", "Pending KYC"];

export const NSTATUS: Record<string, Variant> = {
  sent: "success",
  scheduled: "info",
  draft: "warning",
  sending: "primary",
};

export const NTYPES: Record<string, NType> = {
  order: { label: "Order", icon: "package", color: "var(--primary)", bg: "var(--soft-pink)" },
  courier: { label: "Courier", icon: "truck", color: "var(--primary)", bg: "var(--soft-pink)" },
  promo: { label: "Promo", icon: "gift", color: "var(--primary)", bg: "var(--soft-pink)" },
  offer: { label: "Offer", icon: "tag", color: "#D97706", bg: "var(--warning-light)" },
  alert: { label: "Alert", icon: "warn", color: "var(--danger)", bg: "var(--danger-light)" },
  security: { label: "Security", icon: "shield", color: "#F43F5E", bg: "var(--danger-light)" },
  announcement: { label: "Announcement", icon: "megaphone", color: "#16A34A", bg: "var(--success-light)" },
  news: { label: "News", icon: "newspaper", color: "var(--subtext)", bg: "var(--muted)" },
  benefit: { label: "Benefit", icon: "ticket", color: "var(--info)", bg: "var(--info-light)" },
  deposit: { label: "Deposit", icon: "wallet", color: "var(--success)", bg: "var(--success-light)" },
};
export const NTYPE_KEYS = Object.keys(NTYPES);
export const NTYPE_BADGE: Record<string, Variant> = {
  order: "primary",
  courier: "primary",
  promo: "primary",
  offer: "warning",
  alert: "danger",
  security: "danger",
  announcement: "success",
  news: "default",
  benefit: "info",
  deposit: "success",
};

// Derive a believable delivery funnel from a campaign's reach + open rate.
export function deriveMetrics(reach: number, opens: string, status: CampaignStatus): CampaignMetrics {
  if (status !== "sent" || !reach) return { sent: status === "sending" ? reach : 0, delivered: 0, opened: 0, clicked: 0 };
  const pct = parseInt(opens, 10) || 0;
  const delivered = Math.round(reach * 0.97);
  const opened = Math.round(delivered * (pct / 100));
  const clicked = Math.round(opened * 0.18);
  return { sent: reach, delivered, opened, clicked };
}

export const SEED_CAMPAIGNS: Campaign[] = [
  { id: "weekend-rides-promo", title: "30% off all rides — weekend!", type: "promo", chans: ["push", "inapp"], audience: "Customer", status: "sent", reach: 184200, opens: "38%", date: "May 30" },
  { id: "order-4821", title: "Your order #4821 is on the way", type: "order", chans: ["push"], audience: "Customer", status: "sent", reach: 1, opens: "100%", date: "May 30" },
  { id: "fuel-cashback", title: "Fuel cashback now live", type: "benefit", chans: ["push", "inapp"], audience: "Rider", status: "sent", reach: 3214, opens: "52%", date: "May 29" },
  { id: "device-signin", title: "New device sign-in detected", type: "security", chans: ["push", "email"], audience: "All", status: "sent", reach: 248000, opens: "71%", date: "May 29" },
  { id: "verify-store", title: "Action needed: verify your store", type: "alert", chans: ["push", "email"], audience: "Merchant", status: "sent", reach: 1820, opens: "61%", date: "May 28" },
  { id: "deposit-bonus", title: "Deposit bonus: +10% this week", type: "deposit", chans: ["push", "inapp"], audience: "Rider", status: "sent", reach: 3100, opens: "47%", date: "May 28" },
  { id: "free-delivery", title: "Free delivery on your next order", type: "offer", chans: ["inapp"], audience: "Customer", status: "sent", reach: 96400, opens: "29%", date: "May 27" },
  { id: "eid-sale", title: "Eid mega-sale starts soon", type: "promo", chans: ["push", "inapp", "email"], audience: "All", status: "scheduled", reach: 248000, opens: "—", date: "Jun 5 · 09:00" },
  { id: "agent-commission", title: "New agent commission rates", type: "announcement", chans: ["inapp"], audience: "Agent", status: "draft", reach: 0, opens: "—", date: "—" },
].map((c): Campaign => ({
  ...c,
  status: c.status as CampaignStatus,
  metrics: deriveMetrics(c.reach, c.opens, c.status as CampaignStatus),
}));

export const SEED_TEMPLATES: Template[] = [
  { id: "tpl-order-otw", name: "Order on the way", type: "order", message: "Your order is on the way! {rider} will arrive in ~{eta}." },
  { id: "tpl-promo", name: "Promo announcement", type: "promo", message: "🎉 {promo} — tap to claim before it ends!" },
  { id: "tpl-kyc", name: "KYC reminder", type: "alert", message: "Action needed: finish verifying your account to keep earning." },
  { id: "tpl-payout", name: "Payout sent", type: "deposit", message: "Your payout of {amount} DA has been sent. Tap for details." },
];

export const SEED_SEGMENTS: Segment[] = [
  { id: "seg-everyone", name: "Everyone", description: "All registered users", count: 248000 },
  { id: "seg-new", name: "New users (7d)", description: "Signed up in the last week", count: 19840 },
  { id: "seg-inactive", name: "Inactive (30d)", description: "No order/trip in 30 days", count: 54560 },
  { id: "seg-high", name: "High spenders", description: "Top 12% by lifetime value", count: 29760 },
  { id: "seg-algiers", name: "By city: Algiers", description: "Located in Algiers wilaya", count: 111600 },
  { id: "seg-kyc", name: "Pending KYC", description: "Verification incomplete", count: 1240 },
];

export const SEED_INBOX: InboxItem[] = [
  { id: "in-1", type: "promo", title: "Campaign sent", message: "“30% off all rides — weekend!” reached 184,200 users.", time: "2h", read: false, link: "/notifications/weekend-rides-promo" },
  { id: "in-2", type: "security", title: "New device sign-in detected", message: "Delivered to 248,000 users · 71% open rate.", time: "1d", read: false, link: "/notifications/device-signin" },
  { id: "in-3", type: "alert", title: "Action needed: verify your store", message: "Merchant alert delivered to 1,820 stores.", time: "2d", read: true, link: "/notifications/verify-store" },
];

// reach estimate bases by audience role
export const REACH_BASE: Record<string, number> = {
  All: 248000,
  Customer: 184000,
  Rider: 3214,
  Merchant: 1820,
  Agent: 47,
};
