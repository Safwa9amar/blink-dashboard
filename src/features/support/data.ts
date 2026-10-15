// Mock data for the Support back-office — from the Blink Design System handoff (support.jsx).
import type { Variant } from "@/components/ui";

import type { Article, Agent } from "./types";
export type { Article, Message, Chat, Agent } from "./types";

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

