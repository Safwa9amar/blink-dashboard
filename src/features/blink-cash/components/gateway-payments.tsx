"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Badge, Button, Card, DataTable, FilterPills, type Column } from "@/components/ui";
import { fInput } from "@/components/ui/primitives";
import { recheckPayment } from "@/app/d/blink-cash/ops-action";
import { formatDA } from "../data";
import { GW_PAGE_SIZE, GW_PROVIDERS, GW_PURPOSES, GW_STATUSES, toQuery, type GatewayFilters } from "../lib/filters";
import { formatCharge, KNOWN_FAILURE_REASONS, type GatewayPayment, type GatewayProvider } from "../lib/gateway";
import { formatDateTime } from "../lib/format";
import type { TFn } from "../types";
import { LoadError, Pagination } from "./ops-shared";

export const GW_STATUS_VARIANT: Record<string, "success" | "warning" | "danger" | "default"> = {
  paid: "success",
  pending: "warning",
  failed: "danger",
  canceled: "default",
  expired: "default",
};

/** Where the thing a payment settles lives: the deposit itself, or the dues tab it counts in. */
const purposeHref = (p: Pick<GatewayPayment, "purpose" | "ref_id">) =>
  p.purpose === "wallet_topup" ? `/blink-cash/ledger/${p.ref_id}` : p.purpose === "agent_dues" ? "/blink-cash/agents" : "/blink-cash/dues";

/** A failure reason as words when the server wrote a known code, else the provider's raw message. */
export function FailureReason({ t, reason }: { t: TFn; reason: string | null }) {
  if (!reason) return <>—</>;
  if (reason === "amount_mismatch") return <Badge variant="danger">{t("gw.reason.amount_mismatch")}</Badge>;
  return (
    <span className="text-xs text-subtext break-words max-w-[220px] inline-block">
      {KNOWN_FAILURE_REASONS.includes(reason) ? t(`gw.reason.${reason}`) : reason}
    </span>
  );
}

function CopyUrl({ url, t }: { t: TFn; url: string }) {
  const [done, setDone] = useState(false);
  return (
    <Button
      size="xs"
      variant="secondary"
      icon={done ? "check" : "copy"}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(url);
          setDone(true);
          setTimeout(() => setDone(false), 1500);
        } catch {
          /* clipboard unavailable */
        }
      }}
    >
      {done ? t("gw.copied") : t("gw.copy")}
    </Button>
  );
}

function ProviderCard({ t, p }: { t: TFn; p: GatewayProvider }) {
  return (
    <Card>
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-bold text-text">{t(`gw.provider.${p.provider}`)}</p>
        <Badge variant={p.configured ? "success" : "default"}>{p.configured ? t("gw.configured") : t("gw.not_configured")}</Badge>
      </div>
      {p.configured ? (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <Badge variant={p.test_mode ? "warning" : "info"}>{p.test_mode ? t("gw.test") : t("gw.live")}</Badge>
          {p.methods.map((m) => (
            <Badge key={m} variant="primary">
              {t(`gw.method.${m}`)}
            </Badge>
          ))}
        </div>
      ) : (
        p.provider === "satim" && <p className="text-xs text-subtext mt-2">{t("gw.needs_credentials")}</p>
      )}
      {p.configured && p.dzd_rate != null && (
        <p className="text-xs text-subtext mt-2">{t("gw.charged_in_eur", { rate: formatDA(p.dzd_rate) })}</p>
      )}
      {p.configured && p.webhook_url && (
        <div className="mt-3">
          <p className="text-[11.5px] font-semibold text-subtext mb-1">{t("gw.webhook")}</p>
          <div className="flex items-center gap-2">
            <code className="text-xs text-text break-all min-w-0 flex-1" dir="ltr">
              {p.webhook_url}
            </code>
            <CopyUrl t={t} url={p.webhook_url} />
          </div>
        </div>
      )}
    </Card>
  );
}

/** Asks the provider again; a late card payment is credited by it (audited on the server). */
export function RecheckButton({ t, id }: { t: TFn; id: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="flex flex-col items-start gap-1" data-row-ignore>
      <Button
        size="xs"
        variant="secondary"
        icon="activity"
        loading={isPending}
        onClick={() =>
          startTransition(async () => {
            const res = await recheckPayment(id);
            setError(res.ok ? null : res.error);
            if (res.ok) router.refresh();
          })
        }
      >
        {t("gw.recheck")}
      </Button>
      {error && (
        <span className="text-xs text-danger max-w-[180px]" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}

/** Payments tab: gateway status cards, then every online payment (filters + paging in the URL). */
export function GatewayPayments({
  providers,
  providersError,
  payments,
  total,
  filters,
  error,
}: {
  providers: GatewayProvider[];
  providersError?: string;
  payments: GatewayPayment[];
  total: number;
  filters: GatewayFilters;
  error?: string;
}) {
  const t = useTranslations("blink_cash") as unknown as TFn;
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const { page, ...rest } = filters;
  const go = (next: Partial<Record<"status" | "provider" | "purpose" | "user", string>>) =>
    router.push(`${pathname}?${toQuery({ ...rest, ...next })}`.replace(/\?$/, ""));

  const columns: Column<GatewayPayment>[] = [
    {
      key: "status",
      label: t("col.status"),
      render: (r) => (
        <div className="flex flex-col items-start gap-1">
          <Badge variant={GW_STATUS_VARIANT[r.status] ?? "default"}>{t(`gw.status.${r.status}`)}</Badge>
          {r.test_mode && <Badge variant="warning">{t("gw.test")}</Badge>}
        </div>
      ),
    },
    { key: "provider", label: t("gw.col_provider"), render: (r) => <span className="text-text">{t(`gw.provider.${r.provider}`)}</span> },
    { key: "method", label: t("col.method"), render: (r) => <span className="text-subtext">{t(`gw.method.${r.method}`)}</span> },
    {
      key: "purpose",
      label: t("gw.col_purpose"),
      render: (r) => (
        <Link href={purposeHref(r)} className="text-primary hover:underline" data-row-ignore>
          {t(`gw.purpose.${r.purpose}`)}
        </Link>
      ),
    },
    {
      key: "user",
      label: t("gw.col_user"),
      render: (r) => (
        <Link href={`/blink-cash/wallets/${r.user_id}`} className="text-primary font-semibold hover:underline">
          {r.user_name ?? r.user_id.slice(0, 8)}
        </Link>
      ),
    },
    {
      key: "amount",
      label: t("col.amount"),
      render: (r) =>
        r.currency === "DZD" ? (
          <span className="font-mono font-semibold whitespace-nowrap">{formatDA(r.amount)}</span>
        ) : (
          <span className="whitespace-nowrap">
            <span className="font-mono font-semibold">{formatCharge(r.amount, r.currency, formatDA)}</span>
            {r.base_amount != null && <span className="block text-xs text-subtext font-mono">{formatDA(r.base_amount)}</span>}
          </span>
        ),
    },
    { key: "created_at", label: t("gw.col_created"), render: (r) => <span className="text-subtext whitespace-nowrap">{formatDateTime(r.created_at, locale)}</span> },
    { key: "paid_at", label: t("gw.col_paid"), render: (r) => <span className="text-subtext whitespace-nowrap">{formatDateTime(r.paid_at, locale)}</span> },
    {
      key: "failure_reason",
      label: t("gw.col_failure"),
      render: (r) => <FailureReason t={t} reason={r.failure_reason} />,
    },
    // A paid payment can't change any more: nothing to re-check.
    { key: "act", label: "", sortable: false, render: (r) => (r.status === "paid" ? null : <RecheckButton t={t} id={r.id} />) },
  ];

  return (
    <>
      {providersError ? (
        <div className="mb-5">
          <LoadError t={t} error={providersError} />
        </div>
      ) : (
        <div className="grid gap-4 mb-5 sm:grid-cols-2 xl:grid-cols-3">
          {providers.map((p) => (
            <ProviderCard key={p.provider} t={t} p={p} />
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3 mb-3">
        <span className="text-[13px] text-subtext tabular-nums">{t("gw.count", { n: total })}</span>
        {filters.user && (
          <span className="inline-flex items-center gap-2 text-[13px]">
            <Badge variant="primary">{t("gw.for_user", { name: payments[0]?.user_name ?? filters.user.slice(0, 8) })}</Badge>
            <button type="button" className="text-primary hover:underline" onClick={() => go({ user: "" })}>
              {t("gw.clear_user")}
            </button>
          </span>
        )}
      </div>
      <FilterPills<string>
        options={[["", t("f.all")], ...GW_STATUSES.map((s): [string, string] => [s, t(`gw.status.${s}`)])]}
        value={filters.status ?? ""}
        onChange={(v) => go({ status: v })}
      />
      <div className="flex flex-wrap items-end gap-3 mb-4">
        <label className="flex flex-col gap-1 text-xs font-semibold text-text">
          {t("gw.col_provider")}
          <select className={fInput} value={filters.provider ?? ""} onChange={(e) => go({ provider: e.target.value })}>
            <option value="">{t("f.all")}</option>
            {GW_PROVIDERS.map((p) => (
              <option key={p} value={p}>
                {t(`gw.provider.${p}`)}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-text">
          {t("gw.col_purpose")}
          <select className={fInput} value={filters.purpose ?? ""} onChange={(e) => go({ purpose: e.target.value })}>
            <option value="">{t("f.all")}</option>
            {GW_PURPOSES.map((p) => (
              <option key={p} value={p}>
                {t(`gw.purpose.${p}`)}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error ? (
        <LoadError t={t} error={error} />
      ) : (
        <>
          <DataTable
            columns={columns}
            data={payments}
            empty={t("gw.empty")}
            enablePagination={false}
            enableSorting={false}
            rowClassName={(r) => (r.failure_reason === "amount_mismatch" ? "bg-danger-light" : undefined)}
          />
          <Pagination base="/blink-cash/payments" query={rest} page={page} total={total} size={GW_PAGE_SIZE} />
        </>
      )}
    </>
  );
}
