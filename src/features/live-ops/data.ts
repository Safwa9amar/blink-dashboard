// Mock data for the Live Ops feed — from the Blink Design System handoff (extras.jsx).

import type { OpsEvent } from "./types";
export type { OpsEvent } from "./types";

export const EVENTS: OpsEvent[] = [
  { ic: "package", v: "info", tt: ["Order ", "#4821", " placed at ", "Le Gourmet"], mt: "Bab Ezzouar · 2,450 DA" },
  { ic: "bike", v: "success", tt: ["Rider ", "Yacine H.", " accepted a trip"], mt: "El Harrach → Centre" },
  { ic: "card", v: "primary", tt: ["Deposit ", "5,000 DA", " via agent QR"], mt: "Superette El Baraka" },
  { ic: "support", v: "danger", tt: ["Dispute ", "TK-3391", " opened"], mt: "Wrong address · urgent" },
  { ic: "store", v: "info", tt: ["New merchant ", "Pizza Roma", " went live"], mt: "Rouiba · marketplace" },
  { ic: "trending", v: "success", tt: ["Order ", "#4815", " delivered"], mt: "Hydra · 18 min · ★ 5" },
  { ic: "users", v: "info", tt: ["New rider ", "Riad M.", " verified"], mt: "Blida · motorcycle" },
  { ic: "fire", v: "warning", tt: ["Surge triggered in ", "Bab Ezzouar"], mt: "Demand 1.4× supply" },
];

export const EV_BG: Record<string, string> = {
  info: "var(--info-light)",
  success: "var(--success-light)",
  primary: "var(--soft-pink)",
  danger: "var(--danger-light)",
  warning: "var(--warning-light)",
};
export const EV_FG: Record<string, string> = {
  info: "var(--info)",
  success: "var(--success)",
  primary: "var(--primary)",
  danger: "var(--danger)",
  warning: "var(--warning)",
};
