// Mock data for the Support back-office — from the Blink Design System handoff (support.jsx).
import { CHART, type Variant, type ColumnDatum, type DonutSegment } from "@/components/ui";

import type {
  Ticket,
  Article,
  Message,
  Agent,
  SlaPolicy,
  Rule,
} from "./types";
export type { Ticket, Article, Message, Chat, Agent, SlaPolicy, Rule } from "./types";

export const PRIO: Record<string, string> = {
  urgent: "#EF4444",
  high: "#FAAD14",
  normal: "#3B82F6",
  low: "#9BA1A6",
};

export const TICKETS: Ticket[] = [
  { id: "TK-3391", subj: "Order delivered to wrong address", who: "Lina Cherif", role: "customer", cat: "Delivery", prio: "urgent", status: "open", age: "4m" },
  { id: "TK-3390", subj: "Rider asking for cash on prepaid order", who: "Omar Ziani", role: "customer", cat: "Payment", prio: "high", status: "open", age: "22m" },
  { id: "TK-3388", subj: "Payout not received this week", who: "Yacine Haddad", role: "rider", cat: "Earnings", prio: "high", status: "in_progress", age: "1h" },
  { id: "TK-3385", subj: "Item missing from grocery order", who: "Nadia Boudiaf", role: "customer", cat: "Order", prio: "normal", status: "in_progress", age: "2h" },
  { id: "TK-3382", subj: "Agent QR code not scanning", who: "Superette El Baraka", role: "agent", cat: "Agent", prio: "normal", status: "open", age: "3h" },
  { id: "TK-3379", subj: "App crashes on checkout", who: "Sofiane Brahimi", role: "rider", cat: "Technical", prio: "low", status: "resolved", age: "5h" },
  { id: "TK-3377", subj: "Refund request for canceled trip", who: "Karim Benali", role: "merchant", cat: "Refund", prio: "normal", status: "resolved", age: "6h" },
];

export const TK_STATUS: Record<string, Variant> = { open: "danger", in_progress: "warning", resolved: "success" };
export const supLbl = (s: string) => s.replace(/_/g, " ");

export const ROLES = ["All", "Customer", "Rider", "Merchant", "Agent"];
export const ROLE_VARIANT: Record<string, Variant> = {
  Customer: "info",
  Rider: "success",
  Merchant: "primary",
  Agent: "warning",
  All: "default",
};

export const CATEGORIES = [
  "Getting Started",
  "Orders & Delivery",
  "Payments & Blink Cash",
  "Rides & Courier",
  "Account & Security",
  "Earnings & Payouts",
  "Safety",
];

export const ARTICLES: Article[] = [
  { title: "How to track your live order", cat: "Orders & Delivery", roles: ["Customer"], status: "published", views: 12480, updated: "2d ago" },
  { title: "Setting up your Blink Cash PIN", cat: "Payments & Blink Cash", roles: ["Rider", "Agent", "Merchant"], status: "published", views: 8210, updated: "5d ago" },
  { title: "How rider payouts & commission work", cat: "Earnings & Payouts", roles: ["Rider"], status: "published", views: 6055, updated: "1w ago" },
  { title: "Uploading your store documents (RC, NIF, NIS)", cat: "Account & Security", roles: ["Merchant"], status: "published", views: 4302, updated: "1w ago" },
  { title: "Accepting a rider deposit at your shop", cat: "Payments & Blink Cash", roles: ["Agent"], status: "draft", views: 0, updated: "3h ago" },
  { title: "Cancelling or refunding an order", cat: "Orders & Delivery", roles: ["Customer", "Merchant"], status: "published", views: 9120, updated: "2w ago" },
  { title: "Staying safe on a ride", cat: "Safety", roles: ["Customer", "Rider"], status: "review", views: 0, updated: "1h ago" },
];

export const ART_STATUS: Record<string, Variant> = {
  published: "success",
  draft: "warning",
  review: "info",
  archived: "default",
};

export const MACROS = [
  { t: "Order delayed — apology + ETA", b: "Hi {name}, sorry your order is taking longer than expected. Your rider is {eta} away — thanks for your patience!", used: 1204 },
  { t: "Refund approved", b: "Good news {name} — your refund of {amount} DA has been approved and will reach your Blink wallet within 24h.", used: 842 },
  { t: "Document rejected — re-upload", b: "Hi {name}, your {document} was rejected because {reason}. Please re-upload a clear photo from your profile.", used: 530 },
  { t: "Rider payout explained", b: "Payouts settle weekly every Sunday. Your earnings minus the 18% commission are sent to your selected method.", used: 318 },
];

// ── Overview (manager / admin KPI dashboard) ──────────────────────────────
// Daily ticket volume — [created, resolved] per weekday.
export const VOLUME_SERIES: ColumnDatum[] = [
  { label: "Mon", values: [120, 104] },
  { label: "Tue", values: [138, 121] },
  { label: "Wed", values: [156, 142] },
  { label: "Thu", values: [149, 151] },
  { label: "Fri", values: [182, 160] },
  { label: "Sat", values: [201, 178] },
  { label: "Sun", values: [164, 169] },
];
export const VOLUME_MAX = 220;
export const VOLUME_COLORS = [CHART.primary, CHART.info];

// Where tickets come from — channel mix donut.
export const CHANNELS: DonutSegment[] = [
  { name: "In-app chat", pct: 46, color: CHART.primary },
  { name: "WhatsApp", pct: 27, color: CHART.success },
  { name: "Email", pct: 15, color: CHART.info },
  { name: "Phone", pct: 8, color: CHART.warning },
  { name: "Web form", pct: 4, color: CHART.neutral },
];
export const CHANNEL_ICON: Record<string, string> = {
  "In-app chat": "chat",
  WhatsApp: "chat",
  Email: "mail",
  Phone: "support",
  "Web form": "grid",
};

// SLA compliance this week — met vs at-risk vs breached.
export const SLA_DONUT: DonutSegment[] = [
  { name: "Met", pct: 91, color: CHART.success },
  { name: "At risk", pct: 6, color: CHART.warning },
  { name: "Breached", pct: 3, color: CHART.danger },
];

// Top issue themes driving volume.
export const TOP_ISSUES = [
  { cat: "Delivery delays", count: 312, pct: 24, trend: "▲ 8%", up: true },
  { cat: "Payment & refunds", count: 268, pct: 21, trend: "▼ 3%", up: false },
  { cat: "Missing items", count: 197, pct: 15, trend: "▲ 2%", up: true },
  { cat: "Rider earnings", count: 154, pct: 12, trend: "▼ 5%", up: false },
  { cat: "Account access", count: 121, pct: 9, trend: "▲ 1%", up: true },
];

// ── Ticket conversation workspace ─────────────────────────────────────────
// The thread shown when an agent opens a ticket (keyed by ticket id, with a
// generic fallback so every ticket opens to a believable conversation).
export const THREADS: Record<string, Message[]> = {
  "TK-3391": [
    { from: "customer", who: "Lina Cherif", text: "My order #BL-88421 was marked delivered but it never arrived. The rider left it at the wrong building.", time: "4m ago" },
    { from: "note", who: "System", text: "Linked order BL-88421 · 2,450 Da · Rider: Sofiane B. · Drop pin 180m from customer address.", time: "4m ago" },
    { from: "agent", who: "You", text: "Hi Lina, so sorry about that. I can see the drop-off pin is far from your address — I'm checking with the rider now and will get this sorted.", time: "2m ago" },
    { from: "customer", who: "Lina Cherif", text: "Thank you, I really need the groceries today 🙏", time: "1m ago" },
  ],
};
export const DEFAULT_THREAD: Message[] = [
  { from: "customer", who: "Customer", text: "Hi, I need help with this — can someone take a look?", time: "12m ago" },
  { from: "note", who: "System", text: "Auto-routed to the queue based on category. No agent assigned yet.", time: "12m ago" },
  { from: "agent", who: "You", text: "Hey! Thanks for reaching out — I'm on it and will update you shortly.", time: "6m ago" },
];

// The 360° customer context shown in the workspace sidebar.
export const TICKET_CONTEXT = {
  joined: "Member since Mar 2024",
  orders: 47,
  wallet: "2,450 Da",
  priorTickets: 3,
  lastOrder: "Grocery · 2,450 Da · today",
  device: "iPhone 14 · app v4.2.1",
  lang: "Arabic / French",
};

// Other agents currently looking at the open ticket (collision detection).
export const VIEWERS = ["Sara Mansouri"];

// ── Live chat / omnichannel inbox ─────────────────────────────────────────
export const CHANNEL_COLOR: Record<string, string> = {
  "In-app": "#EE335F",
  WhatsApp: "#22C55E",
  Web: "#3B82F6",
  Email: "#FAAD14",
};
// ── Agents / team roster ──────────────────────────────────────────────────
export const AGENTS: Agent[] = [
  { name: "Sara Mansouri", team: "Tier 1", status: "online", load: 6, cap: 8, csat: 4.8, frt: "1.4m", resolved: 38 },
  { name: "Karim Bensaid", team: "Payments", status: "online", load: 8, cap: 8, csat: 4.1, frt: "3.2m", resolved: 24 },
  { name: "Mehdi Larbi", team: "Tier 2", status: "away", load: 3, cap: 6, csat: 4.5, frt: "2.1m", resolved: 19 },
  { name: "Amina Toumi", team: "Riders", status: "online", load: 5, cap: 8, csat: 4.7, frt: "1.8m", resolved: 31 },
  { name: "Riad Belkacem", team: "Tier 1", status: "offline", load: 0, cap: 8, csat: 4.4, frt: "2.6m", resolved: 0 },
];

// ── SLA policies & automation rules (admin) ───────────────────────────────
export const SLA_POLICIES: SlaPolicy[] = [
  { name: "Urgent", prio: "urgent", frt: "15m", resolution: "2h", met: 88, breached: 12 },
  { name: "High", prio: "high", frt: "30m", resolution: "4h", met: 93, breached: 7 },
  { name: "Normal", prio: "normal", frt: "1h", resolution: "8h", met: 96, breached: 4 },
  { name: "Low", prio: "low", frt: "4h", resolution: "24h", met: 99, breached: 1 },
];
export const RULES: Rule[] = [
  {
    name: "Route payment issues to Payments team",
    when: "Ticket created",
    conditions: ["Category is Payment or Refund"],
    actions: ["Assign to Payments team", "Set priority High"],
    runs: 1240,
    on: true,
  },
  {
    name: "Escalate breached urgent tickets",
    when: "SLA at risk",
    conditions: ["Priority is Urgent", "First response overdue"],
    actions: ["Notify shift lead", "Add tag escalated"],
    runs: 86,
    on: true,
  },
  {
    name: "Auto-reply outside business hours",
    when: "Ticket created",
    conditions: ["Outside 8:00–22:00"],
    actions: ["Send macro: After-hours auto-reply"],
    runs: 532,
    on: true,
  },
  {
    name: "Close idle resolved tickets",
    when: "Every hour",
    conditions: ["Status is Resolved", "No reply for 72h"],
    actions: ["Set status Closed", "Send CSAT survey"],
    runs: 410,
    on: false,
  },
];
