"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Badge, Button, Card, DashIcon, EmptyState, Modal } from "@/components/ui";
import { archiveZone, lookupZone, updateZone } from "@/app/d/pricing/action";
import { canPriceZone, exportZones, formatArea, liveZones, tierColor, tierName, zonePriceFees } from "../zones";
import type { Fee, Override, Tier, Zone, ZoneGeometry, ZoneLookup } from "../types";
import { FeeEditModal } from "./fee-edit-modal";
import { OverrideWizard } from "./override-wizard";
import { TierManager } from "./tier-manager";
import { ZoneEditor } from "./zone-editor";
import { ZoneImportModal } from "./zone-import-modal";
import { termTags } from "./term";
import { ZoneLookupCard } from "./zone-lookup";
import { ZonesMap } from "./zones-map";

type LookupState = { lat: number; lng: number; loading: boolean; data: ZoneLookup | null; error?: string };

/** Draw, edit, import and inspect zones; manage tiers. Edit controls appear only with `canEdit`. */
export function ZonesView({
  zones,
  tiers,
  unzonedTier,
  fees,
  overrides = [],
  canEdit,
  error,
}: {
  zones: Zone[];
  tiers: Tier[];
  unzonedTier: string;
  fees: Fee[];
  /** Overrides of all zones (the editor lists the selected zone's live ones). */
  overrides?: Override[];
  canEdit: boolean;
  error?: string;
}) {
  const t = useTranslations("pricing");
  const locale = useLocale();
  const router = useRouter();
  const live = useMemo(() => liveZones(zones), [zones]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [focusKey, setFocusKey] = useState(0);
  const [redrawKey, setRedrawKey] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pending, setPending] = useState<ZoneGeometry | null>(null);
  const [dirty, setDirty] = useState<Record<string, ZoneGeometry>>({});
  const [lookup, setLookup] = useState<LookupState | null>(null);
  const [removing, setRemoving] = useState<Zone | null>(null);
  const [removeError, setRemoveError] = useState<{ text: string; count?: number } | null>(null);
  const [importing, setImporting] = useState(false);
  const [editDefaults, setEditDefaults] = useState(false);
  // The override wizard, opened from the zone panel / lookup popup: a new override on `zoneId`, or editing one.
  const [wizard, setWizard] = useState<{ zoneId?: string; override?: Override } | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [busy, start] = useTransition();

  const zoneDefaults = fees.find((f) => f.key === "zone_defaults") ?? null;
  const editing = editingId ? (live.find((z) => z.id === editingId) ?? null) : null;
  const dirtyIds = Object.keys(dirty);
  const canSetPrices = canEdit && zonePriceFees(fees).length > 0;
  const priceZone = (zone: Zone) => {
    if (canPriceZone(zone)) setWizard({ zoneId: zone.id });
  };

  const select = (id: string) => {
    setSelectedId(id);
    setFocusKey((k) => k + 1);
  };
  const refreshed = () => {
    setPending(null);
    setEditingId(null);
    setDirty({});
    setRedrawKey((k) => k + 1);
    router.refresh();
  };

  const onLookup = (lat: number, lng: number) => {
    setLookup({ lat, lng, loading: true, data: null });
    lookupZone(lat, lng).then((res) =>
      setLookup((cur) =>
        cur && cur.lat === lat && cur.lng === lng
          ? { ...cur, loading: false, data: res.ok ? res.data : null, error: res.ok ? undefined : res.error }
          : cur,
      ),
    );
  };

  const exportFile = () => {
    const blob = new Blob([JSON.stringify(exportZones(zones), null, 2)], { type: "application/geo+json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `blink-zones-${new Date().toISOString().slice(0, 10)}.geojson`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const saveShapes = () => {
    setSaveMessage(null);
    start(async () => {
      for (const id of dirtyIds) {
        const zone = live.find((z) => z.id === id);
        if (!zone) continue;
        const res = await updateZone(id, { geometry: dirty[id], expected_updated_at: zone.updated_at });
        if (!res.ok) {
          setSaveMessage(`${zone.name}: ${res.error}`);
          return;
        }
      }
      refreshed();
    });
  };

  const confirmArchive = () =>
    start(async () => {
      const res = await archiveZone(removing!.id);
      if (!res.ok) return setRemoveError({ text: res.error, count: res.code === "zone_in_use" ? (res.overrideCount ?? removing!.override_count) : undefined });
      setRemoving(null);
      setSelectedId(null);
      refreshed();
    });
  const cancelArchive = () => {
    setRemoving(null);
    setRemoveError(null);
    // The map already dropped the polygon in removal mode; bring it back.
    setRedrawKey((k) => k + 1);
  };

  if (error) return <p className="text-sm text-danger">{error}</p>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-soft-pink px-4 py-3">
        <p className="text-[13px] text-text">
          {t.rich("zones.banner", {
            ...termTags,
            tier: tierName(tiers, unzonedTier, locale) || "—",
          })}
        </p>
        <div className="flex items-center gap-3">
          {canEdit && zoneDefaults && (
            <Button size="xs" variant="secondary" icon="pencil" onClick={() => setEditDefaults(true)}>
              {t("zones.banner_change")}
            </Button>
          )}
          <Link href="/pricing/overrides?key=zone_defaults" className="text-[12px] font-semibold text-primary">
            {t("zones.banner_exceptions")}
          </Link>
        </div>
      </div>

      {canEdit && dirtyIds.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-warning/40 bg-warning-light px-4 py-2.5">
          <p className="text-[13px] text-text">{t("zones.unsaved", { count: dirtyIds.length })}</p>
          <div className="flex items-center gap-2">
            {saveMessage && <span className="text-[12px] text-danger">{saveMessage}</span>}
            <Button
              size="xs"
              variant="ghost"
              disabled={busy}
              onClick={() => {
                setDirty({});
                setRedrawKey((k) => k + 1);
              }}
            >
              {t("zones.discard")}
            </Button>
            <Button size="xs" loading={busy} onClick={saveShapes}>
              {t("zones.save_shapes")}
            </Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_380px] gap-4 items-start">
        <div className="space-y-2 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-[12px] text-subtext">{canEdit ? t("zones.map_hint_edit") : t("zones.map_hint")}</p>
            <div className="flex items-center gap-2">
              {canEdit && (
                <Button size="xs" variant="secondary" icon="download" onClick={() => setImporting(true)}>
                  {t("zones.import.button")}
                </Button>
              )}
              <Button size="xs" variant="secondary" icon="send" onClick={exportFile} disabled={!live.length}>
                {t("zones.export")}
              </Button>
            </div>
          </div>
          <ZonesMap
            zones={live}
            tiers={tiers}
            selectedId={selectedId}
            focusKey={focusKey}
            pending={pending}
            redrawKey={redrawKey}
            canEdit={canEdit}
            lang={locale}
            lookupAt={lookup ? { lat: lookup.lat, lng: lookup.lng } : null}
            lookupContent={
              lookup ? (
                <ZoneLookupCard
                  loading={lookup.loading}
                  error={lookup.error}
                  data={lookup.data}
                  tiers={tiers}
                  canEdit={canEdit}
                  onSetZonePrices={
                    canSetPrices
                      ? (zoneId) => {
                          const zone = live.find((z) => z.id === zoneId);
                          if (zone) priceZone(zone);
                        }
                      : undefined
                  }
                />
              ) : null
            }
            onSelect={setSelectedId}
            onCreate={(g) => {
              setEditingId(null);
              setPending(g);
            }}
            onEdit={(id, g) => setDirty((d) => ({ ...d, [id]: g }))}
            onRemove={(id) => {
              const zone = live.find((z) => z.id === id);
              if (zone) {
                setRemoveError(null);
                setRemoving(zone);
              }
            }}
            onLookup={onLookup}
          />
        </div>

        <div className="space-y-4 min-w-0">
          {pending ? (
            <ZoneEditor
              geometry={pending}
              tiers={tiers}
              onClose={() => {
                setPending(null);
                setRedrawKey((k) => k + 1);
              }}
              onSaved={refreshed}
            />
          ) : editing ? (
            <ZoneEditor
              key={editing.id}
              zone={editing}
              geometry={dirty[editing.id] ?? null}
              tiers={tiers}
              readOnly={!canEdit}
              fees={fees}
              overrides={overrides}
              onSetPrices={canSetPrices ? priceZone : undefined}
              onEditOverride={(o) => setWizard({ override: o })}
              onClose={() => setEditingId(null)}
              onSaved={refreshed}
              onArchive={(z) => {
                setRemoveError(null);
                setRemoving(z);
              }}
            />
          ) : (
            <Card title={t("zones.list_title")} description={t("zones.list_desc", { count: live.length })}>
              {live.length === 0 ? (
                <EmptyState
                  icon={<DashIcon name="map" className="w-10 h-10" />}
                  title={t("empty.zones_title")}
                  description={t("empty.zones_body")}
                  actionLabel={canEdit ? t("empty.zones_import") : undefined}
                  onAction={canEdit ? () => setImporting(true) : undefined}
                />
              ) : (
                <ul className="divide-y divide-border max-h-[420px] overflow-y-auto -mx-1 px-1">
                  {live.map((z) => (
                    <li key={z.id} className={`flex items-center gap-2 rounded-lg ${selectedId === z.id ? "bg-soft-pink" : ""}`}>
                      <button
                        type="button"
                        onClick={() => select(z.id)}
                        className="flex-1 min-w-0 text-start flex items-center gap-3 py-2.5 px-1 cursor-pointer"
                      >
                        <span className="w-3.5 h-3.5 rounded-full shrink-0" style={{ background: tierColor(tiers, z.tier) }} />
                        <span className="min-w-0 flex-1">
                          <span className="block text-[13px] font-semibold text-text truncate">{z.name}</span>
                          <span className="block text-[11.5px] text-subtext">
                            {tierName(tiers, z.tier, locale)} · {t("zones.area_value", { km2: formatArea(z.area_km2) })}
                            {z.priority !== 0 && ` · ${t("zones.priority_short", { n: z.priority })}`}
                          </span>
                        </span>
                        {z.override_count > 0 && <Badge variant="primary">{z.override_count}</Badge>}
                      </button>
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => {
                          select(z.id);
                          setEditingId(z.id);
                        }}
                      >
                        {canEdit ? t("actions.edit") : t("zones.details")}
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          )}
          <TierManager tiers={tiers} canEdit={canEdit} />
        </div>
      </div>

      {canEdit && (
        <>
          <OverrideWizard
            open={!!wizard}
            onClose={() => setWizard(null)}
            fees={fees}
            zones={zones}
            tiers={tiers}
            override={wizard?.override ?? null}
            scopePreset={wizard?.zoneId ? { zone_id: wizard.zoneId } : null}
            onSaved={() => router.refresh()}
          />
          <ZoneImportModal open={importing} onClose={() => setImporting(false)} tiers={tiers} />
          <FeeEditModal fee={editDefaults ? zoneDefaults : null} tiers={tiers} onClose={() => setEditDefaults(false)} />
          <Modal open={!!removing} onClose={cancelArchive} title={t("zones.archive_title")}>
            <p className="text-sm text-subtext mb-4">{t("zones.archive_body", { name: removing?.name ?? "" })}</p>
            {removeError && (
              <p className="text-sm text-danger mb-3">
                {removeError.text}{" "}
                {removeError.count !== undefined && removing && (
                  <Link href={`/pricing/overrides?zone_id=${removing.id}`} className="underline font-semibold">
                    {t("zones.see_overrides", { count: removeError.count })}
                  </Link>
                )}
              </p>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={cancelArchive} disabled={busy}>
                {t("actions.cancel")}
              </Button>
              <Button variant="danger" size="sm" loading={busy} onClick={confirmArchive}>
                {t("actions.archive")}
              </Button>
            </div>
          </Modal>
        </>
      )}
    </div>
  );
}
