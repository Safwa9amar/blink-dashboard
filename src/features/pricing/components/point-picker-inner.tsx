"use client";

// Small Leaflet map for picking a pickup / drop-off by clicking. Client-only: import it through
// `PointPicker` (./point-picker.tsx), which loads this file with ssr: false.
import "leaflet/dist/leaflet.css";
import { CircleMarker, MapContainer, Polyline, TileLayer, Tooltip, useMapEvents } from "react-leaflet";
import type { LatLng } from "../types";

const ALGIERS: [number, number] = [36.7538, 3.0588];

function Clicks({ onPick }: { onPick: (p: LatLng) => void }) {
  useMapEvents({ click: (e) => onPick({ lat: Number(e.latlng.lat.toFixed(6)), lng: Number(e.latlng.lng.toFixed(6)) }) });
  return null;
}

export default function PointPickerInner({
  pickup,
  dropoff,
  onPick,
  pickupLabel,
  dropoffLabel,
  height = 240,
}: {
  pickup?: LatLng | null;
  dropoff?: LatLng | null;
  onPick: (p: LatLng) => void;
  pickupLabel: string;
  dropoffLabel: string;
  height?: number;
}) {
  const dark = typeof document !== "undefined" && document.documentElement.getAttribute("data-theme") === "dark";
  const center: [number, number] = pickup ? [pickup.lat, pickup.lng] : ALGIERS;
  return (
    <div className={`ops-map relative isolate overflow-hidden rounded-xl border border-border ${dark ? "ops-map-dark" : ""}`} style={{ height }}>
      <style>{`.ops-map-dark .leaflet-tile-pane{filter:invert(1) hue-rotate(180deg) brightness(.85) contrast(.9)}.ops-map .leaflet-container{background:var(--muted);font:inherit}`}</style>
      <MapContainer center={center} zoom={pickup ? 12 : 6} scrollWheelZoom style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Clicks onPick={onPick} />
        {pickup && dropoff && (
          <Polyline positions={[[pickup.lat, pickup.lng], [dropoff.lat, dropoff.lng]]} pathOptions={{ color: "#6B7280", weight: 2, dashArray: "4 6" }} />
        )}
        {pickup && (
          <CircleMarker center={[pickup.lat, pickup.lng]} radius={8} pathOptions={{ color: "#fff", weight: 2, fillColor: "#EE335F", fillOpacity: 1 }}>
            <Tooltip permanent direction="top">{pickupLabel}</Tooltip>
          </CircleMarker>
        )}
        {dropoff && (
          <CircleMarker center={[dropoff.lat, dropoff.lng]} radius={8} pathOptions={{ color: "#fff", weight: 2, fillColor: "#D97706", fillOpacity: 1 }}>
            <Tooltip permanent direction="top">{dropoffLabel}</Tooltip>
          </CircleMarker>
        )}
      </MapContainer>
    </div>
  );
}
