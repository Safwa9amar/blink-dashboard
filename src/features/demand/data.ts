// Mock data for the Demand dashboard — from the Blink Design System handoff (demand.jsx).

// hourly demand (orders) vs supply (online riders), 24h: [hour, demand, supply]
import { CHART } from "@/components/ui";
import type { MapZone } from "./types";
export type { MapZone } from "./types";

export const HOURS: [number, number, number][] = [
  [6, 18, 30], [7, 34, 52], [8, 72, 88], [9, 58, 80], [10, 40, 70], [11, 55, 75],
  [12, 128, 120], [13, 142, 118], [14, 96, 110], [15, 62, 90], [16, 70, 95], [17, 98, 108],
  [18, 150, 124], [19, 168, 130], [20, 140, 128], [21, 104, 112], [22, 66, 84], [23, 30, 50],
];
export const HMAX = 175;
export const PEAK = 19; // 7pm

export const SERVICES = [
  { name: "Food", pct: 46, color: CHART.primary },
  { name: "Marketplace", pct: 28, color: CHART.info },
  { name: "Courier", pct: 16, color: CHART.warning },
  { name: "Rides", pct: 10, color: CHART.success },
];

export const ZONES = [
  { z: "Bab Ezzouar", area: "Algiers Est", load: 96, tr: 14 },
  { z: "Hydra", area: "Algiers Centre", load: 88, tr: 9 },
  { z: "El Harrach", area: "Algiers Est", load: 74, tr: -4 },
  { z: "Cheraga", area: "Algiers Ouest", load: 67, tr: 6 },
  { z: "Kouba", area: "Algiers Centre", load: 58, tr: -2 },
  { z: "Rouiba", area: "Algiers Est", load: 41, tr: 11 },
];

// heatmap: rows = day parts, cols = zones, value 0-100 demand intensity
export const HEAT_COLS = ["B.Ezz", "Hydra", "Harrach", "Cheraga", "Kouba", "Rouiba"];
export const HEAT_ROWS: [string, number[]][] = [
  ["Morning", [60, 48, 40, 35, 30, 22]],
  ["Midday", [85, 72, 60, 55, 48, 38]],
  ["Evening", [100, 92, 78, 70, 62, 45]],
  ["Late", [54, 60, 44, 30, 26, 20]],
];

export function heatColor(v: number) {
  const a = 0.12 + (v / 100) * 0.88;
  return `rgba(238,51,95,${a.toFixed(2)})`;
}

// map zones: x/y are % positions on the city canvas
export const MAP_ZONES: MapZone[] = [
  { z: "Bab Ezzouar", area: "Algiers Est", x: 72, y: 44, load: 96, orders: 84, riders: 38, wait: "8.2m", unmet: 11 },
  { z: "Hydra", area: "Algiers Centre", x: 46, y: 52, load: 88, orders: 71, riders: 44, wait: "5.1m", unmet: 4 },
  { z: "El Harrach", area: "Algiers Est", x: 64, y: 64, load: 74, orders: 58, riders: 31, wait: "6.7m", unmet: 6 },
  { z: "Cheraga", area: "Algiers Ouest", x: 22, y: 46, load: 67, orders: 49, riders: 33, wait: "5.8m", unmet: 3 },
  { z: "Kouba", area: "Algiers Centre", x: 52, y: 70, load: 58, orders: 41, riders: 28, wait: "4.9m", unmet: 2 },
  { z: "Rouiba", area: "Algiers Est", x: 88, y: 56, load: 41, orders: 27, riders: 18, wait: "7.1m", unmet: 5 },
];

// scattered rider dots (decorative)
export const RIDERS: [number, number][] = [
  [68, 40], [75, 48], [44, 56], [49, 47], [60, 60], [66, 68], [25, 42], [19, 50], [55, 66],
  [50, 74], [85, 52], [90, 60], [58, 52], [38, 60], [71, 58], [30, 55], [63, 38], [47, 64],
];
