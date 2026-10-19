"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Badge, Button, Card, DashIcon, DataTable, StatCard, type Column } from "@/components/ui";
import { adjustWallet, freezeWallet, unfreezeWallet } from "@/app/d/blink-cash/ops-action";
import { TX_STATUS_VARIANT, formatDA } from "../data";
import { formatDateTime, shortId, signedDA } from "../lib/format";
import { available, signedAdjustment, type StatementRow } from "../lib/statement";
import type { LedgerRow, TFn } from "../types";
import type { WalletDetail } from "../ops-types";
import { ActionDialog, ExportLink, Pagination, useDialog } from "./ops-shared";

export const ENTRIES_PAGE = 50;

function AdjustButton({ t, userId }: { t: TFn; userId: string }) {
  const d = useDialog();
  return (
    <>
      <Button variant="secondary" icon="dollar" onClick={d.show}>
        {t("wallet.adjust")}
      </Button>
      <ActionDialog
        t={t}
        open={d.open}
        onClose={d.hide}
        title={t("wallet.adjust")}
        description={t("wallet.adjust_desc")}
        confirmLabel={t("wallet.adjust_confirm")}
        fields={[
          {
            key: "direction",
            label: t("wallet.direction"),
            kind: "select",
            options: [
              ["credit", t("wallet.credit")],
              ["debit", t("wallet.debit")],
            ],
          },
          { key: "amount", label: t("col.amount"), kind: "number", required: true, hint: "DA" },
          { key: "reason", label: t("tx.reason"), kind: "textarea", required: true, hint: t("tx.reason_hint") },
        ]}
        onSubmit={async (v) => {
          const amount = signedAdjustment(v.direction === "debit" ? "debit" : "credit", v.amount);
          if (amount === null) return { ok: false, error: t("err.invalid") };
          return adjustWallet(userId, amount, v.reason);
        }}
      />
    </>
  );
}

function FreezeButtons({ t, userId, frozen }: { t: TFn; userId: string; frozen: boolean }) {
  const d = useDialog();
  return (
    <>
      <Button variant={frozen ? "primary" : "danger"} icon={frozen ? "check" : "warn"} onClick={d.show}>
        {frozen ? t("wallet.unfreeze") : t("wallet.freeze")}
      </Button>
      <ActionDialog
        t={t}
        open={d.open}
        onClose={d.hide}
        title={frozen ? t("wallet.unfreeze") : t("wallet.freeze")}
        description={frozen ? t("wallet.unfreeze_desc") : t("wallet.freeze_desc")}
        confirmLabel={frozen ? t("wallet.unfreeze") : t("wallet.freeze")}
        danger={!frozen}
        fields={[{ key: "reason", label: t("tx.reason"), kind: "textarea", required: !frozen, hint: frozen ? t("wallet.optional") : t("tx.reason_hint") }]}
        onSubmit={(v) => (frozen ? unfreezeWallet(userId, v.reason) : freezeWallet(userId, v.reason))}
      />
    </>
  );
}

export function WalletDetailView({ detail, transactions, page }: { detail: WalletDetail; transactions: LedgerRow[]; page: number }) {
  const t = useTranslations("blink_cash") as unknown as TFn;
  const locale = useLocale();
  const { wallet, entries, entriesTotal } = detail;
  const frozen = wallet.status === "frozen";

  const entryColumns: Column<StatementRow & { actorName: string | null }>[] = [
    { key: "created_at", label: t("col.when"), render: (e) => <span className="text-subtext whitespace-nowrap">{formatDateTime(e.created_at, locale)}</span> },
    { key: "kind", label: t("wallet.col_kind"), render: (e) => <Badge>{t(`entry_kind.${e.kind}`)}</Badge> },
    {
      key: "memo",
      label: t("wallet.col_memo"),
      render: (e) => (
        <div className="min-w-[120px]">
          {e.transaction_id ? (
            <Link href={`/blink-cash/ledger/${e.transaction_id}`} className="font-mono text-xs text-primary hover:underline">
              {shortId(e.transaction_id)}
            </Link>
          ) : null}
          {e.memo && (
            <p className="text-xs text-subtext" dir="auto">
              {e.memo}
            </p>
          )}
          {e.actorName && <p className="text-xs text-subtext">{t("wallet.by", { name: e.actorName })}</p>}
        </div>
      ),
    },
    {
      key: "amount",
      label: t("col.amount"),
      render: (e) => <span className={`font-mono font-semibold whitespace-nowrap ${e.amount < 0 ? "text-danger" : "text-success"}`}>{signedDA(e.amount)}</span>,
    },
    { key: "balance", label: t("wallet.col_balance"), render: (e) => <span className="font-mono whitespace-nowrap">{formatDA(e.balance)}</span> },
  ];

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
    { key: "type", label: t("col.type"), render: (r) => t(`tx_type.${r.type}`) },
    { key: "amount", label: t("col.amount"), render: (r) => <span className="font-mono whitespace-nowrap">{formatDA(r.amount)}</span> },
    { key: "status", label: t("col.status"), render: (r) => <Badge variant={TX_STATUS_VARIANT[r.status] ?? "default"}>{t(`tx_status.${r.status}`)}</Badge> },
    { key: "created_at", label: t("col.when"), render: (r) => <span className="text-subtext whitespace-nowrap">{formatDateTime(r.created_at, locale)}</span> },
  ];

  return (
    <>
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <Link href="/blink-cash/wallets" className="inline-flex items-center gap-1.5 text-[13px] text-subtext hover:text-text">
          <DashIcon name="chevron-left" className="w-4 h-4 rtl:-scale-x-100" />
          {t("wallet.back")}
        </Link>
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-text" dir="auto">
            {wallet.name ?? shortId(wallet.userId)}
          </h2>
          {wallet.phone && (
            <p className="text-xs text-subtext" dir="ltr">
              {wallet.phone}
            </p>
          )}
        </div>
        <Badge variant={frozen ? "danger" : "success"}>{t(`wallet.status_${wallet.status}`)}</Badge>
        <div className="ms-auto flex flex-wrap gap-2">
          <ExportLink href={`/blink-cash/export/wallet/${wallet.userId}`} label={t("wallet.export")} />
          <AdjustButton t={t} userId={wallet.userId} />
          <FreezeButtons t={t} userId={wallet.userId} frozen={frozen} />
        </div>
      </div>

      {frozen && (
        <div className="mb-4 rounded-xl border border-danger/30 bg-danger-light px-4 py-3 text-sm text-danger" role="status">
          {t("wallet.frozen_note", { reason: wallet.frozenReason ?? "—", when: formatDateTime(wallet.frozenAt, locale) })}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
        <StatCard label={t("wallet.balance")} value={formatDA(wallet.balance)} variant="primary" icon="wallet" />
        <StatCard label={t("wallet.held")} value={formatDA(wallet.held)} variant="warning" icon="bank" change={t("wallet.held_chg")} />
        <StatCard label={t("wallet.available")} value={formatDA(available(wallet.balance, wallet.held))} variant="success" icon="trending" />
      </div>
      {!wallet.backfilledAt && <p className="text-xs text-subtext mb-4">{t("wallet.not_backfilled")}</p>}

      <div className="mb-7">
        <Card title={t("wallet.statement")} description={t("wallet.statement_desc")}>
          <DataTable columns={entryColumns} data={entries} empty={t("wallet.statement_empty")} enablePagination={false} enableSorting={false} />
          <Pagination base={`/blink-cash/wallets/${wallet.userId}`} query={{}} page={page} total={entriesTotal} size={ENTRIES_PAGE} />
        </Card>
      </div>

      <Card title={t("wallet.transactions")} description={t("wallet.transactions_desc")}>
        <DataTable columns={txColumns} data={transactions} empty={t("ledger.empty")} enablePagination={false} enableSorting={false} />
      </Card>
    </>
  );
}
