"use client";

// Leaflet map for ops screens (Live ops, Demand). Client-only: import it through
// `OpsMap` (./ops-map.tsx), which loads this file with ssr: false.
// Uses OpenStreetMap tiles; dark theme inverts the tile layer with a CSS filter.
import "leaflet/dist/leaflet.css";
import { useEffect, useMemo } from "react";
import { CircleMarker, MapContainer, Polyline, Popup, TileLayer, Tooltip, useMap } from "react-leaflet";
import type { LatLngBoundsExpression } from "leaflet";
import type { MapCircle, MapLine, MapMarker, MapPath, MarkerKind, OpsMapProps } from "./types";

const ALGIERS: [number, number] = [36.7538, 3.0588];

// CSS variable per marker kind; resolved to a concrete color at render (Leaflet paths need one).
const KIND_VAR: Record<MarkerKind, string> = {
  rider: "--success",
  rider_busy: "--info",
  pickup: "--primary",
  dropoff: "--warning",
  agent: "--purple",
  store: "--info",
  alert: "--danger",
};
const FALLBACK: Record<MarkerKind, string> = {
  rider: "#059669",
  rider_busy: "#2563EB",
  pickup: "#EE335F",
  dropoff: "#D97706",
  agent: "#7C3AED",
  store: "#2563EB",
  alert: "#DC2626",
};

function cssColor(kind: MarkerKind): string {
  if (typeof window === "undefined") return FALLBACK[kind];
  const v = getComputedStyle(document.documentElement).getPropertyValue(KIND_VAR[kind]).trim();
  return v || FALLBACK[kind];
}

/** Re-fits the view whenever `fitKey` changes (not on every data refresh, so polling doesn't jump the map). */
function FitBounds({ points, fitKey }: { points: [number, number][]; fitKey?: string }) {
  const map = useMap();
  useEffect(() => {
    if (!points.length) return;
    if (points.length === 1) {
      map.setView(points[0], 14);
      return;
    }
    map.fitBounds(points as LatLngBoundsExpression, { padding: [32, 32], maxZoom: 15 });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refit only when the caller asks
  }, [map, fitKey]);
  return null;
}

export default function OpsMapInner({ markers = [], lines = [], paths = [], circles = [], height = 420, fitKey, className = "" }: OpsMapProps) {
  const dark = typeof document !== "undefined" && document.documentElement.getAttribute("data-theme") === "dark";
  const points = useMemo<[number, number][]>(
    () => [
      ...markers.map((m) => [m.lat, m.lng] as [number, number]),
      ...circles.map((c) => [c.lat, c.lng] as [number, number]),
      ...paths.flatMap((p) => p.points),
    ],
    [markers, circles, paths]
  );

  return (
    <div className={`ops-map relative isolate overflow-hidden rounded-xl border border-border ${dark ? "ops-map-dark" : ""} ${className}`} style={{ height }}>
      <style>{`.ops-map-dark .leaflet-tile-pane{filter:invert(1) hue-rotate(180deg) brightness(.85) contrast(.9)}.ops-map .leaflet-container{background:var(--muted);font:inherit}`}</style>
      <MapContainer center={ALGIERS} zoom={11} scrollWheelZoom style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds points={points} fitKey={fitKey} />
        {circles.map((c: MapCircle) => (
          <CircleMarker
            key={c.id}
            center={[c.lat, c.lng]}
            radius={c.radius}
            pathOptions={{ color: cssColor(c.kind ?? "pickup"), fillColor: cssColor(c.kind ?? "pickup"), fillOpacity: 0.15 + 0.55 * Math.max(0, Math.min(1, c.intensity)), weight: 1 }}
            eventHandlers={c.onClick ? { click: c.onClick } : undefined}
          >
            <Tooltip direction="top">{c.label}</Tooltip>
            {c.detail && <Popup>{c.detail}</Popup>}
          </CircleMarker>
        ))}
        {lines.map((l: MapLine) => (
          <Polyline key={l.id} positions={[l.from, l.to]} pathOptions={{ color: cssColor(l.kind ?? "pickup"), weight: 2, opacity: 0.6, dashArray: "4 6" }} />
        ))}
        {paths.map((p: MapPath) => (
          <Polyline key={p.id} positions={p.points} pathOptions={{ color: cssColor(p.kind ?? "pickup"), weight: 4, opacity: 0.8 }} />
        ))}
        {markers.map((m: MapMarker) => (
          <CircleMarker
            key={m.id}
            center={[m.lat, m.lng]}
            radius={m.radius ?? 7}
            pathOptions={{ color: "#fff", weight: 2, fillColor: cssColor(m.kind), fillOpacity: 1 }}
            eventHandlers={m.onClick ? { click: m.onClick } : undefined}
          >
            <Tooltip direction="top">{m.label}</Tooltip>
            {m.detail && (
              <Popup>
                <div className="text-xs">
                  <div className="font-semibold mb-0.5">{m.label}</div>
                  <div>{m.detail}</div>
                  {m.href && (
                    <a href={m.href} className="underline mt-1 inline-block">
                      {m.hrefLabel ?? "Open"}
                    </a>
                  )}
                </div>
              </Popup>
            )}
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}
