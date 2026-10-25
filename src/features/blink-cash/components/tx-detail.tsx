"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Badge, Button, Card, DashIcon, DataTable, StatCard, StatGrid, type Column } from "@/components/ui";
import { cancelTransaction, approveTransaction, rejectTransaction, reverseTransaction } from "@/app/d/blink-cash/ops-action";
import type { TxDetail } from "@/app/d/blink-cash/ops-data";
import { TX_STATUS_VARIANT, formatDA } from "../data";
import { formatDateTime, safeHttpUrl, shortId, signedDA } from "../lib/format";
import { formatCharge, type TxPayment } from "../lib/gateway";
import { buildTimeline, txActions, type TxAction } from "../lib/lifecycle";
import type { StatementEntry } from "../lib/statement";
import type { TFn } from "../types";
import { FailureReason, GW_STATUS_VARIANT, RecheckButton } from "./gateway-payments";
import { ActionDialog, useDialog, type DialogField } from "./ops-shared";

function ActionButton({ t, action, id, reference }: { t: TFn; action: TxAction; id: string; reference: string | null }) {
  const d = useDialog();
  const reasonField: DialogField = { key: "reason", label: t("tx.reason"), kind: "textarea", required: true, hint: t("tx.reason_hint") };
  const cfg: Record<TxAction, { fields: DialogField[]; run: (v: Record<string, string>) => ReturnType<typeof cancelTransaction>; danger: boolean }> = {
    cancel: { fields: [reasonField], run: (v) => cancelTransaction(id, v.reason), danger: true },
    reject: { fields: [reasonField], run: (v) => rejectTransaction(id, v.reason), danger: true },
    reverse: { fields: [reasonField], run: (v) => reverseTransaction(id, v.reason), danger: true },
    approve: {
      fields: [{ key: "reference", label: t("tx.reference"), kind: "text", required: true, initial: reference ?? "", ltr: true }],
      run: (v) => approveTransaction(id, v.reference),
      danger: false,
    },
  };
  const c = cfg[action];
  return (
    <>
      <Button variant={c.danger ? "danger" : "primary"} icon={action === "approve" ? "check" : undefined} onClick={d.show}>
        {t(`tx.action_${action}`)}
      </Button>
      <ActionDialog
        t={t}
        open={d.open}
        onClose={d.hide}
        title={t(`tx.action_${action}`)}
        description={t(`tx.confirm_${action}`)}
        fields={c.fields}
        confirmLabel={t(`tx.action_${action}`)}
        danger={c.danger}
        onSubmit={c.run}
      />
    </>
  );
}

/** The gateway payments behind an online deposit (a retry makes a new one), newest first. */
function OnlinePayments({ t, locale, userId, payments }: { t: TFn; locale: string; userId: string; payments: TxPayment[] }) {
  return (
    <Card title={t("tx.online_payment")} description={t("tx.online_payment_desc")} className="mb-5">
      {payments.length === 0 && <p className="text-sm text-subtext">{t("tx.online_none")}</p>}
      {payments.map((p) => (
        <div key={p.id} className="flex flex-wrap items-start justify-between gap-3 py-3 border-t border-border first:border-t-0">
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge variant={GW_STATUS_VARIANT[p.status] ?? "default"}>{t(`gw.status.${p.status}`)}</Badge>
              {p.test_mode && <Badge variant="warning">{t("gw.test")}</Badge>}
              <span className="text-[13px] text-text">
                {t(`gw.provider.${p.provider}`)} · {t(`gw.method.${p.method}`)}
              </span>
            </div>
            <p className="text-[13px] font-mono font-semibold">
              {formatCharge(p.amount, p.currency, formatDA)}
              {p.base_amount != null && <span className="font-normal text-subtext"> · {formatDA(p.base_amount)}</span>}
            </p>
            <p className="text-xs text-subtext tabular-nums">
              {formatDateTime(p.created_at, locale)}
              {p.paid_at && ` · ${t("gw.col_paid")} ${formatDateTime(p.paid_at, locale)}`}
            </p>
            {p.provider_ref && (
              <p className="text-xs font-mono text-subtext break-all" dir="ltr">
                {p.provider_ref}
              </p>
            )}
            {p.failure_reason && <FailureReason t={t} reason={p.failure_reason} />}
          </div>
          {p.status !== "paid" && <RecheckButton t={t} id={p.id} />}
        </div>
      ))}
      <p className="text-xs mt-3">
        <Link href={`/blink-cash/payments?user=${userId}`} className="text-primary hover:underline">
          {t("tx.online_all")}
        </Link>
      </p>
    </Card>
  );
}

function Row({ k, children }: { k: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between items-start gap-4 py-2.5 text-[13px] border-t border-border first:border-t-0">
      <span className="text-subtext shrink-0">{k}</span>
      <span className="text-text text-end min-w-0 break-words">{children}</span>
    </div>
  );
}

export function TxDetailView({ detail }: { detail: TxDetail }) {
  const t = useTranslations("blink_cash") as unknown as TFn;
  const locale = useLocale();
  const { tx, entries, hold, actors, offerTitle, walletFrozen, payments } = detail;
  const actions = txActions(tx.status);
  // An online deposit closes because its card payment did (failed, expired, cancelled):
  // say that rather than the deposit's generic cancel reason ("by the rider").
  const closedPayment = tx.method === "online" && tx.cancel_reason !== "staff" ? payments.find((p) => p.status !== "pending" && p.status !== "paid") : undefined;
  const cancelText = (reason: string) =>
    closedPayment ? t("tx.payment_outcome", { status: t(`gw.status.${closedPayment.status}`) }) : t(`cancel_reason.${reason}`);
  const timeline = buildTimeline(tx);
  const receipt = safeHttpUrl(tx.receipt_url);
  const credit = tx.type === "deposit";

  const entryColumns: Column<StatementEntry>[] = [
    { key: "created_at", label: t("col.when"), render: (e) => <span className="text-subtext whitespace-nowrap">{formatDateTime(e.created_at, locale)}</span> },
    { key: "kind", label: t("wallet.col_kind"), render: (e) => <Badge>{t(`entry_kind.${e.kind}`)}</Badge> },
    {
      key: "amount",
      label: t("col.amount"),
      render: (e) => <span className={`font-mono font-semibold ${e.amount < 0 ? "text-danger" : "text-success"}`}>{signedDA(e.amount)}</span>,
    },
    {
      key: "balance_after",
      label: t("wallet.col_balance"),
      render: (e) => <span className="font-mono text-subtext">{e.balance_after == null ? "—" : formatDA(e.balance_after)}</span>,
    },
  ];

  return (
    <>
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <Link href="/blink-cash/ledger" className="inline-flex items-center gap-1.5 text-[13px] text-subtext hover:text-text">
          <DashIcon name="chevron-left" className="w-4 h-4 rtl:-scale-x-100" />
          {t("tx.back")}
        </Link>
        <h2 className="text-lg font-semibold text-text font-mono" dir="ltr">
          {shortId(tx.id)}
        </h2>
        <Badge variant={TX_STATUS_VARIANT[tx.status] ?? "default"}>{t(`tx_status.${tx.status}`)}</Badge>
        {actions.length > 0 && (
          <div className="ms-auto flex flex-wrap gap-2">
            {actions.map((a) => (
              <ActionButton key={a} t={t} action={a} id={tx.id} reference={tx.reference ?? null} />
            ))}
          </div>
        )}
      </div>

      <StatGrid cols={4}>
        <StatCard label={t("col.type")} value={t(`tx_type.${tx.type}`)} variant={credit ? "success" : "info"} icon={credit ? "wallet" : "bank"} />
        <StatCard label={t("col.amount")} value={formatDA(tx.amount)} variant="primary" icon="dollar" />
        <StatCard label={t("col.fees")} value={formatDA(tx.fees)} variant="warning" icon="card" />
        <StatCard
          label={t("col.total")}
          value={formatDA(tx.total)}
          variant="default"
          icon="wallet"
          change={tx.bonus_amount ? t("tx.bonus", { amount: formatDA(Number(tx.bonus_amount)) }) : undefined}
        />
      </StatGrid>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        <Card title={t("tx.details")}>
          <Row k={t("col.account")}>
            <Link href={`/blink-cash/wallets/${tx.user_id}`} className="text-primary hover:underline" dir="auto">
              {tx.userName ?? shortId(tx.user_id)}
            </Link>
            {tx.userPhone && (
              <span className="block text-xs text-subtext" dir="ltr">
                {tx.userPhone}
              </span>
            )}
            {walletFrozen && <Badge variant="danger" className="ms-2">{t("wallet.frozen")}</Badge>}
          </Row>
          <Row k={t("col.agent")}>
            <span dir="auto">{tx.agentName ?? "—"}</span>
          </Row>
          <Row k={t("col.method")}>{tx.method ? t(`method.${tx.method}`) : "—"}</Row>
          {tx.pending_id && (
            <Row k={t("tx.pending_id")}>
              <span className="font-mono text-xs" dir="ltr">
                {tx.pending_id}
              </span>
            </Row>
          )}
          {tx.reference && (
            <Row k={t("tx.reference")}>
              <span className="font-mono" dir="ltr">
                {tx.reference}
              </span>
            </Row>
          )}
          {receipt && (
            <Row k={t("tx.receipt")}>
              <a href={receipt} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                {t("tx.open_receipt")}
              </a>
            </Row>
          )}
          {tx.payout_account && (
            <Row k={t("tx.payout")}>
              <span dir="auto">
                {[tx.payout_account.type && t(`acct_type.${tx.payout_account.type}`), tx.payout_account.holder].filter(Boolean).join(" · ")}
              </span>
              {tx.payout_account.number && (
                <span className="block font-mono text-xs" dir="ltr">
                  {tx.payout_account.number}
                </span>
              )}
            </Row>
          )}
          {(offerTitle || tx.offer_title) && <Row k={t("col.offer")}><span dir="auto">{offerTitle ?? tx.offer_title}</span></Row>}
          {tx.cancel_reason && <Row k={t("tx.cancel_reason")}>{cancelText(tx.cancel_reason)}</Row>}
          {tx.reversal_reason && <Row k={t("tx.reversal_reason")}><span dir="auto">{tx.reversal_reason}</span></Row>}
          {tx.staff_note && <Row k={t("tx.staff_note")}><span dir="auto">{tx.staff_note}</span></Row>}
          {hold && (
            <Row k={t("tx.hold")}>
              {formatDA(hold.amount)} · {t(`hold_status.${hold.status}`)}
            </Row>
          )}
        </Card>

        <Card title={t("tx.timeline")}>
          <ol className="relative border-s border-border ms-2 space-y-4">
            {timeline.map((e) => (
              <li key={`${e.key}-${e.at}`} className="ms-4">
                <span className="absolute -start-[5px] mt-1.5 w-2.5 h-2.5 rounded-full bg-primary" />
                <p className="text-[13px] font-semibold text-text">{t(`tx.ev_${e.key}`)}</p>
                <p className="text-xs text-subtext tabular-nums">
                  {formatDateTime(e.at, locale)}
                  {e.actorId && actors[e.actorId] ? ` · ${actors[e.actorId]}` : ""}
                </p>
                {e.note && (
                  <p className="text-xs text-text mt-0.5" dir="auto">
                    {e.key === "cancelled" && ["rider", "agent", "expired", "staff", "rejected"].includes(e.note) ? cancelText(e.note) : e.note}
                  </p>
                )}
              </li>
            ))}
          </ol>
        </Card>
      </div>

      {tx.method === "online" && <OnlinePayments t={t} locale={locale} userId={tx.user_id} payments={payments} />}

      <Card title={t("tx.entries")} description={t("tx.entries_desc")}>
        <DataTable columns={entryColumns} data={entries} empty={t("tx.entries_empty")} enablePagination={false} enableSorting={false} />
      </Card>
    </>
  );
}
