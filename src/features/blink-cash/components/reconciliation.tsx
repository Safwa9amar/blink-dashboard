"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button, Card, DataTable, StatCard, StatGrid, type Column } from "@/components/ui";
import { runLedgerBackfill } from "@/app/d/blink-cash/ops-action";
import { formatDA } from "../data";
import { shortId, signedDA } from "../lib/format";
import type { Reconciliation, ReconMismatch } from "../lib/reconciliation";
import type { TFn } from "../types";
import { LoadError, ActionDialog, useDialog } from "./ops-shared";

function BackfillButton({ t }: { t: TFn }) {
  const d = useDialog();
  return (
    <>
      <Button variant="secondary" icon="activity" onClick={d.show}>
        {t("recon.backfill")}
      </Button>
      <ActionDialog
        t={t}
        open={d.open}
        onClose={d.hide}
        title={t("recon.backfill")}
        description={t("recon.backfill_desc")}
        confirmLabel={t("recon.backfill_confirm")}
        fields={[]}
        onSubmit={() => runLedgerBackfill()}
      />
    </>
  );
}

export function ReconciliationView({
  data,
  notDeployed,
  error,
  isSuper,
}: {
  data: Reconciliation | null;
  notDeployed: boolean;
  error?: string;
  isSuper: boolean;
}) {
  const t = useTranslations("blink_cash") as unknown as TFn;
  const columns: Column<ReconMismatch>[] = [
    {
      key: "name",
      label: t("wallets.col_user"),
      render: (m) => (
        <Link href={`/blink-cash/wallets/${m.userId}`} className="text-primary hover:underline" dir="auto">
          {m.name ?? shortId(m.userId)}
        </Link>
      ),
    },
    { key: "ledger", label: t("recon.ledger"), render: (m) => <span className="font-mono">{formatDA(m.ledger)}</span> },
    { key: "derived", label: t("recon.derived"), render: (m) => <span className="font-mono">{formatDA(m.derived)}</span> },
    { key: "diff", label: t("recon.diff"), render: (m) => <span className="font-mono font-semibold text-danger">{signedDA(m.diff)}</span> },
  ];

  return (
    <>
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <Link href="/blink-cash" className="text-[13px] text-subtext hover:text-text">
          {t("recon.back")}
        </Link>
        {isSuper && (
          <div className="ms-auto">
            <BackfillButton t={t} />
          </div>
        )}
      </div>
      {notDeployed ? (
        <div className="mb-4 rounded-xl border border-warning/30 bg-warning-light px-4 py-3 text-sm text-warning" role="status">
          {t("migration")}
        </div>
      ) : !data ? (
        <LoadError t={t} error={error} />
      ) : (
        <>
          <StatGrid cols={4}>
            <StatCard label={t("recon.circulation")} value={formatDA(data.circulation)} variant="primary" icon="wallet" />
            <StatCard label={t("wallet.held")} value={formatDA(data.held)} variant="warning" icon="bank" />
            <StatCard label={t("recon.wallets")} value={data.wallets} variant="info" icon="users" />
            <StatCard
              label={t("recon.drift")}
              value={data.drift}
              variant={data.drift > 0 ? "danger" : "success"}
              icon={data.drift > 0 ? "warn" : "check"}
              change={data.drift > 0 ? t("recon.drift_bad") : t("recon.drift_ok")}
            />
          </StatGrid>
          <Card title={t("recon.mismatches")} description={t("recon.mismatches_desc")}>
            <DataTable columns={columns} data={data.mismatches} keyField="userId" empty={t("recon.none")} enablePagination={false} enableSorting={false} />
          </Card>
        </>
      )}
    </>
  );
}
