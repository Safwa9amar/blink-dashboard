"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Avatar, Badge, Card, DashIcon, PageHeader, StatCard, StatGrid, btnPrimary, btnSecondary } from "@/components/ui";
import { money, relativeTime } from "@/features/overview/components/format";
import {
  shortRef,
  statusVariant,
  VERIFICATION_VARIANT,
  type ActivityOrder,
  type ActivityTrip,
  type ActivityTx,
  type Block,
  type RiderProfileView,
} from "@/features/riders";
import {
  DocumentTile,
  PartnerDocActions,
  RIDER_NOTE_MAX,
  formatDateTime,
  riderDocLabel,
  visibleDocGroups,
  type RiderDocSlot,
} from "@/features/verification";
import { reviewRiderDocument } from "@/app/d/verification/partner-action";
import { PartnerNotice, type PartnerNoticeValue } from "@/features/verification/components/partner-notice";
import { RequestVerificationDialog } from "@/features/riders/components/request-verification-dialog";
import { requestRiderVerification } from "./action";

export interface RiderStats {
  delivered: Block<number>;
  trips: Block<number>;
  volume: Block<number>;
}

interface Props {
  profile: RiderProfileView;
  docs: Block<RiderDocSlot[]>;
  orders: Block<ActivityOrder[]>;
  trips: Block<ActivityTrip[]>;
  transactions: Block<ActivityTx[]>;
  stats: RiderStats;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 text-[13px]">
      <dt className="text-subtext shrink-0">{label}</dt>
      <dd className="font-medium text-text text-end break-words min-w-0">{children}</dd>
    </div>
  );
}

export default function RiderDetailClient({ profile: p, docs, orders, trips, transactions, stats }: Props) {
  const t = useTranslations("riders");
  const tv = useTranslations("verification");
  const router = useRouter();
  const locale = useLocale();
  const [requesting, setRequesting] = useState(false);
  const [notice, setNotice] = useState<PartnerNoticeValue | null>(null);
  const dash = "—";
  const name = p.name || t("unnamed");

  // Enum values (statuses, order / transaction types) fall back to the raw value, humanised.
  const label = (value: string) => {
    const key = `enums.${value}`;
    return t.has(key as never) ? t(key as never) : value.replace(/_/g, " ");
  };
  const date = (iso: string) => formatDateTime(iso, locale);
  const failed = (e: string) => (
    <p role="alert" className="text-sm text-danger">
      {t("detail.load_error", { error: e })}
    </p>
  );
  const none = (text: string) => <p className="py-6 text-center text-[13px] text-subtext">{text}</p>;

  const groups = visibleDocGroups(docs.data);
  const hasLocation = p.latitude !== null && p.longitude !== null;
  const th = "px-3 h-9 text-start text-[11px] font-semibold text-subtext uppercase tracking-wider whitespace-nowrap";
  const td = "px-3 py-2 text-[13px] whitespace-nowrap";

  return (
    <div>
      <PageHeader title={name} description={t("detail.page_description")} />

      <PartnerNotice t={tv as never} notice={notice} onDismiss={() => setNotice(null)} />

      <Card className="mb-4">
        <div className="flex flex-wrap items-center gap-4">
          <Avatar name={p.name || p.riderId} />
          <div className="min-w-0">
            <p className="text-base font-semibold text-text truncate">{name}</p>
            <p className="font-mono text-xs text-primary">{p.riderId || dash}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={VERIFICATION_VARIANT[p.verification]}>{t(`verification.${p.verification}`)}</Badge>
            <Badge variant={p.available ? "success" : "default"}>{p.available ? t("detail.online") : t("detail.offline")}</Badge>
            <span className="text-xs text-subtext">
              {t("detail.joined_on", { date: p.joinedAt ? new Date(p.joinedAt).toLocaleDateString(locale, { timeZone: "Africa/Algiers" }) : dash })}
            </span>
          </div>
          <div className="ms-auto flex flex-wrap gap-2.5">
            {p.phone && (
              <a href={`tel:${p.phone}`} className={btnPrimary}>
                {t("detail.call")}
              </a>
            )}
            <button
              type="button"
              onClick={() => setRequesting(true)}
              className={`${btnSecondary} border-warning/40 bg-warning-light text-warning hover:border-warning`}
            >
              {t("request.button")}
            </button>
            <Link href="/riders" className={btnSecondary}>
              <DashIcon name="chevron-left" className="w-4 h-4 rtl:rotate-180" />
              {t("detail.back")}
            </Link>
          </div>
        </div>
      </Card>

      {requesting && (
        <RequestVerificationDialog
          name={name}
          vehicleType={p.vehicleType}
          approved={p.verification === "approved"}
          docs={docs.data}
          onClose={() => setRequesting(false)}
          submit={async (documents, note) => {
            const outcome = await requestRiderVerification(p.id, documents, note);
            return outcome.ok ? { ok: true } : { ok: false, message: outcome.message };
          }}
          onSent={() => {
            setRequesting(false);
            setNotice({ tone: "success", text: t("request.sent", { name }) });
            router.refresh();
          }}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <Card title={t("detail.profile")}>
          <dl className="divide-y divide-border">
            <Field label={t("phone")}>
              <span dir="ltr">{p.phone ?? dash}</span>
            </Field>
            <Field label={t("detail.email")}>
              <span dir="ltr">{p.email ?? dash}</span>
            </Field>
            <Field label={t("wilaya")}>{p.wilaya ?? dash}</Field>
            {p.active !== null && (
              <Field label={t("detail.account")}>
                <Badge variant={p.active ? "success" : "danger"}>{p.active ? t("detail.active") : t("detail.inactive")}</Badge>
              </Field>
            )}
            <Field label={t("detail.last_location")}>
              {hasLocation ? (
                <>
                  <span dir="ltr">
                    {p.latitude!.toFixed(5)}, {p.longitude!.toFixed(5)}
                  </span>
                  {p.locationUpdatedAt && (
                    <span className="block text-xs font-normal text-subtext">
                      {t("detail.location_updated", { when: relativeTime(p.locationUpdatedAt, locale) })}
                      {" · "}
                      {date(p.locationUpdatedAt)}
                    </span>
                  )}
                </>
              ) : (
                t("detail.no_location")
              )}
            </Field>
          </dl>
        </Card>

        <Card title={t("detail.vehicle")}>
          {p.vehicle || p.vehicleType ? (
            <dl className="divide-y divide-border">
              <Field label={t("detail.type")}>
                {p.vehicleType ? <Badge variant={p.vehicleType === "motorcycle" ? "info" : "default"}>{t(`types.${p.vehicleType}`)}</Badge> : dash}
              </Field>
              <Field label={t("detail.brand")}>{p.vehicle?.brand || dash}</Field>
              <Field label={t("detail.model")}>{p.vehicle?.model || dash}</Field>
              <Field label={t("detail.plate")}>
                {p.vehicleType === "bicycle" ? t("no_plate") : <span dir="ltr">{p.vehicle?.plate || dash}</span>}
              </Field>
              <Field label={t("detail.year")}>{p.vehicle?.year || dash}</Field>
              <Field label={t("detail.color")}>{p.vehicle?.color || dash}</Field>
              <Field label={t("detail.category")}>
                {p.vehicle?.category ? t(`categories.${p.vehicle.category}` as "categories.standard") : dash}
              </Field>
            </dl>
          ) : (
            none(t("detail.no_vehicle"))
          )}
        </Card>
      </div>

      <Card
        className="mb-4"
        title={t("detail.documents")}
        description={t("detail.documents_desc")}
      >
        {docs.error ? (
          failed(docs.error)
        ) : (
          <div className="space-y-5">
            {groups.map(({ group, docs: groupDocs }) => (
              <section key={group}>
                <h4 className="text-xs font-semibold text-text mb-2">{tv(`partners.rider.group.${group}` as never)}</h4>
                <div className="grid grid-cols-[repeat(auto-fill,minmax(10rem,1fr))] gap-3">
                  {groupDocs.map((d) => {
                    const docLabel = riderDocLabel(tv as never, d.key);
                    return (
                      <DocumentTile
                        key={d.key}
                        t={tv as never}
                        label={docLabel}
                        url={d.url}
                        trusted={d.trusted}
                        isPdf={d.isPdf}
                        status={d.status}
                        note={d.note}
                        actions={
                          <PartnerDocActions
                            t={tv as never}
                            label={docLabel}
                            status={d.status}
                            untrusted={!!d.url && !d.trusted}
                            noteVariant="reject_rider_doc"
                            noteMax={RIDER_NOTE_MAX}
                            submit={(verdict, reason) =>
                              reviewRiderDocument({ riderId: p.id, document: d.key, path: d.path ?? "" }, verdict, reason)
                            }
                            onOutcome={() => router.refresh()}
                          />
                        }
                      />
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </Card>

      <h2 className="text-sm font-semibold text-text mb-3">{t("detail.activity")}</h2>
      <StatGrid cols={4}>
        <StatCard label={t("detail.stat_deliveries")} icon="bike" variant="success" value={stats.delivered.error ? dash : stats.delivered.data.toLocaleString("en-US")} />
        <StatCard label={t("detail.stat_trips")} icon="map" variant="info" value={stats.trips.error ? dash : stats.trips.data.toLocaleString("en-US")} />
        <StatCard label={t("detail.stat_volume")} icon="clock" variant="primary" value={stats.volume.error ? dash : money(stats.volume.data)} />
      </StatGrid>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Card title={t("detail.recent_orders")} padding={false} className="overflow-hidden xl:col-span-2">
          {orders.error ? (
            <div className="p-5">{failed(orders.error)}</div>
          ) : orders.data.length === 0 ? (
            none(t("detail.no_orders"))
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-start">
                <thead className="bg-card-hover">
                  <tr>
                    <th className={th}>{t("detail.col_ref")}</th>
                    <th className={th}>{t("detail.col_store")}</th>
                    <th className={th}>{t("detail.col_type")}</th>
                    <th className={th}>{t("detail.col_status")}</th>
                    <th className={th}>{t("detail.col_total")}</th>
                    <th className={th}>{t("detail.col_date")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {orders.data.map((o) => (
                    <tr key={o.id}>
                      <td className={`${td} font-mono text-primary`}>#{shortRef(o.id)}</td>
                      <td className={td}>{o.store || dash}</td>
                      <td className={td}>{label(o.type)}</td>
                      <td className={td}><Badge variant={statusVariant(o.status)}>{label(o.status)}</Badge></td>
                      <td className={`${td} tabular-nums`}>{money(o.total)}</td>
                      <td className={`${td} text-subtext`}>{date(o.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card title={t("detail.recent_trips")} padding={false} className="overflow-hidden">
          {trips.error ? (
            <div className="p-5">{failed(trips.error)}</div>
          ) : trips.data.length === 0 ? (
            none(t("detail.no_trips"))
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-start">
                <thead className="bg-card-hover">
                  <tr>
                    <th className={th}>{t("detail.col_ref")}</th>
                    <th className={th}>{t("detail.col_route")}</th>
                    <th className={th}>{t("detail.col_status")}</th>
                    <th className={th}>{t("detail.col_payout")}</th>
                    <th className={th}>{t("detail.col_date")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {trips.data.map((r) => (
                    <tr key={r.id}>
                      <td className={`${td} font-mono text-primary`}>#{shortRef(r.id)}</td>
                      <td className={`${td} max-w-[14rem] truncate`} title={`${r.from} → ${r.to}`}>
                        {r.from || dash} → {r.to || dash}
                      </td>
                      <td className={td}><Badge variant={statusVariant(r.status)}>{label(r.status)}</Badge></td>
                      <td className={`${td} tabular-nums`}>{money(r.payout)}</td>
                      <td className={`${td} text-subtext`}>{date(r.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card title={t("detail.recent_transactions")} padding={false} className="overflow-hidden">
          {transactions.error ? (
            <div className="p-5">{failed(transactions.error)}</div>
          ) : transactions.data.length === 0 ? (
            none(t("detail.no_transactions"))
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-start">
                <thead className="bg-card-hover">
                  <tr>
                    <th className={th}>{t("detail.col_ref")}</th>
                    <th className={th}>{t("detail.col_type")}</th>
                    <th className={th}>{t("detail.col_status")}</th>
                    <th className={th}>{t("detail.col_amount")}</th>
                    <th className={th}>{t("detail.col_total")}</th>
                    <th className={th}>{t("detail.col_date")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {transactions.data.map((x) => (
                    <tr key={x.id}>
                      <td className={`${td} font-mono text-primary`}>#{shortRef(x.id)}</td>
                      <td className={td}>{label(x.type)}</td>
                      <td className={td}><Badge variant={statusVariant(x.status)}>{label(x.status)}</Badge></td>
                      <td className={`${td} tabular-nums`}>{money(x.amount)}</td>
                      <td className={`${td} tabular-nums`}>{money(x.total)}</td>
                      <td className={`${td} text-subtext`}>{date(x.createdAt)}</td>
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
