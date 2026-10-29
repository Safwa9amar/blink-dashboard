"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Badge, Card, DashIcon, PageHeader, StatCard, StatGrid, btnSecondary } from "@/components/ui";
import { OpsMap } from "@/components/map/ops-map";
import { relativeTime } from "@/features/overview/components/format";
import { shortRef, statusVariant } from "@/features/riders";
import { formatDateTime } from "@/features/verification";
import { DetailField, PersonValue, RatingStars, StopItem, stopMarkers } from "@/features/orders";
import type { TripDetail } from "@/features/trips";

interface Props {
  trip: TripDetail;
  canOpenRiders: boolean;
  canOpenOrders: boolean;
}

export default function TripDetailClient({ trip: x, canOpenRiders, canOpenOrders }: Props) {
  const t = useTranslations("trips");
  const to = useTranslations("orders");
  const tc = useTranslations("common");
  const locale = useLocale();
  const dash = "—";

  const statusLabel = (v: string) => (t.has(`statuses.${v}` as never) ? t(`statuses.${v}` as never) : v.replace(/_/g, " "));
  const disputeLabel = (v: string) => (t.has(`disputes.${v}` as never) ? t(`disputes.${v}` as never) : v.replace(/_/g, " "));
  const orderLabel = (group: "types" | "statuses", v: string) =>
    to.has(`${group}.${v}` as never) ? to(`${group}.${v}` as never) : v.replace(/_/g, " ");
  const da = (n: number) => `${n.toLocaleString("en-US", { maximumFractionDigits: 2 })} ${tc("da")}`;
  const pct = (r: number) => `${Number((r * 100).toFixed(2))}%`;
  const date = (iso: string) => formatDateTime(iso, locale);
  const duration = (min: number) =>
    min >= 60 ? t("detail.hours_minutes", { h: Math.floor(min / 60), m: min % 60 }) : t("detail.minutes", { n: min });
  const none = (text: string) => <p className="py-6 text-center text-[13px] text-subtext">{text}</p>;

  const markers = stopMarkers(x.pickup, x.dropoff ? [x.dropoff] : []);
  const hasMap = markers.length > 0 || x.path.length > 0;
  const hasIssues = x.disputeStatus || x.cancellationReason || x.notes || x.fraudNotice || (x.penaltyAmount ?? 0) > 0;
  const ref = x.displayId || `#${shortRef(x.id)}`;

  return (
    <div>
      <PageHeader title={t("detail.heading", { ref })} description={t("detail.page_description")} />

      <Card className="mb-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="min-w-0">
            <p className="text-base font-semibold text-text truncate">
              {x.pickup?.label || dash} → {x.dropoff?.label || dash}
            </p>
            <p className="font-mono text-xs text-primary select-all">{x.id}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={statusVariant(x.status)}>{statusLabel(x.status)}</Badge>
            {x.disputeStatus && <Badge variant="warning">{disputeLabel(x.disputeStatus)}</Badge>}
            <span className="text-xs text-subtext" title={date(x.createdAt)}>
              {t("detail.created_on", { date: relativeTime(x.createdAt, locale) })}
            </span>
          </div>
          <div className="ms-auto flex flex-wrap gap-2.5">
            {x.order && canOpenOrders && (
              <Link href={`/orders/${x.order.id}`} className={btnSecondary}>
                <DashIcon name="package" className="w-4 h-4" />
                {t("detail.open_order")}
              </Link>
            )}
            <Link href="/trips" className={btnSecondary}>
              <DashIcon name="chevron-left" className="w-4 h-4 rtl:rotate-180" />
              {t("detail.back")}
            </Link>
          </div>
        </div>
      </Card>

      <StatGrid cols={4}>
        <StatCard label={t("detail.stat_net")} icon="wallet" variant="success" value={x.netPayout !== null ? da(x.netPayout) : dash} />
        <StatCard label={t("detail.stat_estimated")} icon="dollar" variant="primary" value={x.estimatedPayout !== null ? da(x.estimatedPayout) : dash} />
        <StatCard label={t("detail.stat_distance")} icon="map" variant="info" value={x.distanceKm !== null ? t("detail.km", { n: x.distanceKm }) : dash} />
        <StatCard label={t("detail.stat_duration")} icon="clock" variant="warning" value={x.durationMinutes !== null ? duration(x.durationMinutes) : dash} />
      </StatGrid>

      <Card className="mb-4" title={t("detail.route")} description={t("detail.route_desc")}>
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-5">
          {x.pickup || x.dropoff ? (
            <ol>
              {x.pickup && <StopItem kind="pickup" title={t("pickup")} stop={x.pickup} />}
              {x.dropoff && <StopItem kind="dropoff" title={t("dropoff")} stop={x.dropoff} />}
            </ol>
          ) : (
            none(t("detail.no_stops"))
          )}
          {hasMap ? (
            <div>
              <OpsMap markers={markers} paths={x.path.length > 1 ? [{ id: "trail", points: x.path }] : []} height={340} fitKey={x.id} />
              <p className="mt-2 text-xs text-subtext">{x.path.length > 1 ? t("detail.gps_trail") : t("detail.no_trail")}</p>
            </div>
          ) : (
            none(t("detail.no_location"))
          )}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <Card title={t("detail.people")}>
          <dl className="divide-y divide-border">
            <DetailField label={t("detail.rider")}>
              {x.rider ? <PersonValue person={x.rider} href={canOpenRiders ? `/riders/${x.rider.id}` : null} unnamed={t("detail.unnamed")} /> : dash}
            </DetailField>
            <DetailField label={t("detail.customer")}>
              {x.customer ? <PersonValue person={x.customer} unnamed={t("detail.unnamed")} /> : dash}
            </DetailField>
            <DetailField label={t("detail.customer_rating")}>
              {x.customerRating !== null ? <RatingStars value={x.customerRating} /> : <span className="font-normal text-subtext">{t("detail.no_rating")}</span>}
            </DetailField>
          </dl>
        </Card>

        <Card title={t("detail.earnings")}>
          <dl className="divide-y divide-border">
            <DetailField label={t("detail.estimated_payout")}>{x.estimatedPayout !== null ? da(x.estimatedPayout) : dash}</DetailField>
            {x.commissionRate !== null && <DetailField label={t("detail.commission")}>{pct(x.commissionRate)}</DetailField>}
            {(x.penaltyAmount ?? 0) > 0 && (
              <DetailField label={t("detail.penalty")}>
                <span className="text-danger">−{da(x.penaltyAmount!)}</span>
              </DetailField>
            )}
            <DetailField label={t("detail.net_payout")}>
              <span className="text-base font-semibold tabular-nums">{x.netPayout !== null ? da(x.netPayout) : dash}</span>
            </DetailField>
          </dl>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title={t("detail.order")}>
          {x.order ? (
            <dl className="divide-y divide-border">
              <DetailField label={t("detail.order_ref")}>
                {canOpenOrders ? (
                  <Link href={`/orders/${x.order.id}`} className="font-mono text-primary hover:underline">
                    #{shortRef(x.order.id)}
                  </Link>
                ) : (
                  <span className="font-mono">#{shortRef(x.order.id)}</span>
                )}
              </DetailField>
              <DetailField label={to("type")}>{orderLabel("types", x.order.type)}</DetailField>
              <DetailField label={to("status")}>
                <Badge variant={statusVariant(x.order.status)}>{orderLabel("statuses", x.order.status)}</Badge>
              </DetailField>
              <DetailField label={to("total")}>{da(x.order.total)}</DetailField>
              <DetailField label={tc("created")}>{date(x.order.createdAt)}</DetailField>
            </dl>
          ) : (
            none(t("detail.no_order"))
          )}
        </Card>

        <Card title={t("detail.issues")}>
          {hasIssues ? (
            <dl className="divide-y divide-border">
              {x.disputeStatus && (
                <DetailField label={t("detail.dispute")}>
                  <Badge variant="warning">{disputeLabel(x.disputeStatus)}</Badge>
                </DetailField>
              )}
              {x.cancellationReason && <DetailField label={t("detail.cancellation_reason")}>{x.cancellationReason.replace(/_/g, " ")}</DetailField>}
              {x.fraudNotice && (
                <DetailField label={t("detail.fraud_notice")}>
                  <span className="text-danger">{x.fraudNotice}</span>
                </DetailField>
              )}
              {x.notes && <DetailField label={t("detail.notes")}>{x.notes}</DetailField>}
              {(x.penaltyAmount ?? 0) > 0 && <DetailField label={t("detail.penalty")}>{da(x.penaltyAmount!)}</DetailField>}
            </dl>
          ) : (
            none(t("detail.no_issues"))
          )}
          <p className="mt-3 text-xs text-subtext">{t("detail.updated", { date: date(x.updatedAt) })}</p>
        </Card>
      </div>
    </div>
  );
}
