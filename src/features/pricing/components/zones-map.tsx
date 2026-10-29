"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui";
import type { ZonesMapProps } from "./zones-map-inner";

export type { ZonesMapProps } from "./zones-map-inner";

// Leaflet + Geoman touch `window` at import time, so the map only loads in the browser.
export const ZonesMap = dynamic<ZonesMapProps>(() => import("./zones-map-inner"), {
  ssr: false,
  loading: () => <Skeleton className="h-[560px] w-full rounded-xl" />,
});
