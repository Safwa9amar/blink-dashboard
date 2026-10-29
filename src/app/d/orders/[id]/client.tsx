"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Badge, Card, DashIcon, PageHeader, StatCard, StatGrid, btnSecondary } from "@/components/ui";
import { OpsMap } from "@/components/map/ops-map";
import { relativeTime } from "@/features/overview/components/format";
import { shortRef, statusVariant, type Block } from "@/features/riders";
import { formatDateTime } from "@/features/verification";
import {
  DetailField,
  PersonValue,
  RatingStars,
  StopItem,
  isStoreOrder,
  minutesBetween,
  stopMarkers,
  type OrderDetail,
  type OrderTrip,
} from "@/features/orders";

interface Props {
  order: OrderDetail;
  trips: Block<OrderTrip[]>;
  canOpenRiders: boolean;
  canOpenTrips: boolean;
}

export default function OrderDetailClient({ order: o, trips, canOpenRiders, canOpenTrips }: Props) {
  const t = useTranslations("orders");
  const tt = useTranslations("trips");
  const tc = useTranslations("common");
  const locale = useLocale();
  const dash = "—";

  // Enum values fall back to the raw value, humanised, so newer server values still read.
  const label = (value: string) => {
    const key = `enums.${value}`;
    return t.has(key as never) ? t(key as never) : value.replace(/_/g, " ");
  };
  const typeLabel = (v: string) => (t.has(`types.${v}` as never) ? t(`types.${v}` as never) : v.replace(/_/g, " "));
  const statusLabel = (v: string) => (t.has(`statuses.${v}` as never) ? t(`statuses.${v}` as never) : v.replace(/_/g, " "));
  // Exact amounts (service fees can be fractional), fixed en-US grouping so server and client agree.
  const da = (n: number) => `${n.toLocaleString("en-US", { maximumFractionDigits: 2 })} ${tc("da")}`;
  const pct = (r: number) => `${Number((r * 100).toFixed(2))}%`;
  const date = (iso: string) => formatDateTime(iso, locale);
  const duration = (min: number) =>
    min >= 60 ? t("detail.hours_minutes", { h: Math.floor(min / 60), m: min % 60 }) : t("detail.minutes", { n: min });
  const none = (text: string) => <p className="py-6 text-center text-[13px] text-subtext">{text}</p>;

  const deliveredAt = o.timeline.find((e) => e.step === "delivered")?.at ?? null;
  const deliveryMinutes = minutesBetween(o.createdAt, deliveredAt);
  const markers = stopMarkers(o.pickup, o.dropoffs);
  const hasMap = markers.length > 0 || o.path.length > 0;
  const r = o.reviews;
  const hasReviews = r.storeRating !== null || r.storeReview || r.riderRating !== null || r.riderReview || r.riderTags.length > 0;
  const th = "px-3 h-9 text-start text-[11px] font-semibold text-subtext uppercase tracking-wider whitespace-nowrap";
  const td = "px-3 py-2 text-[13px] whitespace-nowrap";

  return (
    <div>
      <PageHeader title={t("detail.heading", { ref: shortRef(o.id) })} description={t("detail.page_description")} />

      <Card className="mb-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="min-w-0">
            <p className="text-base font-semibold text-text truncate">{o.store?.name || typeLabel(o.type)}</p>
            <p className="font-mono text-xs text-primary select-all">{o.id}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="default">{typeLabel(o.type)}</Badge>
            <Badge variant={statusVariant(o.status)}>{statusLabel(o.status)}</Badge>
            {o.scheduledAt && <Badge variant="info">{t("detail.scheduled_for", { date: date(o.scheduledAt) })}</Badge>}
            <span className="text-xs text-subtext" title={date(o.createdAt)}>
              {t("detail.placed_on", { date: relativeTime(o.createdAt, locale) })}
            </span>
          </div>
          <div className="ms-auto flex flex-wrap gap-2.5">
            <Link href="/orders" className={btnSecondary}>
              <DashIcon name="chevron-left" className="w-4 h-4 rtl:rotate-180" />
              {t("detail.back")}
            </Link>
          </div>
        </div>
      </Card>

      <StatGrid cols={4}>
        <StatCard label={t("detail.stat_total")} icon="dollar" variant="primary" value={da(o.total)} />
        <StatCard label={t("detail.stat_delivery_fee")} icon="truck" variant="info" value={da(o.deliveryFee)} />
        <StatCard label={t("detail.stat_distance")} icon="map" variant="success" value={o.distanceKm !== null ? t("detail.km", { n: o.distanceKm }) : dash} />
        <StatCard label={t("detail.stat_duration")} icon="clock" variant="warning" value={deliveryMinutes !== null ? duration(deliveryMinutes) : dash} />
      </StatGrid>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <Card title={t("detail.people")}>
          <dl className="divide-y divide-border">
            <DetailField label={t("detail.customer")}>
              {o.customer ? <PersonValue person={o.customer} unnamed={t("detail.unnamed")} /> : dash}
            </DetailField>
            {o.ride?.passengerName && (
              <DetailField label={t("detail.passenger")}>
                {o.ride.passengerName}
                {o.ride.passengerPhone && (
                  <a href={`tel:${o.ride.passengerPhone}`} dir="ltr" className="block text-xs font-normal text-subtext hover:text-text">
                    {o.ride.passengerPhone}
                  </a>
                )}
              </DetailField>
            )}
            <DetailField label={t("detail.rider")}>
              {o.rider ? (
                <PersonValue person={o.rider} href={canOpenRiders ? `/riders/${o.rider.id}` : null} unnamed={t("detail.unnamed")} />
              ) : (
                <span className="text-subtext font-normal">{t("detail.no_rider")}</span>
              )}
            </DetailField>
            {o.store && (
              <DetailField label={t("store")}>
                {o.store.name || dash}
                {o.store.place && <span className="block text-xs font-normal text-subtext">{o.store.place}</span>}
                {o.store.phone && (
                  <a href={`tel:${o.store.phone}`} dir="ltr" className="block text-xs font-normal text-subtext hover:text-text">
                    {o.store.phone}
                  </a>
                )}
              </DetailField>
            )}
            {o.driver && (
              <DetailField label={t("detail.store_driver")}>
                {o.driver.name || dash}
                {(o.driver.vehicle || o.driver.plate) && (
                  <span className="block text-xs font-normal text-subtext">
                    {[o.driver.vehicle && label(o.driver.vehicle), o.driver.plate].filter(Boolean).join(" · ")}
                  </span>
                )}
                {o.driver.phone && (
                  <a href={`tel:${o.driver.phone}`} dir="ltr" className="block text-xs font-normal text-subtext hover:text-text">
                    {o.driver.phone}
                  </a>
                )}
              </DetailField>
            )}
          </dl>
        </Card>

        <Card title={t("detail.payment")}>
          {isStoreOrder(o.type) && (
            <div className="mb-3 overflow-x-auto rounded-xl border border-border">
              {o.items.length === 0 ? (
                none(t("detail.no_items"))
              ) : (
                <table className="w-full text-start">
                  <thead className="bg-card-hover">
                    <tr>
                      <th className={th}>{t("detail.col_item")}</th>
                      <th className={`${th} text-end`}>{t("detail.col_qty")}</th>
                      <th className={`${th} text-end`}>{t("detail.col_price")}</th>
                      <th className={`${th} text-end`}>{t("detail.col_amount")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {o.items.map((item, i) => (
                      <tr key={i}>
                        <td className={`${td} whitespace-normal`}>{item.name || dash}</td>
                        <td className={`${td} text-end tabular-nums`}>{item.quantity}</td>
                        <td className={`${td} text-end tabular-nums`}>{da(item.unitPrice)}</td>
                        <td className={`${td} text-end tabular-nums`}>{da(item.unitPrice * item.quantity)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
          <dl className="divide-y divide-border">
            {isStoreOrder(o.type) && <DetailField label={t("detail.subtotal")}>{da(o.subtotal)}</DetailField>}
            <DetailField label={t("detail.delivery_fee")}>{da(o.deliveryFee)}</DetailField>
            {o.serviceFee > 0 && <DetailField label={t("detail.service_fee")}>{da(o.serviceFee)}</DetailField>}
            {o.discount > 0 && (
              <DetailField label={t("detail.discount")}>
                <span className="text-success">−{da(o.discount)}</span>
              </DetailField>
            )}
            {o.coupon && (
              <DetailField label={t("detail.coupon")}>
                <span className="font-mono">{o.coupon.code}</span>
                {o.coupon.title && <span className="block text-xs font-normal text-subtext">{o.coupon.title}</span>}
              </DetailField>
            )}
            {o.courier?.paidBy && <DetailField label={t("detail.paid_by")}>{label(o.courier.paidBy)}</DetailField>}
            <DetailField label={t("total")}>
              <span className="text-base font-semibold tabular-nums">{da(o.total)}</span>
            </DetailField>
          </dl>
        </Card>
      </div>

      <Card className="mb-4" title={t("detail.route")} description={t("detail.route_desc")}>
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-5">
          <div>
            {o.pickup || o.dropoffs.length > 0 ? (
              <ol>
                {o.pickup && <StopItem kind="pickup" title={t("detail.pickup")} stop={o.pickup} />}
                {o.dropoffs.map((d, i) => (
                  <StopItem
                    key={i}
                    kind="dropoff"
                    title={o.dropoffs.length > 1 ? t("detail.dropoff_n", { n: i + 1 }) : t("detail.dropoff")}
                    stop={d}
                    doneText={d.doneAt ? t("detail.delivered_at", { date: date(d.doneAt) }) : null}
                  />
                ))}
              </ol>
            ) : (
              none(t("detail.no_stops"))
            )}
            {(o.durationMinutes !== null || o.courier || o.ride?.femaleRiderOnly) && (
              <dl className="mt-4 divide-y divide-border border-t border-border">
                {o.durationMinutes !== null && <DetailField label={t("detail.estimated_duration")}>{duration(o.durationMinutes)}</DetailField>}
                {o.courier && (o.courier.parcelType || o.courier.parcelSize) && (
                  <DetailField label={t("detail.parcel")}>
                    {[o.courier.parcelType && label(o.courier.parcelType), o.courier.parcelSize && label(o.courier.parcelSize)].filter(Boolean).join(" · ")}
                    {o.courier.parcelNote && <span className="block text-xs font-normal text-subtext">{o.courier.parcelNote}</span>}
                  </DetailField>
                )}
                {o.ride?.femaleRiderOnly && (
                  <DetailField label={t("detail.female_only")}>
                    <Badge variant="primary">{t("detail.yes")}</Badge>
                  </DetailField>
                )}
              </dl>
            )}
          </div>
          {hasMap ? (
            <div>
              <OpsMap markers={markers} paths={o.path.length > 1 ? [{ id: "trail", points: o.path }] : []} height={340} fitKey={o.id} />
              <p className="mt-2 text-xs text-subtext">{o.path.length > 1 ? t("detail.gps_trail") : t("detail.no_trail")}</p>
            </div>
          ) : (
            none(t("detail.no_location"))
          )}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <Card title={t("detail.timeline")}>
          <ol className="space-y-3">
            {o.timeline.map((e) => {
              const after = minutesBetween(o.createdAt, e.at);
              return (
                <li key={e.step} className="flex items-start gap-3 text-[13px]">
                  <span
                    aria-hidden
                    className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${e.step === "canceled" ? "bg-danger" : e.step === "delivered" ? "bg-success" : "bg-primary"}`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-text">{t(`detail.steps.${e.step}`)}</p>
                    <p className="text-xs text-subtext">{date(e.at)}</p>
                  </div>
                  {e.step !== "placed" && after !== null && (
                    <span className="text-xs text-subtext tabular-nums whitespace-nowrap">+{duration(after)}</span>
                  )}
                </li>
              );
            })}
          </ol>
          {o.cancel && (
            <dl className="mt-4 divide-y divide-border rounded-xl border border-danger/30 bg-danger-light px-3">
              {o.cancel.by && <DetailField label={t("detail.canceled_by")}>{label(o.cancel.by)}</DetailField>}
              {o.cancel.reason && <DetailField label={t("detail.reason")}>{label(o.cancel.reason)}</DetailField>}
              {o.cancel.note && <DetailField label={t("detail.note")}>{o.cancel.note}</DetailField>}
              {o.cancel.rejectReason && <DetailField label={t("detail.reject_reason")}>{o.cancel.rejectReason}</DetailField>}
            </dl>
          )}
        </Card>

        <Card title={t("detail.reviews")}>
          {hasReviews ? (
            <dl className="divide-y divide-border">
              {r.storeRating !== null && (
                <DetailField label={t("detail.store_rating")}>
                  <RatingStars value={r.storeRating} />
                </DetailField>
              )}
              {r.storeReview && <DetailField label={t("detail.store_review")}>“{r.storeReview}”</DetailField>}
              {r.storeReply && (
                <DetailField label={t("detail.store_reply")}>
                  <span className="font-normal text-subtext">{r.storeReply}</span>
                </DetailField>
              )}
              {r.riderRating !== null && (
                <DetailField label={t("detail.rider_rating")}>
                  <RatingStars value={r.riderRating} />
                </DetailField>
              )}
              {r.riderReview && <DetailField label={t("detail.rider_review")}>“{r.riderReview}”</DetailField>}
              {r.riderTags.length > 0 && (
                <DetailField label={t("detail.rider_tags")}>
                  <span className="flex flex-wrap justify-end gap-1.5">
                    {r.riderTags.map((tag) => (
                      <Badge key={tag} variant="success">
                        {label(tag)}
                      </Badge>
                    ))}
                  </span>
                </DetailField>
              )}
            </dl>
          ) : (
            none(t("detail.no_reviews"))
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title={t("detail.dispatch")}>
          <dl className="divide-y divide-border">
            <DetailField label={t("detail.vehicle")}>{o.vehicleType ? label(o.vehicleType) : dash}</DetailField>
            {o.deliveryMode && <DetailField label={t("detail.delivery_mode")}>{label(o.deliveryMode)}</DetailField>}
            {o.merchantStatus && (
              <DetailField label={t("detail.merchant_status")}>
                <Badge variant={statusVariant(o.merchantStatus)}>{label(o.merchantStatus)}</Badge>
              </DetailField>
            )}
            <DetailField label={t("detail.zone")}>{o.zone ?? dash}</DetailField>
            <DetailField label={t("detail.tier")}>{o.tier ? label(o.tier) : dash}</DetailField>
            {o.commissionRate !== null && <DetailField label={t("detail.commission")}>{pct(o.commissionRate)}</DetailField>}
            {o.stampDutyRate !== null && <DetailField label={t("detail.stamp_duty")}>{pct(o.stampDutyRate)}</DetailField>}
            {o.estimatedTime && <DetailField label={t("detail.estimated_time")}>{o.estimatedTime}</DetailField>}
          </dl>
        </Card>

        <Card title={t("detail.trips")} description={t("detail.trips_desc")} padding={false} className="overflow-hidden">
          {trips.error ? (
            <p role="alert" className="p-5 text-sm text-danger">
              {t("detail.load_error", { error: trips.error })}
            </p>
          ) : trips.data.length === 0 ? (
            none(t("detail.no_trips"))
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-start">
                <thead className="bg-card-hover">
                  <tr>
                    <th className={th}>{t("detail.col_trip")}</th>
                    <th className={th}>{t("status")}</th>
                    <th className={th}>{t("detail.col_payout")}</th>
                    <th className={th}>{tc("created")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {trips.data.map((trip) => (
                    <tr key={trip.id}>
                      <td className={`${td} font-mono text-primary`}>
                        {canOpenTrips ? (
                          <Link href={`/trips/${trip.id}`} className="hover:underline">
                            {trip.displayId || `#${shortRef(trip.id)}`}
                          </Link>
                        ) : (
                          trip.displayId || `#${shortRef(trip.id)}`
                        )}
                      </td>
                      <td className={td}>
                        <Badge variant={statusVariant(trip.status)}>
                          {tt.has(`statuses.${trip.status}` as never) ? tt(`statuses.${trip.status}` as never) : trip.status}
                        </Badge>
                      </td>
                      <td className={`${td} tabular-nums`}>{da(trip.payout)}</td>
                      <td className={`${td} text-subtext`}>{date(trip.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
