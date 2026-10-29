"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui";

// Leaflet touches `window` at import time, so the map only loads in the browser.
export const PointPicker = dynamic(() => import("./point-picker-inner"), {
  ssr: false,
  loading: () => <Skeleton className="h-[240px] w-full rounded-xl" />,
});
