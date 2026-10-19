"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { Badge, Card, DashIcon, DataTable, SearchBox, StatCard, StatGrid, type Column } from "@/components/ui";
import {
  DUES_PAYMENTS_CAP,
  TX_STATUS_VARIANT,
  formatDA as da,
  type MerchantDue,
  type MerchantDuesPayment,
  type MerchantDuesSummary,
} from "../data";
import type { TFn } from "../types";
import { remindMerchantDues } from "@/app/d/blink-cash/action";
import { RemindButton } from "./remind-button";
import { PendingPaymentActions, RecordPaymentButton, type PayMethod } from "./payments";

/**
 * Merchant dues — what each store owes Blink in commission, from blink-server.
 * Agent dues are out of scope here (no source yet), so nothing is shown for them.
 */
export function Dues({
  t,
  summary,
  error,
  methods = [],
}: {
  t: TFn;
  summary: MerchantDuesSummary | null;
  error?: string;
  methods?: PayMethod[];
}) {
  const [q, setQ] = useState("");
  const locale = useLocale();
  // Algiers' calendar — a fixed zone so the server render and the browser hydrate the same day.
  const date = (iso: string | null) =>
    iso
      ? new Date(iso).toLocaleDateString(locale, {
          year: "numeric",
          month: "short",
          day: "numeric",
          timeZone: "Africa/Algiers",
        })
      : null;

  if (!summary) {
    return (
      <Card>
        <div className="flex items-start gap-3">
          <span className="w-10 h-10 rounded-xl bg-danger-light text-danger inline-flex items-center justify-center shrink-0">
            <DashIcon name="warn" className="w-5 h-5" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-bold text-text">{t("dues.load_error")}</p>
            <p className="text-sm text-subtext mt-1">{t("dues.load_error_desc")}</p>
            {error && <p className="text-xs text-danger font-mono mt-2 break-all">{error}</p>}
          </div>
        </div>
      </Card>
    );
  }

  const needle = q.trim().toLowerCase();
  const owing = needle
    ? summary.owing.filter((d) =>
        [d.store_name, d.merchant_name, d.merchant_phone].some((s) => s?.toLowerCase().includes(needle))
      )
    : summary.owing;

  const dueColumns: Column<MerchantDue>[] = [
    {
      key: "store_name",
      label: t("col.store"),
      render: (r) => (
        <span className="flex items-center gap-2.5">
          <span className="w-[34px] h-[34px] rounded-full bg-soft-pink text-primary inline-flex items-center justify-center shrink-0">
            <DashIcon name="store" className="w-4 h-4" />
          </span>
          <span className="font-semibold text-text">{r.store_name}</span>
        </span>
      ),
    },
    {
      key: "merchant_name",
      label: t("col.merchant"),
      render: (r) => (
        <div>
          <p className="text-text">{r.merchant_name || "—"}</p>
          {r.merchant_phone && (
            <p className="text-xs text-subtext" dir="ltr">
              {r.merchant_phone}
            </p>
          )}
        </div>
      ),
    },
    {
      key: "commission_total",
      label: t("col.commission"),
      render: (r) => <span className="font-mono text-subtext whitespace-nowrap">{da(r.commission_total)}</span>,
    },
    {
      key: "paid_total",
      label: t("col.paid"),
      render: (r) => <span className="font-mono text-subtext whitespace-nowrap">{da(r.paid_total)}</span>,
    },
    {
      key: "outstanding",
      label: t("col.outstanding"),
      render: (r) => <span className="font-mono font-semibold text-primary whitespace-nowrap">{da(r.outstanding)}</span>,
    },
    {
      key: "last_payment_at",
      label: t("col.last_payment"),
      render: (r) => <span className="text-subtext whitespace-nowrap">{date(r.last_payment_at) ?? t("dues.never")}</span>,
    },
    {
      key: "act",
      label: "",
      sortable: false,
      render: (r) => (
        <div className="flex flex-col items-start gap-1.5">
          <RecordPaymentButton t={t} kind="merchant" partyId={r.store_id} partyName={r.store_name} methods={methods} suggested={r.outstanding} />
          <RemindButton t={t} id={r.store_id} remind={remindMerchantDues} />
        </div>
      ),
    },
  ];

  const paymentColumns: Column<MerchantDuesPayment>[] = [
    {
      key: "created_at",
      label: t("col.when"),
      render: (r) => <span className="text-subtext whitespace-nowrap">{date(r.created_at)}</span>,
    },
    { key: "store_name", label: t("col.store"), render: (r) => <span className="text-text">{r.store_name || "—"}</span> },
    { key: "merchant_name", label: t("col.merchant"), render: (r) => r.merchant_name || "—" },
    {
      key: "amount",
      label: t("col.amount"),
      render: (r) => <span className="font-mono font-semibold whitespace-nowrap">{da(r.amount)}</span>,
    },
    {
      key: "fees",
      label: t("col.fees"),
      render: (r) => <span className="font-mono text-subtext whitespace-nowrap">{r.fees ? da(r.fees) : "—"}</span>,
    },
    { key: "method", label: t("col.method"), render: (r) => <span className="capitalize text-subtext">{r.method}</span> },
    {
      key: "status",
      label: t("col.status"),
      render: (r) => (
        <Badge variant={TX_STATUS_VARIANT[r.status] ?? "default"}>{t(`tx_status.${r.status}`)}</Badge>
      ),
    },
    {
      key: "act",
      label: "",
      sortable: false,
      render: (r) => (r.status === "pending" ? <PendingPaymentActions t={t} kind="merchant" id={r.id} /> : null),
    },
  ];

  // The server lists only the latest payments; say so when the 30-day window may be cut.
  const last30 = summary.last30Exact ? t("dues.last_30") : t("dues.last_30_capped", { n: DUES_PAYMENTS_CAP });

  return (
    <>
      <StatGrid cols={4}>
        <StatCard
          label={t("dues.total")}
          value={da(summary.totalOutstanding)}
          variant="warning"
          icon="dollar"
          change={t("dues.total_chg")}
        />
        <StatCard
          label={t("dues.stores")}
          value={summary.owing.length}
          variant="danger"
          icon="store"
          change={t("dues.stores_chg")}
        />
        <StatCard
          label={t("dues.collected")}
          value={da(summary.paidLast30)}
          variant="success"
          icon="trending"
          change={last30}
        />
        <StatCard
          label={t("dues.payments")}
          value={summary.paymentsLast30}
          variant="primary"
          icon="card"
          change={last30}
        />
      </StatGrid>

      <div className="flex items-center gap-3 mb-[18px]">
        <SearchBox placeholder={t("dues.search")} value={q} onChange={setQ} />
      </div>
      <div className="mb-7">
        <DataTable
          columns={dueColumns}
          data={owing}
          keyField="store_id"
          emptyMessage={needle ? t("dues.empty_filtered") : t("dues.empty")}
        />
      </div>

      <Card
        title={t("dues.payments_title")}
        description={
          summary.paymentsCapped ? t("dues.payments_desc_capped", { n: summary.payments.length }) : t("dues.payments_desc")
        }
      >
        <DataTable columns={paymentColumns} data={summary.payments} emptyMessage={t("dues.payments_empty")} />
      </Card>
    </>
  );
}
