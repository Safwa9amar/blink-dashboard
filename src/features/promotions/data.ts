// Mock data for the Promotions module — from the Blink Design System handoff (promotions.jsx).
import { CHART, type Variant } from "@/components/ui";

import type { Promo } from "./types";
export type { Promo } from "./types";

export const P_CATS = ["All", "Rides", "Food", "Market", "Parcels", "Fashion", "Beauty"];
export const P_ROLES = ["All", "Customer", "Rider", "Merchant", "Agent"];
export const P_ROLE_VARIANT: Record<string, Variant> = {
  Customer: "info",
  Rider: "success",
  Merchant: "primary",
  Agent: "warning",
  All: "default",
};

// Reuse the news covers shipped in /public/images.
export const P_COVERS = ["/images/news-warehouse.png", "/images/news-fuel.png", "/images/news-policy.png"];

export const P_STATUS: Record<string, Variant> = {
  active: "success",
  scheduled: "info",
  paused: "warning",
  ended: "default",
};

export const PROMOS: Promo[] = [
  { title: "30% off all rides", sub: "Weekend drop · Algiers", cat: "Rides", type: "activate", cover: 1, status: "active", reach: 184000, redeemed: 6922, ctr: "8.4%" },
  { title: "50% OFF at Burger King", sub: "Code: BK50 · min 2000 DA", cat: "Food", type: "copy", code: "BK50", cover: 0, status: "active", reach: 142000, redeemed: 842, ctr: "5.1%" },
  { title: "Fresh grocery — BOGO", sub: "Code: FRESH1 · select stores", cat: "Market", type: "copy", code: "FRESH1", cover: 2, status: "active", reach: 96000, redeemed: 318, ctr: "3.6%" },
  { title: "Free parcel delivery", sub: "First courier order", cat: "Parcels", type: "activate", cover: 0, status: "scheduled", reach: 0, redeemed: 0, ctr: "—" },
  { title: "Summer fashion −40%", sub: "Code: SUMMER40", cat: "Fashion", type: "copy", code: "SUMMER40", cover: 1, status: "paused", reach: 54000, redeemed: 1204, ctr: "6.0%" },
  { title: "Student rides −25%", sub: "Verified students", cat: "Rides", type: "activate", cover: 2, status: "active", reach: 38000, redeemed: 1290, ctr: "11.2%" },
];

export const PROMO_BYCAT = [
  { name: "Rides", pct: 34, color: CHART.success },
  { name: "Food", pct: 41, color: CHART.primary },
  { name: "Market", pct: 16, color: CHART.info },
  { name: "Parcels", pct: 9, color: CHART.warning },
];

export const PROMO_WEEK: [string, number][] = [
  ["Mon", 38], ["Tue", 52], ["Wed", 44], ["Thu", 61], ["Fri", 88], ["Sat", 96], ["Sun", 72],
];
