"use client";

// Leaflet map for the zones tab: tier-colored polygons with Geoman draw / edit / remove, and a
// click-anywhere lookup popup. Client-only: import it through `ZonesMap` (./zones-map.tsx), which
// loads this file with ssr: false. Archived zones are never passed in.
import "leaflet/dist/leaflet.css";
import "@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css";
import { useEffect, useMemo, useRef, type ReactNode } from "react";
import L from "leaflet";
import "@geoman-io/leaflet-geoman-free";
import { MapContainer, Polygon, Popup, TileLayer, useMap, useMapEvents } from "react-leaflet";
import type { Tier, Zone, ZoneGeometry } from "../types";
import { geometryToLatLngs, layerGeometry, tierColor } from "../zones";

const ALGERIA: [number, number] = [28.2, 2.6];

// Geoman ships no Arabic; the toolbar needs only these strings.
const AR_TRANSLATIONS = {
  tooltips: {
    firstVertex: "انقر لوضع أول نقطة",
    continueLine: "انقر لمتابعة الرسم",
    finishPoly: "انقر على أول نقطة للإنهاء",
    finishRect: "انقر للإنهاء",
  },
  actions: { finish: "إنهاء", cancel: "إلغاء", removeLastVertex: "حذف آخر نقطة" },
  buttonTitles: {
    drawPolyButton: "رسم منطقة",
    drawRectButton: "رسم مستطيل",
    editButton: "تعديل المناطق",
    deleteButton: "حذف المناطق",
  },
};

export type ZonesMapProps = {
  /** Live zones only. */
  zones: Zone[];
  tiers: Tier[];
  selectedId: string | null;
  /** Bump to fit the map to the selected zone. */
  focusKey: number;
  /** A drawn polygon waiting for its name / tier. */
  pending: ZoneGeometry | null;
  /** Bump to rebuild the polygons from `zones` (drops unsaved vertex edits / restores removed ones). */
  redrawKey: number;
  canEdit: boolean;
  lang: string;
  lookupAt: { lat: number; lng: number } | null;
  lookupContent: ReactNode;
  height?: number;
  onSelect: (id: string) => void;
  onCreate: (g: ZoneGeometry) => void;
  onEdit: (id: string, g: ZoneGeometry) => void;
  onRemove: (id: string) => void;
  onLookup: (lat: number, lng: number) => void;
};

/** Always-current value for event handlers registered once (synced after each render). */
function useLatest<T>(value: T) {
  const ref = useRef(value);
  useEffect(() => {
    ref.current = value;
  });
  return ref;
}

function Controls({ canEdit, lang, onCreate, quiet }: Pick<ZonesMapProps, "canEdit" | "lang" | "onCreate"> & { quiet: React.MutableRefObject<number> }) {
  const map = useMap();
  const create = useLatest(onCreate);

  useEffect(() => {
    if (!canEdit) return;
    if (lang === "ar") map.pm.setLang("ar" as never, AR_TRANSLATIONS as never, "en");
    else map.pm.setLang((lang === "fr" ? "fr" : "en") as never);
    map.pm.addControls({
      position: "topleft",
      drawMarker: false,
      drawCircleMarker: false,
      drawPolyline: false,
      drawCircle: false,
      drawText: false,
      drawRectangle: true,
      drawPolygon: true,
      cutPolygon: false,
      dragMode: false,
      rotateMode: false,
      editMode: true,
      removalMode: true,
    });
    map.pm.setGlobalOptions({ allowSelfIntersection: false });
    const onCreateEvt = (e: { layer: L.Layer }) => {
      quiet.current = Date.now();
      const g = layerGeometry((e.layer as L.Polygon).toGeoJSON());
      // The parent re-renders the saved polygon from server data; drop the raw drawing.
      map.removeLayer(e.layer);
      if (g) create.current(g);
    };
    const stamp = () => {
      quiet.current = Date.now();
    };
    map.on("pm:create", onCreateEvt as never);
    map.on("pm:drawend", stamp);
    map.on("pm:globaleditmodetoggled", stamp);
    map.on("pm:globalremovalmodetoggled", stamp);
    return () => {
      map.off("pm:create", onCreateEvt as never);
      map.off("pm:drawend", stamp);
      map.off("pm:globaleditmodetoggled", stamp);
      map.off("pm:globalremovalmodetoggled", stamp);
      map.pm.removeControls();
    };
  }, [map, canEdit, lang, quiet, create]);
  return null;
}

function ZoneLayers(props: ZonesMapProps) {
  const map = useMap();
  const live = useLatest(props);
  const layers = useRef(new Map<string, L.Polygon>());

  const styleOf = (zone: Zone, selected: boolean): L.PathOptions => {
    const color = tierColor(live.current.tiers, zone.tier);
    return { color, weight: selected ? 3.5 : 1.8, fillColor: color, fillOpacity: selected ? 0.38 : 0.2 };
  };

  // Rebuild the polygons when the data changes (not when only the selection does).
  useEffect(() => {
    const group = L.featureGroup().addTo(map);
    const built = layers.current;
    built.clear();
    for (const zone of props.zones) {
      const poly = L.polygon(geometryToLatLngs(zone.geometry) as never, styleOf(zone, live.current.selectedId === zone.id));
      poly.bindTooltip(zone.name, { sticky: true });
      poly.on("click", () => live.current.onSelect(zone.id));
      poly.on("pm:edit", () => {
        const g = layerGeometry(poly.toGeoJSON());
        if (g) live.current.onEdit(zone.id, g);
      });
      poly.on("pm:remove", () => live.current.onRemove(zone.id));
      group.addLayer(poly);
      layers.current.set(zone.id, poly);
    }
    return () => {
      map.removeLayer(group);
      built.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- selection is handled by the next effect
  }, [map, props.zones, props.tiers, props.redrawKey]);

  useEffect(() => {
    for (const zone of props.zones) layers.current.get(zone.id)?.setStyle(styleOf(zone, props.selectedId === zone.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.selectedId, props.zones, props.tiers, props.redrawKey]);

  useEffect(() => {
    const layer = props.selectedId ? layers.current.get(props.selectedId) : null;
    if (layer) map.fitBounds(layer.getBounds(), { padding: [40, 40], maxZoom: 14 });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fit only when asked
  }, [props.focusKey]);

  // Frame all zones once, when the first batch arrives.
  const framed = useRef(false);
  useEffect(() => {
    if (framed.current || !props.zones.length) return;
    framed.current = true;
    const bounds = L.latLngBounds([]);
    layers.current.forEach((l) => bounds.extend(l.getBounds()));
    if (bounds.isValid()) map.fitBounds(bounds, { padding: [32, 32], maxZoom: 12 });
  }, [map, props.zones]);

  return null;
}

function Clicks({ quiet, lookup }: { quiet: React.MutableRefObject<number>; lookup: React.MutableRefObject<ZonesMapProps["onLookup"]> }) {
  const map = useMap();
  useMapEvents({
    click: (e) => {
      // Drawing / editing / removing clicks (and the one that ends them) are not lookups.
      const busy = map.pm.globalDrawModeEnabled() || map.pm.globalEditModeEnabled() || map.pm.globalRemovalModeEnabled();
      if (busy || Date.now() - quiet.current < 350) return;
      lookup.current(Number(e.latlng.lat.toFixed(6)), Number(e.latlng.lng.toFixed(6)));
    },
  });
  return null;
}

export default function ZonesMapInner(props: ZonesMapProps) {
  const dark = typeof document !== "undefined" && document.documentElement.getAttribute("data-theme") === "dark";
  const quiet = useRef(0);
  const lookup = useLatest(props.onLookup);
  const pending = useMemo(() => (props.pending ? geometryToLatLngs(props.pending) : null), [props.pending]);

  return (
    <div className={`ops-map relative isolate overflow-hidden rounded-xl border border-border ${dark ? "ops-map-dark" : ""}`} style={{ height: props.height ?? 560 }}>
      <style>{`.ops-map-dark .leaflet-tile-pane{filter:invert(1) hue-rotate(180deg) brightness(.85) contrast(.9)}.ops-map .leaflet-container{background:var(--muted);font:inherit}`}</style>
      <MapContainer center={ALGERIA} zoom={5} scrollWheelZoom style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Controls canEdit={props.canEdit} lang={props.lang} onCreate={props.onCreate} quiet={quiet} />
        <ZoneLayers {...props} />
        <Clicks quiet={quiet} lookup={lookup} />
        {pending && (
          <Polygon
            positions={pending as never}
            pathOptions={{ color: "#EE335F", weight: 2.5, dashArray: "6 6", fillOpacity: 0.12, pmIgnore: true } as never}
          />
        )}
        {props.lookupAt && (
          <Popup key={`${props.lookupAt.lat},${props.lookupAt.lng}`} position={[props.lookupAt.lat, props.lookupAt.lng]} minWidth={230}>
            {props.lookupContent}
          </Popup>
        )}
      </MapContainer>
    </div>
  );
}
