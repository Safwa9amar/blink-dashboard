"use client";

import { useEffect, useState } from "react";
import { loadZones } from "@/app/d/pricing/action";
import type { Tier, Zone } from "../types";

/**
 * Zones + tiers for an editor: the caller's own (already loaded by a /pricing page), else fetched
 * once on mount (editors opened from merchant / agent pages have no /pricing data).
 */
export function useZoneData(provided?: { zones?: Zone[]; tiers?: Tier[] }): { zones: Zone[]; tiers: Tier[] } {
  const given = !!provided?.tiers;
  const [fetched, setFetched] = useState<{ zones: Zone[]; tiers: Tier[] } | null>(null);
  useEffect(() => {
    if (given) return;
    let alive = true;
    loadZones().then((res) => {
      if (alive && res.ok) setFetched({ zones: res.data.zones, tiers: res.data.tiers });
    });
    return () => {
      alive = false;
    };
  }, [given]);
  if (given) return { zones: provided?.zones ?? [], tiers: provided?.tiers ?? [] };
  return fetched ?? { zones: [], tiers: [] };
}
