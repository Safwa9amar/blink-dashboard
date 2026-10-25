"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Badge, Button, Card, DataTable, type Column } from "@/components/ui";
import { approveTransaction, rejectTransaction } from "@/app/d/blink-cash/ops-action";
import type { ReviewQueue } from "@/app/d/blink-cash/ops-data";
import { formatDA } from "../data";
import { formatDateTime, safeHttpUrl, shortId } from "../lib/format";
import type { PendingPayment } from "../ops-types";
import type { LedgerRow, TFn } from "../types";
import { OnlinePaymentsReview } from "./online-payments";
import { DuesMethod, PendingPaymentActions } from "./payments";
import { ActionDialog, LoadError, MigrationNotice, useDialog } from "./ops-shared";

function ReviewActions({ t, row }: { t: TFn; row: LedgerRow }) {
  const ok = useDialog();
  const no = useDialog();
  return (
    <div className="flex gap-1.5">
      <Button size="xs" icon="check" onClick={ok.show}>
        {t("tx.action_approve")}
      </Button>
      <Button size="xs" variant="danger" onClick={no.show}>
        {t("tx.action_reject")}
      </Button>
      <ActionDialog
        t={t}
        open={ok.open}
        onClose={ok.hide}
        title={t("tx.action_approve")}
        description={t("tx.confirm_approve")}
        confirmLabel={t("tx.action_approve")}
        fields={[{ key: "reference", label: t("tx.reference"), kind: "text", required: true, ltr: true, initial: row.reference ?? "" }]}
        onSubmit={(v) => approveTransaction(row.id, v.reference)}
      />
      <ActionDialog
        t={t}
        open={no.open}
        onClose={no.hide}
        title={t("tx.action_reject")}
        description={t("tx.confirm_reject")}
        confirmLabel={t("tx.action_reject")}
        danger
        fields={[{ key: "reason", label: t("tx.reason"), kind: "textarea", required: true, hint: t("tx.reason_hint") }]}
        onSubmit={(v) => rejectTransaction(row.id, v.reason)}
      />
    </div>
  );
}

export function Review({ queue }: { queue: ReviewQueue }) {
  const t = useTranslations("blink_cash") as unknown as TFn;
  const locale = useLocale();

  const txColumns: Column<LedgerRow>[] = [
    {
      key: "id",
      label: t("col.txn"),
      render: (r) => (
        <Link href={`/blink-cash/ledger/${r.id}`} className="font-mono text-primary font-semibold hover:underline">
          {shortId(r.id)}
        </Link>
      ),
    },
    {
      key: "userName",
      label: t("col.account"),
      render: (r) => (
        <div className="min-w-[120px]">
          <p dir="auto">{r.userName ?? "—"}</p>
          {r.userPhone && (
            <p className="text-xs text-subtext" dir="ltr">
              {r.userPhone}
            </p>
          )}
        </div>
      ),
    },
    { key: "type", label: t("col.type"), render: (r) => <Badge variant={r.type === "deposit" ? "success" : "info"}>{t(`tx_type.${r.type}`)}</Badge> },
    { key: "amount", label: t("col.amount"), render: (r) => <span className="font-mono font-semibold whitespace-nowrap">{formatDA(r.amount)}</span> },
    {
      key: "reference",
      label: t("review.col_detail"),
      sortable: false,
      render: (r) => {
        const receipt = safeHttpUrl(r.receipt_url);
        return (
          <div className="min-w-[140px] text-xs">
            {r.type === "deposit" ? (
              <p className="font-mono" dir="ltr">
                {r.reference ?? "—"}
              </p>
            ) : (
              <>
                <p dir="auto">{[r.payout_account?.type && t(`acct_type.${r.payout_account.type}`), r.payout_account?.holder].filter(Boolean).join(" · ") || "—"}</p>
                <p className="font-mono text-subtext" dir="ltr">
                  {r.payout_account?.number ?? ""}
                </p>
              </>
            )}
            {receipt && (
              <a href={receipt} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                {t("tx.open_receipt")}
              </a>
            )}
          </div>
        );
      },
    },
    { key: "created_at", label: t("col.when"), render: (r) => <span className="text-subtext whitespace-nowrap">{formatDateTime(r.created_at, locale)}</span> },
    { key: "act", label: "", sortable: false, render: (r) => <ReviewActions t={t} row={r} /> },
  ];

  const payColumns: Column<PendingPayment>[] = [
    { key: "kind", label: t("review.col_party"), render: (p) => <Badge variant={p.kind === "agent" ? "warning" : "primary"}>{t(`review.kind_${p.kind}`)}</Badge> },
    {
      key: "partyName",
      label: t("review.col_name"),
      render: (p) => (
        <div>
          <p dir="auto">{p.partyName ?? "—"}</p>
          {p.storeName && (
            <p className="text-xs text-subtext" dir="auto">
              {p.storeName}
            </p>
          )}
        </div>
      ),
    },
    { key: "amount", label: t("col.amount"), render: (p) => <span className="font-mono font-semibold whitespace-nowrap">{formatDA(p.amount)}</span> },
    { key: "method", label: t("col.method"), render: (p) => <DuesMethod t={t} method={p.method} /> },
    {
      key: "reference",
      label: t("tx.reference"),
      render: (p) => (
        <span className="font-mono text-xs" dir="ltr">
          {p.reference ?? "—"}
        </span>
      ),
    },
    { key: "createdAt", label: t("col.when"), render: (p) => <span className="text-subtext whitespace-nowrap">{formatDateTime(p.createdAt, locale)}</span> },
    { key: "act", label: "", sortable: false, render: (p) => <PendingPaymentActions t={t} kind={p.kind} id={p.id} method={p.method} /> },
  ];

  return (
    <>
      {queue.migrationPending && <MigrationNotice t={t} />}
      {queue.error && !queue.migrationPending && <LoadError t={t} error={queue.error} />}
      <div className="mb-7">
        <Card title={t("review.electronic")} description={t("review.electronic_desc")}>
          <DataTable columns={txColumns} data={queue.electronic} empty={t("review.electronic_empty")} enablePagination={false} enableSorting={false} />
        </Card>
      </div>
      <div className="mb-7">
        <Card title={t("review.payments")} description={t("review.payments_desc")}>
          <DataTable columns={payColumns} data={queue.payments} empty={t("review.payments_empty")} enablePagination={false} enableSorting={false} />
        </Card>
      </div>
      <OnlinePaymentsReview payments={queue.online} />
    </>
  );
}
