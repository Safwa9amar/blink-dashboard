"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Badge, Button, Card, Segmented, Skeleton, fInput } from "@/components/ui";
import { simulatePricing } from "@/app/d/pricing/action";
import { resolvePipeline, type ResolvedParam } from "../formula";
import { formatDa, num } from "../format";
import type { Fee, FeeVehicle, LatLng, PricingKey, SimulateBody, SimulateResult, TFn, Tier, Zone } from "../types";
import { liveTiers, liveZones, tierName } from "../zones";
import { BreakdownList, PlaceLine } from "./breakdown-list";
import { FeeEditModal } from "./fee-edit-modal";
import { PointPicker } from "./point-picker";

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

  const [scenario, setScenario] = useState<"courier" | "ride">("courier");
  const [vehicle, setVehicle] = useState<FeeVehicle>("motorcycle");
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

  const routed = byMap && !!pickup && !!dropoff;
  const bodyKey = JSON.stringify([scenario, vehicle, km, routed, pickup, dropoff, zoneId, tier]);
  useEffect(() => {
    const id = ++seq.current;
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
                  <ul className="mt-2.5 flex flex-wrap gap-2">
                    {s.params.map((p) => {
                      const chip = (
                        <>
                          <span className="text-subtext">{t(`formula.params.${p.label}`)}</span>
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
          ]}
          value={scenario}
          onChange={(v) => {
            setScenario(v);
            setResult(null);
          }}
          className="mb-4"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {scenario === "courier" && (
            <div>
              <span className="block text-[12px] text-subtext mb-1">{t("simulator.vehicle")}</span>
              <Segmented
                options={[
                  ["motorcycle", t("vehicle.motorcycle")],
                  ["bicycle", t("vehicle.bicycle")],
                ]}
                value={vehicle}
                onChange={setVehicle}
              />
            </div>
          )}
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
          {!byMap && (
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

        {byMap && (
          <div className="mt-3 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Segmented
                options={[
                  ["pickup", t("simulator.pickup")],
                  ["dropoff", t("simulator.dropoff")],
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
            {!routed && <p className="text-[11.5px] text-subtext">{t("formula.pick_two")}</p>}
          </div>
        )}

        <div className={`mt-5 ${loading && result ? "opacity-60 transition-opacity" : ""}`}>
          {failure && <p className="text-sm text-danger">{failure}</p>}
          {!result && loading && !failure && <Skeleton className="h-32 w-full" />}
          {result && (
            <div className="space-y-3">
              {result.unavailable ? (
                <p className="text-sm font-semibold text-warning">{t(`simulator.unavailable.${result.unavailable}`)}</p>
              ) : (
                <>
                  <div>
                    <p className="text-xs font-medium text-subtext uppercase tracking-wide">{t("simulator.customer_pays")}</p>
                    <p className="text-3xl font-bold text-text tabular-nums">{formatDa(result.payer_total, tf)}</p>
                  </div>
                  {result.place && <PlaceLine place={result.place} tiers={tiers} />}
                  {result.breakdown && result.breakdown.length > 0 ? (
                    <BreakdownList lines={result.breakdown} />
                  ) : (
                    <Badge>{t("formula.no_breakdown")}</Badge>
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
