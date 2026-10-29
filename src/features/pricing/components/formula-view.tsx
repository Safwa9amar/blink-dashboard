"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Badge, Button, Card, Segmented, Skeleton, fInput } from "@/components/ui";
import { simulatePricing } from "@/app/d/pricing/action";
import { resolvePipeline, type ResolvedParam } from "../formula";
import { formatDa, num } from "../format";
import type { Fee, LatLng, PricingKey, SimulateBody, SimulateResult, TFn, Tier, Zone } from "../types";
import { liveTiers, liveZones, tierName } from "../zones";
import { BreakdownList, PlaceLine } from "./breakdown-list";
import { FeeEditModal } from "./fee-edit-modal";
import { PointPicker } from "./point-picker";
import { VehiclePicker, useServiceClassCodes } from "./vehicle-picker";
import { useClassName } from "./vehicle-classes-context";
import { pickVehicle } from "../vehicle-classes";

/** Params of a step in runs by service (courier / ride / store), so per-class legs read as blocks. */
function groupParams(params: ResolvedParam[]): { service?: string; params: ResolvedParam[] }[] {
  const out: { service?: string; params: ResolvedParam[] }[] = [];
  for (const p of params) {
    const last = out[out.length - 1];
    if (last && last.service === p.service) last.params.push(p);
    else out.push({ service: p.service, params: [p] });
  }
  return out;
}

const numOrUndef = (s: string) => {
  const n = Number(s.trim().replace(",", "."));
  return s.trim() !== "" && Number.isFinite(n) ? n : undefined;
};

/** The fixed 6-step fare pipeline with live defaults, plus a server-computed worked example. */
export function FormulaView({
  fees,
  zones,
  tiers,
  canEdit,
  error,
}: {
  fees: Fee[];
  zones: Zone[];
  tiers: Tier[];
  canEdit: boolean;
  error?: string;
}) {
  const t = useTranslations("pricing");
  const tf = t as unknown as TFn;
  const locale = useLocale();
  const [editingKey, setEditingKey] = useState<PricingKey | null>(null);
  const editing = editingKey ? (fees.find((f) => f.key === editingKey) ?? null) : null;
  const steps = resolvePipeline(fees);

  const className = useClassName();
  const [scenario, setScenario] = useState<"courier" | "ride" | "store">("courier");
  const [vehicleChoice, setVehicle] = useState("");
  const courierCodes = useServiceClassCodes("courier");
  const rideCodes = useServiceClassCodes("ride");
  const vehicle = pickVehicle(scenario === "ride" ? rideCodes : courierCodes, vehicleChoice);
  const [km, setKm] = useState("5");
  const [byMap, setByMap] = useState(false);
  const [pickup, setPickup] = useState<LatLng | null>(null);
  const [dropoff, setDropoff] = useState<LatLng | null>(null);
  const [pickMode, setPickMode] = useState<"pickup" | "dropoff">("pickup");
  const [zoneId, setZoneId] = useState("");
  const [tier, setTier] = useState("");
  const [result, setResult] = useState<SimulateResult | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const seq = useRef(0);

  // Marketplace delivery is priced between the store and the customer: it needs both points.
  const storeScenario = scenario === "store";
  const mapMode = byMap || storeScenario;
  const routed = mapMode && !!pickup && !!dropoff;
  const waitingForPoints = storeScenario && !routed;
  const bodyKey = JSON.stringify([scenario, vehicle, km, routed, pickup, dropoff, zoneId, tier]);
  useEffect(() => {
    const id = ++seq.current;
    if (waitingForPoints) return;
    const body: SimulateBody = {
      scenario,
      context: {
        ...(zoneId ? { zone_id: zoneId } : {}),
        ...(tier ? { tier } : {}),
        ...(routed ? { pickup: pickup!, dropoff: dropoff! } : {}),
      },
      inputs: {
        ...(routed ? {} : { km: numOrUndef(km) }),
        ...(scenario === "courier" ? { vehicle, stops: 1 } : {}),
        ...(scenario === "ride" && rideCodes.length > 1 ? { vehicle } : {}),
      },
    };
    const timer = setTimeout(async () => {
      setLoading(true);
      setFailure(null);
      const res = await simulatePricing(body);
      if (id !== seq.current) return;
      setLoading(false);
      if (!res.ok) {
        setFailure(res.error);
        setResult(null);
        return;
      }
      setResult(res.data);
    }, 350);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bodyKey]);

  // Marketplace waits for its two points: whatever the last request returned is not shown meanwhile.
  const view = waitingForPoints ? null : result;
  const viewFailure = waitingForPoints ? null : failure;
  const viewLoading = !waitingForPoints && loading;

  if (error) return <p className="text-sm text-danger">{error}</p>;

  const show = (p: ResolvedParam) => {
    if (p.value === null) return "—";
    if (typeof p.value === "boolean") return p.value ? t("fmt.service_on") : t("fmt.service_off");
    if (typeof p.value === "string") return t(`choices.${p.label}.${p.value}` as never) as string;
    switch (p.unit) {
      case "da":
        return formatDa(p.value, tf);
      case "km":
        return `${num(p.value)} ${t("units.km")}`;
      case "kmh":
        return `${num(p.value)} ${t("units.kmh")}`;
      case "min":
        return `${num(p.value)} ${t("units.min")}`;
      case "x":
        return `×${num(p.value)}`;
      default:
        return String(p.value);
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] gap-6 items-start">
      <div className="space-y-3 min-w-0">
        <div>
          <h2 className="text-sm font-semibold text-text">{t("formula.title")}</h2>
          <p className="text-[12.5px] text-subtext">{t("formula.desc")}</p>
        </div>
        <ol className="space-y-3">
          {steps.map((s, i) => (
            <li key={s.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-soft-pink text-primary text-[12px] font-bold inline-flex items-center justify-center shrink-0">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-bold text-text">{t(`formula.steps.${s.id}.title`)}</p>
                  <p className="text-[12.5px] text-subtext mt-0.5">{t(`formula.steps.${s.id}.desc`)}</p>
                  {groupParams(s.params).map((grp) => (
                  <div key={grp.service ?? "all"} className="mt-2.5">
                  {grp.service && <p className="text-[11px] font-bold uppercase tracking-wide text-subtext mb-1">{t(`formula.service.${grp.service}`)}</p>}
                  <ul className="flex flex-wrap gap-2">
                    {grp.params.map((p) => {
                      const chip = (
                        <>
                          <span className="text-subtext">{p.classCode ? `${className(p.classCode)} · ${t(`fields.${p.label}`)}` : t(`formula.params.${p.label}`)}</span>
                          <span className="ms-1.5 font-bold text-text tabular-nums">{show(p)}</span>
                        </>
                      );
                      return (
                        <li key={`${p.fee}.${p.path}`}>
                          {canEdit && fees.some((f) => f.key === p.fee) ? (
                            <button
                              type="button"
                              onClick={() => setEditingKey(p.fee)}
                              title={t("formula.edit_param", { fee: t(`fees.${p.fee}.name`) })}
                              className="inline-flex items-center rounded-lg border border-border px-2.5 py-1 text-[12px] cursor-pointer hover:border-primary"
                            >
                              {chip}
                            </button>
                          ) : (
                            <span className="inline-flex items-center rounded-lg border border-border px-2.5 py-1 text-[12px]">{chip}</span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                  </div>
                  ))}
                </div>
              </div>
            </li>
          ))}
        </ol>
        <p className="text-[12px] text-subtext">{t("formula.note")}</p>
      </div>

      <Card title={t("formula.example_title")} description={t("formula.example_desc")}>
        <Segmented
          options={[
            ["courier", t("simulator.scenario.courier")],
            ["ride", t("simulator.scenario.ride")],
            ["store", t("formula.scenario_marketplace")],
          ]}
          value={scenario}
          onChange={(v) => {
            setScenario(v);
            setResult(null);
          }}
          className="mb-4"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {(scenario === "courier" || (scenario === "ride" && rideCodes.length > 1)) && (
            <div>
              <span className="block text-[12px] text-subtext mb-1">{t("simulator.vehicle")}</span>
              <VehiclePicker service={scenario === "ride" ? "ride" : "courier"} value={vehicle} onChange={setVehicle} />
            </div>
          )}
          {storeScenario && <p className="sm:col-span-2 text-[12px] text-subtext">{t("formula.store_note")}</p>}
          {!storeScenario && (
            <label className="block">
              <span className="block text-[12px] text-subtext mb-1">{t("formula.input_mode")}</span>
              <Segmented
                options={[
                  ["km", t("simulator.km")],
                  ["map", t("formula.two_points")],
                ]}
                value={byMap ? "map" : "km"}
                onChange={(v) => setByMap(v === "map")}
              />
            </label>
          )}
          {!mapMode && (
            <label className="block">
              <span className="block text-[12px] text-subtext mb-1">{t("simulator.km")}</span>
              <input type="number" inputMode="decimal" min={0} className={fInput} value={km} onChange={(e) => setKm(e.target.value)} />
            </label>
          )}
          <label className="block">
            <span className="block text-[12px] text-subtext mb-1">{t("modal.zone")}</span>
            <select
              className={fInput}
              value={zoneId}
              onChange={(e) => {
                setZoneId(e.target.value);
                if (e.target.value) setTier("");
              }}
            >
              <option value="">{t("modal.any_zone")}</option>
              {liveZones(zones).map((z) => (
                <option key={z.id} value={z.id}>
                  {z.name} · {tierName(tiers, z.tier, locale)}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="block text-[12px] text-subtext mb-1">{t("modal.tier")}</span>
            <select
              className={fInput}
              value={tier}
              onChange={(e) => {
                setTier(e.target.value);
                if (e.target.value) setZoneId("");
              }}
            >
              <option value="">{t("modal.any_tier")}</option>
              {liveTiers(tiers).map((x) => (
                <option key={x.code} value={x.code}>
                  {tierName(tiers, x.code, locale)}
                </option>
              ))}
            </select>
          </label>
        </div>

        {mapMode && (
          <div className="mt-3 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Segmented
                options={[
                  ["pickup", storeScenario ? t("simulator.store_point") : t("simulator.pickup")],
                  ["dropoff", storeScenario ? t("simulator.customer_point") : t("simulator.dropoff")],
                ]}
                value={pickMode}
                onChange={setPickMode}
              />
              {(pickup || dropoff) && (
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => {
                    setPickup(null);
                    setDropoff(null);
                    setPickMode("pickup");
                  }}
                >
                  {t("simulator.clear_points")}
                </Button>
              )}
            </div>
            <PointPicker
              pickup={pickup}
              dropoff={dropoff}
              pickupLabel={t("simulator.pickup")}
              dropoffLabel={t("simulator.dropoff")}
              height={220}
              onPick={(p) => {
                if (pickMode === "pickup") {
                  setPickup(p);
                  setPickMode("dropoff");
                } else setDropoff(p);
              }}
            />
            {!routed && <p className="text-[11.5px] text-subtext">{storeScenario ? t("formula.pick_two_store") : t("formula.pick_two")}</p>}
          </div>
        )}

        <div className={`mt-5 ${viewLoading && view ? "opacity-60 transition-opacity" : ""}`}>
          {viewFailure && <p className="text-sm text-danger">{viewFailure}</p>}
          {!view && viewLoading && !viewFailure && <Skeleton className="h-32 w-full" />}
          {view && (
            <div className="space-y-3">
              {view.unavailable ? (
                <p className="text-sm font-semibold text-warning">{t(`simulator.unavailable.${view.unavailable}`)}</p>
              ) : (
                <>
                  <div>
                    <p className="text-xs font-medium text-subtext uppercase tracking-wide">{t("simulator.customer_pays")}</p>
                    <p className="text-3xl font-bold text-text tabular-nums">{formatDa(view.payer_total, tf)}</p>
                  </div>
                  {view.place && <PlaceLine place={view.place} tiers={tiers} />}
                  {storeScenario && view.delivery_mode && (
                    <div className="flex flex-wrap items-center gap-1.5 text-[12.5px]">
                      <span className="text-subtext">{t("simulator.delivery_priced")}</span>
                      <Badge variant={view.delivery_mode === "distance" ? "primary" : "default"}>{t(`fmt.store_mode.${view.delivery_mode}`)}</Badge>
                      {view.delivery_mode === "distance" && view.vehicle && <Badge variant="info">{className(view.vehicle)}</Badge>}
                    </div>
                  )}
                  {view.breakdown && view.breakdown.length > 0 ? (
                    <BreakdownList lines={view.breakdown} />
                  ) : (
                    <Badge>{storeScenario && view.delivery_mode === "merchant" ? t("formula.merchant_no_breakdown") : t("formula.no_breakdown")}</Badge>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </Card>

      {canEdit && <FeeEditModal fee={editing} tiers={tiers} onClose={() => setEditingKey(null)} />}
    </div>
  );
}
