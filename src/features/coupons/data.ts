// Mock data for the Coupons module — from the Blink Design System handoff (coupons.jsx).

import type { Coupon } from "./types";
export type { Coupon } from "./types";

export const COUPONS: Coupon[] = [
  { disc: "10%", unit: "OFF", title: "Welcome discount", min: 1000, max: 500, code: "WELCOME10", days: 8, locked: false, audience: "Customer" },
  { disc: "500", unit: "DZD", title: "Free delivery credit", min: 1500, max: null, code: "FREEDEL", days: 3, locked: false, audience: "Customer" },
  { disc: "25%", unit: "OFF", title: "Student rides", min: 0, max: 300, code: "STUDENT25", days: 30, locked: false, audience: "Customer" },
  { disc: "15%", unit: "OFF", title: "Loyalty reward", min: 2000, max: 800, code: "LOYAL15", days: 14, locked: true, points: 500, audience: "Customer" },
  { disc: "1000", unit: "DZD", title: "Big spender bonus", min: 5000, max: null, code: "BIG1000", days: 20, locked: true, points: 1200, audience: "Customer" },
  { disc: "20%", unit: "OFF", title: "Comeback offer", min: 800, max: 600, code: "MISSYOU20", days: 5, locked: false, audience: "Customer" },
];
