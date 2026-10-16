"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Badge, Button, DataTable, type Column } from "@/components/ui";
import { fInput } from "@/components/ui/primitives";
import { formatDA } from "../data";
import { formatDateTime, shortId } from "../lib/format";
import { LEDGER_PAGE_SIZE, toQuery, type AuditFilters } from "../lib/filters";
import type { AuditEvent } from "../ops-types";
import type { TFn } from "../types";
import { LoadError, MigrationNotice, Pagination } from "./ops-shared";
import Link from "next/link";

/** Known audit actions for the filter; unknown ones from the server still render by raw name. */
export const AUDIT_ACTIONS = [
  "transaction.cancel",
  "transaction.approve",
  "transaction.reject",
  "transaction.reverse",
  "wallet.adjust",
  "wallet.freeze",
  "wallet.unfreeze",
  "settings.update",
  "offer.create",
  "offer.update",
  "agent.payment_record",
  "agent.payment_confirm",
  "agent.payment_reject",
  "agent.credit_limit",
  "merchant.payment_record",
  "merchant.payment_confirm",
  "merchant.payment_reject",
  "ledger.backfill",
];
const TARGETS = ["transaction", "wallet", "settings", "offer", "agent", "merchant_store", "agent_dues_payment", "merchant_dues_payment", "ledger"];

/** next-intl keys can't contain dots. */
const actionKey = (a: string) => a.replace(/\./g, "_");

function targetHref(e: AuditEvent): string | null {
  if (!e.targetId) return null;
  if (e.targetType === "transaction") return `/blink-cash/ledger/${e.targetId}`;
  if (e.targetType === "wallet") return `/blink-cash/wallets/${e.targetId}`;
  return null;
}

export function Audit({ events, total, filters, migrationPending, error }: { events: AuditEvent[]; total: number; filters: AuditFilters; migrationPending?: boolean; error?: string }) {
  const t = useTranslations("blink_cash") as unknown as TFn;
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [draft, setDraft] = useState({ action: filters.action, target_type: filters.target_type, from: filters.from ?? "", to: filters.to ?? "" });
  const { page, ...rest } = filters;
  const set = (k: keyof typeof draft) => (e: { target: { value: string } }) => setDraft((d) => ({ ...d, [k]: e.target.value }));
  const dirty = !!(filters.action || filters.target_type || filters.from || filters.to);

  const columns: Column<AuditEvent>[] = [
    { key: "createdAt", label: t("col.when"), render: (e) => <span className="text-subtext whitespace-nowrap">{formatDateTime(e.createdAt, locale)}</span> },
    {
      key: "actorName",
      label: t("audit.col_actor"),
      render: (e) => (
        <span dir="auto" className="whitespace-nowrap">
          {e.actorName ?? (e.actorId ? shortId(e.actorId) : "—")}
        </span>
      ),
    },
    { key: "action", label: t("audit.col_action"), render: (e) => <Badge variant="primary" className="normal-case! tracking-normal!">{AUDIT_ACTIONS.includes(e.action) ? t(`audit.action.${actionKey(e.action)}`) : e.action}</Badge> },
    {
      key: "targetId",
      label: t("audit.col_target"),
      render: (e) => {
        const href = targetHref(e);
        const label = `${e.targetType ?? ""} ${e.targetId ? shortId(e.targetId) : ""}`.trim() || "—";
        return href ? (
          <Link href={href} className="font-mono text-xs text-primary hover:underline">
            {label}
          </Link>
        ) : (
          <span className="font-mono text-xs text-subtext">{label}</span>
        );
      },
    },
    { key: "amount", label: t("col.amount"), render: (e) => <span className="font-mono whitespace-nowrap">{e.amount === null ? "—" : formatDA(e.amount)}</span> },
    {
      key: "reason",
      label: t("tx.reason"),
      render: (e) => (
        <span className="text-xs text-text max-w-[260px] block break-words" dir="auto">
          {e.reason ?? "—"}
        </span>
      ),
    },
  ];

  const go = () => router.push(`${pathname}?${toQuery(draft)}`.replace(/\?$/, ""));

  return (
    <>
      {migrationPending && <MigrationNotice t={t} />}
      <form
        className="flex flex-wrap items-end gap-3 mb-4"
        onSubmit={(e) => {
          e.preventDefault();
          go();
        }}
      >
        <label className="flex flex-col gap-1 text-xs font-semibold text-text">
          {t("audit.col_action")}
          <input className={fInput} dir="ltr" list="audit-actions" value={draft.action} onChange={set("action")} placeholder={t("f.all")} maxLength={60} />
          <datalist id="audit-actions">
            {AUDIT_ACTIONS.map((a) => (
              <option key={a} value={a} />
            ))}
          </datalist>
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-text">
          {t("audit.col_target")}
          <select className={fInput} value={draft.target_type} onChange={set("target_type")}>
            <option value="">{t("f.all")}</option>
            {TARGETS.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-text">
          {t("ledger.from")}
          <input type="date" className={fInput} value={draft.from} onChange={set("from")} />
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-text">
          {t("ledger.to")}
          <input type="date" className={fInput} value={draft.to} onChange={set("to")} />
        </label>
        <Button type="submit">{t("ledger.apply")}</Button>
        {dirty && (
          <Button type="button" variant="ghost" onClick={() => router.push(pathname)}>
            {t("ledger.reset")}
          </Button>
        )}
      </form>
      {error && !migrationPending ? (
        <LoadError t={t} error={error} />
      ) : (
        <>
          <DataTable columns={columns} data={events} empty={t("audit.empty")} enablePagination={false} enableSorting={false} />
          <Pagination base="/blink-cash/audit" query={rest} page={page} total={total} size={LEDGER_PAGE_SIZE} />
        </>
      )}
    </>
  );
}
