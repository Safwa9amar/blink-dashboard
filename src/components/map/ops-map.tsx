"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui";
import type { OpsMapProps } from "./types";

export type { MapCircle, MapLine, MapMarker, MapPath, MarkerKind, OpsMapProps } from "./types";

// Leaflet touches `window` at import time, so the map only loads in the browser.
export const OpsMap = dynamic<OpsMapProps>(() => import("./ops-map-inner"), {
  ssr: false,
  loading: () => <Skeleton className="h-[420px] w-full rounded-xl" />,
});
