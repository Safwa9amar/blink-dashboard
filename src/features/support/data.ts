// Mock data for the Support back-office — from the Blink Design System handoff (support.jsx).
import type { Variant } from "@/components/ui";


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

export const ART_STATUS: Record<string, Variant> = {
  published: "success",
  draft: "warning",
  review: "info",
  archived: "default",
};


// ── Live chat / omnichannel inbox ─────────────────────────────────────────
export const CHANNEL_COLOR: Record<string, string> = {
  "In-app": "#EE335F",
  WhatsApp: "#22C55E",
  Web: "#3B82F6",
  Email: "#FAAD14",
};
