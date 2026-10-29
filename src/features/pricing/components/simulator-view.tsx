"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useForm, useWatch } from "react-hook-form";
import { useLocale, useTranslations } from "next-intl";
import { Badge, Card, Segmented, Skeleton, fInput } from "@/components/ui";
import { listMerchantStores, simulatePricing, type StoreHit } from "@/app/d/pricing/action";
import { fromInputDate } from "../cockpit";
import { formatDa, formatValueInline } from "../format";
import type { LatLng, PartnerHit, SimParty, SimScenario, SimulateBody, SimulateResult, TFn, Tier, Zone } from "../types";
import { WILAYA_OPTIONS } from "../wilayas";
import { liveTiers, liveZones, tierName } from "../zones";
import { BreakdownList, PlaceLine } from "./breakdown-list";
import { PartnerPicker } from "./partner-picker";
import { PointPicker } from "./point-picker";
import { ScopeChips } from "./scope-chips";
import { VehiclePicker, useServiceClassCodes } from "./vehicle-picker";
import { useClassName, useVehicleClasses } from "./vehicle-classes-context";
import { pickVehicle } from "../vehicle-classes";

const SCENARIOS: SimScenario[] = ["store", "courier", "ride", "deposit", "withdrawal"];
const PARTY_BAR: Record<SimParty, string> = {
  merchant: "bg-success",
  rider: "bg-info",
  agent: "bg-warning",
  blink: "bg-primary",
  tax: "bg-subtext",
};

interface SimForm {
  wilaya_code: string;
  zone_id: string;
  tier: string;
  store_id: string;
  at: string;
  subtotal: string;
  delivery_fee: string;
  /** A vehicle class code; "" = the first class offered for the scenario. */
  vehicle: string;
  km: string;
  stops: string;
  amount: string;
}

const numOrUndef = (s: string) => {
  const n = Number(s.trim().replace(",", "."));
  return s.trim() !== "" && Number.isFinite(n) ? n : undefined;
};

export function SimulatorView({
  initialScenario = "store",
  zones = [],
  tiers = [],
}: {
  initialScenario?: SimScenario;
  zones?: Zone[];
  tiers?: Tier[];
}) {
  const t = useTranslations("pricing");
  const tf = t as unknown as TFn;
  const locale = useLocale();
  const className = useClassName();
  const hasClasses = useVehicleClasses().length > 0;
  const courierCodes = useServiceClassCodes("courier");
  const rideCodes = useServiceClassCodes("ride");
  const { register, control, setValue } = useForm<SimForm>({
    defaultValues: { wilaya_code: "", zone_id: "", tier: "", store_id: "", at: "", subtotal: "", delivery_fee: "", vehicle: "", km: "", stops: "", amount: "" },
  });
  const f = useWatch({ control });
  const [scenario, setScenario] = useState<SimScenario>(initialScenario);
  const [merchant, setMerchant] = useState<PartnerHit | null>(null);
  const [stores, setStores] = useState<{ merchantId: string; list: StoreHit[] } | null>(null);
  const [agent, setAgent] = useState<PartnerHit | null>(null);
  const [pickup, setPickup] = useState<LatLng | null>(null);
  const [dropoff, setDropoff] = useState<LatLng | null>(null);
  const [pickMode, setPickMode] = useState<"pickup" | "dropoff">("pickup");
  const [result, setResult] = useState<SimulateResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const seq = useRef(0);

  // A picked merchant's stores feed the store select.
  useEffect(() => {
    if (!merchant) return;
    let alive = true;
    listMerchantStores(merchant.id).then((list) => alive && setStores({ merchantId: merchant.id, list }));
    return () => {
      alive = false;
    };
  }, [merchant]);
  const storeList = merchant && stores?.merchantId === merchant.id ? stores.list : [];
  const storeId = scenario === "store" && merchant && storeList.some((x) => x.id === f.store_id) ? f.store_id : "";

  // Debounced server call; only the latest response is shown.
  const tripScenario = scenario === "courier" || scenario === "ride";
  // With both points picked the server derives the km (and places, surcharge, service area).
  const routed = tripScenario && !!pickup && !!dropoff;
  const zoneScoped = scenario !== "deposit" && scenario !== "withdrawal";
  // Marketplace delivery: the store (or a picked point) and the customer's drop-off feed `store_delivery`.
  const storePoints = scenario === "store";
  const pointScenario = tripScenario || storePoints;
  const vehicle = pickVehicle(scenario === "ride" ? rideCodes : courierCodes, f.vehicle);
  const bodyKey = JSON.stringify([scenario, f, vehicle, storeId, merchant?.id, agent?.id, pickup, dropoff]);
  useEffect(() => {
    const id = ++seq.current;
    // Any change to the scenario or an input invalidates the previous failure.
    setError(null);
    const body: SimulateBody = {
      scenario,
      context: {
        ...(f.wilaya_code ? { wilaya_code: f.wilaya_code } : {}),
        ...(zoneScoped && f.zone_id ? { zone_id: f.zone_id } : {}),
        ...(zoneScoped && f.tier ? { tier: f.tier } : {}),
        // A picked store is the pickup; the map point only stands in for it when no store is chosen.
        ...(pointScenario && pickup && !(storePoints && storeId) ? { pickup } : {}),
        ...(pointScenario && dropoff ? { dropoff } : {}),
        ...(scenario === "store" && merchant ? { merchant_id: merchant.id } : {}),
        ...(storeId ? { store_id: storeId } : {}),
        ...((scenario === "deposit" || scenario === "withdrawal") && agent ? { agent_id: agent.id } : {}),
        ...(f.at ? { at: fromInputDate(f.at) ?? undefined } : {}),
      },
      inputs: {
        ...(scenario === "store"
          ? { subtotal: numOrUndef(f.subtotal ?? ""), delivery_fee: numOrUndef(f.delivery_fee ?? "") }
          : {}),
        ...(tripScenario ? { km: routed ? undefined : numOrUndef(f.km ?? "") } : {}),
        ...(scenario === "courier" ? { stops: numOrUndef(f.stops ?? ""), vehicle } : {}),
        ...(scenario === "ride" && hasClasses && vehicle ? { vehicle } : {}),
        ...(scenario === "deposit" || scenario === "withdrawal" ? { amount: numOrUndef(f.amount ?? "") } : {}),
      },
    };
    const timer = setTimeout(async () => {
      setLoading(true);
      const res = await simulatePricing(body);
      if (id !== seq.current) return;
      setLoading(false);
      if (!res.ok) {
        setError(res.error);
        setResult(null);
        return;
      }
      setResult(res.data);
    }, 350);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bodyKey]);

  const label = (text: string, children: React.ReactNode) => (
    <label className="block">
      <span className="block text-[12px] text-subtext mb-1">{text}</span>
      {children}
    </label>
  );
  const numInput = (name: keyof SimForm, ph: string) => (
    <input type="number" inputMode="decimal" min={0} className={fInput} placeholder={ph} {...register(name)} />
  );

  const deliveryLine =
    scenario === "store" && result?.delivery_mode ? (
      <div className="flex flex-wrap items-center gap-1.5 text-[12.5px]">
        <span className="text-subtext">{t("simulator.delivery_priced")}</span>
        <Badge variant={result.delivery_mode === "distance" ? "primary" : "default"}>{t(`fmt.store_mode.${result.delivery_mode}`)}</Badge>
        {result.delivery_mode === "distance" && result.vehicle && <Badge variant="info">{className(result.vehicle)}</Badge>}
      </div>
    ) : null;
  const payerKey = scenario === "deposit" ? "rider_pays" : scenario === "withdrawal" ? "rider_receives" : "customer_pays";
  const lines = (result?.lines ?? []).filter((l) => l.amount !== 0);
  const total = lines.reduce((s, l) => s + Math.abs(l.amount), 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-6 items-start">
      <Card title={t("simulator.inputs")} description={t("simulator.inputs_desc")}>
        <Segmented
          options={SCENARIOS.map((s) => [s, t(`simulator.scenario.${s}`)] as [SimScenario, string])}
          value={scenario}
          onChange={(v) => {
            setScenario(v);
            setResult(null);
          }}
          className="flex-wrap mb-4"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {label(
            t("modal.wilaya"),
            <select className={fInput} {...register("wilaya_code")}>
              <option value="">{t("simulator.any_wilaya")}</option>
              {WILAYA_OPTIONS.map((w) => (
                <option key={w.code} value={w.code}>
                  {w.code} · {locale === "ar" ? w.name_ar : w.name}
                </option>
              ))}
            </select>,
          )}
          {label(t("simulator.date"), <input type="datetime-local" className={fInput} {...register("at")} />)}
          {zoneScoped && (
            <>
              {label(
                t("modal.zone"),
                <select
                  className={fInput}
                  {...register("zone_id", { onChange: (e) => e.target.value && setValue("tier", "") })}
                >
                  <option value="">{t("modal.any_zone")}</option>
                  {liveZones(zones).map((z) => (
                    <option key={z.id} value={z.id}>
                      {z.name} · {tierName(tiers, z.tier, locale)}
                    </option>
                  ))}
                </select>,
              )}
              {label(
                t("modal.tier"),
                <select className={fInput} {...register("tier", { onChange: (e) => e.target.value && setValue("zone_id", "") })}>
                  <option value="">{t("modal.any_tier")}</option>
                  {liveTiers(tiers).map((x) => (
                    <option key={x.code} value={x.code}>
                      {tierName(tiers, x.code, locale)}
                    </option>
                  ))}
                </select>,
              )}
            </>
          )}
          {scenario === "store" && (
            <>
              {label(t("simulator.subtotal"), numInput("subtotal", "2000"))}
              {label(t("simulator.delivery_fee"), numInput("delivery_fee", storeId ? t("simulator.delivery_fee_store") : "200"))}
              <div className="sm:col-span-2">
                <span className="block text-[12px] text-subtext mb-1">{t("modal.merchant")}</span>
                <PartnerPicker kind="merchant" value={merchant} onChange={(m) => {
                    setMerchant(m);
                    setValue("store_id", "");
                  }}
                />
              </div>
              {merchant &&
                label(
                  t("simulator.store"),
                  <select className={fInput} {...register("store_id")}>
                    <option value="">{t("simulator.store_none")}</option>
                    {storeList.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.city ? `${st.name} · ${st.city}` : st.name}
                      </option>
                    ))}
                  </select>,
                )}
            </>
          )}
          {scenario === "courier" && (
            <>
              <div>
                <span className="block text-[12px] text-subtext mb-1">{t("simulator.vehicle")}</span>
                <VehiclePicker service="courier" value={vehicle} onChange={(v) => setValue("vehicle", v)} />
              </div>
              {!routed && label(t("simulator.km"), numInput("km", "5"))}
              {label(t("simulator.stops"), numInput("stops", "1"))}
            </>
          )}
          {scenario === "ride" && hasClasses && (
            <div>
              <span className="block text-[12px] text-subtext mb-1">{t("simulator.vehicle")}</span>
              <VehiclePicker service="ride" value={vehicle} onChange={(v) => setValue("vehicle", v)} />
            </div>
          )}
          {scenario === "ride" && !routed && label(t("simulator.km"), numInput("km", "5"))}
          {(scenario === "deposit" || scenario === "withdrawal") && (
            <>
              {label(t("simulator.amount"), numInput("amount", "1000"))}
              <div className="sm:col-span-2">
                <span className="block text-[12px] text-subtext mb-1">{t("modal.agent")}</span>
                <PartnerPicker kind="agent" value={agent} onChange={setAgent} />
              </div>
            </>
          )}
          {pointScenario && (
            <div className="sm:col-span-2 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[12px] text-subtext">
                  {storePoints ? (storeId ? t("simulator.store_route_hint_store") : t("simulator.store_route_hint")) : t("simulator.route_hint")}
                </span>
                <div className="flex items-center gap-2">
                  <Segmented
                    options={[
                      ["pickup", storePoints ? t("simulator.store_point") : t("simulator.pickup")],
                      ["dropoff", storePoints ? t("simulator.customer_point") : t("simulator.dropoff")],
                    ]}
                    value={storePoints && storeId ? "dropoff" : pickMode}
                    onChange={setPickMode}
                  />
                  {(pickup || dropoff) && (
                    <button
                      type="button"
                      className="text-[12px] font-semibold text-primary cursor-pointer"
                      onClick={() => {
                        setPickup(null);
                        setDropoff(null);
                        setPickMode("pickup");
                      }}
                    >
                      {t("simulator.clear_points")}
                    </button>
                  )}
                </div>
              </div>
              <PointPicker
                pickup={pickup}
                dropoff={dropoff}
                pickupLabel={t("simulator.pickup")}
                dropoffLabel={t("simulator.dropoff")}
                onPick={(p) => {
                  if (pickMode === "pickup" && !(storePoints && storeId)) {
                    setPickup(p);
                    setPickMode("dropoff");
                  } else setDropoff(p);
                }}
              />
              {routed && <p className="text-[11.5px] text-subtext">{t("simulator.km_from_map")}</p>}
              {storePoints && <p className="text-[11.5px] text-subtext">{t("simulator.store_km_from_map")}</p>}
            </div>
          )}
          <p className="text-[11.5px] text-subtext sm:col-span-2">{t("modal.tz_hint")}</p>
        </div>
      </Card>

      <div className="space-y-4 min-w-0">
        {error && <p className="text-sm text-danger">{error}</p>}
        {!result && loading && !error && (
          <Card>
            <Skeleton className="h-4 w-28 mb-3" />
            <Skeleton className="h-10 w-48 mb-5" />
            <Skeleton className="h-4 w-full mb-4" />
            <Skeleton className="h-4 w-2/3" />
          </Card>
        )}
        {result && (
          <div className={loading ? "opacity-60 transition-opacity" : "transition-opacity"}>
            {result.unavailable ? (
              <Card>
                <p className="text-sm font-semibold text-warning">{t(`simulator.unavailable.${result.unavailable}`)}</p>
              </Card>
            ) : (
              <Card>
                <p className="text-xs font-medium text-subtext uppercase tracking-wide">{t(`simulator.${payerKey}`)}</p>
                <p className="text-4xl font-bold text-text tabular-nums mt-1 mb-5">{formatDa(result.payer_total, tf)}</p>
                {(result.place || deliveryLine) && (
                  <div className="mb-4 space-y-2">
                    {result.place && <PlaceLine place={result.place} tiers={tiers} />}
                    {deliveryLine}
                  </div>
                )}
                {result.breakdown && result.breakdown.length > 0 && (
                  <div className="mb-5">
                    <p className="text-[12px] font-bold text-text mb-2">{t("simulator.breakdown")}</p>
                    <BreakdownList lines={result.breakdown} />
                  </div>
                )}
                {total > 0 && (
                  <>
                    <p className="text-[12px] font-bold text-text mb-2">
                      {scenario === "deposit" || scenario === "withdrawal" ? t("simulator.fee_split") : t("simulator.split")}
                    </p>
                    <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted">
                      {lines.map((l, i) => (
                        <div
                          key={`${l.label}-${i}`}
                          className={PARTY_BAR[l.party]}
                          style={{ width: `${(Math.abs(l.amount) / total) * 100}%` }}
                          title={`${t(`simulator.lines.${l.label}`)}: ${formatDa(l.amount, tf)}`}
                        />
                      ))}
                    </div>
                    <ul className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5">
                      {lines.map((l, i) => (
                        <li key={`${l.label}-${i}`} className="flex items-center justify-between gap-2 text-[13px]">
                          <span className="inline-flex items-center gap-2 min-w-0">
                            <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${PARTY_BAR[l.party]}`} />
                            <span className="text-subtext truncate">
                              {t(`simulator.party.${l.party}`)} · {t(`simulator.lines.${l.label}`)}
                            </span>
                          </span>
                          <span className="font-semibold text-text tabular-nums shrink-0">{formatDa(l.amount, tf)}</span>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </Card>
            )}

            {result.values.length > 0 && (
              <details className="rounded-xl border border-border bg-card mt-4 group">
                <summary className="cursor-pointer px-4 py-3 text-[13px] font-semibold text-text list-none flex items-center justify-between">
                  {t("simulator.values_used", { count: result.values.length })}
                  <span className="text-subtext text-xs group-open:rotate-180 transition-transform">▾</span>
                </summary>
                <div className="px-4 pb-3 overflow-x-auto">
                  <table className="w-full text-[13px]">
                    <thead>
                      <tr className="text-start text-subtext text-xs">
                        <th className="text-start font-medium py-1.5">{t("overrides.col.fee")}</th>
                        <th className="text-start font-medium py-1.5">{t("overrides.col.value")}</th>
                        <th className="text-start font-medium py-1.5">{t("preview.col.source")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.values.map((v) => (
                        <tr key={v.key} className="border-t border-border align-top">
                          <td className="py-2 pe-3 font-semibold text-text">{t(`fees.${v.key}.name`)}</td>
                          <td className="py-2 pe-3 text-text">{formatValueInline(v.key, v.value, tf, className)}</td>
                          <td className="py-2">
                            {v.override_id ? (
                              <Link
                                href={`/pricing/overrides?key=${v.key}&highlight=${v.override_id}`}
                                className="inline-flex flex-wrap items-center gap-1.5"
                              >
                                <Badge variant="primary">{t("preview.override")}</Badge>
                                {v.scope && (
                                  <ScopeChips
                                    service={v.scope.service}
                                    wilaya_code={v.scope.wilaya_code}
                                    zone={v.scope.zone_id ? (zones.find((z) => z.id === v.scope!.zone_id)?.name ?? t("scope.zone_generic")) : null}
                                    tier={v.scope.tier ? tierName(tiers, v.scope.tier, locale) : null}
                                    partner={v.scope.merchant_id || v.scope.agent_id ? t("partner.generic") : null}
                                  />
                                )}
                              </Link>
                            ) : (
                              <Badge>{t("preview.default")}</Badge>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </details>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
