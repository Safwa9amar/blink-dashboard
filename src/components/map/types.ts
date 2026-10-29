// Props for the shared ops map (src/components/map). Coordinates are WGS84 lat/lng.

export type MarkerKind = "rider" | "rider_busy" | "pickup" | "dropoff" | "agent" | "store" | "alert";

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  kind: MarkerKind;
  /** Tooltip text (also the popup title). */
  label: string;
  /** Popup body; no popup when omitted. */
  detail?: string;
  href?: string;
  hrefLabel?: string;
  radius?: number;
  onClick?: () => void;
}

/** A dashed line, e.g. an active order's pickup → destination. */
export interface MapLine {
  id: string;
  from: [number, number];
  to: [number, number];
  kind?: MarkerKind;
}

/** A solid multi-point line, e.g. a rider's recorded GPS trail. */
export interface MapPath {
  id: string;
  points: [number, number][];
  kind?: MarkerKind;
}

/** A sized, shaded circle for aggregated areas (demand cells). */
export interface MapCircle {
  id: string;
  lat: number;
  lng: number;
  /** Pixel radius. */
  radius: number;
  /** 0..1, drives fill opacity. */
  intensity: number;
  kind?: MarkerKind;
  label: string;
  detail?: string;
  onClick?: () => void;
}

export interface OpsMapProps {
  markers?: MapMarker[];
  lines?: MapLine[];
  paths?: MapPath[];
  circles?: MapCircle[];
  height?: number;
  /** Change it to re-fit the view to the data (e.g. on range change); polling refreshes keep the view. */
  fitKey?: string;
  className?: string;
}
