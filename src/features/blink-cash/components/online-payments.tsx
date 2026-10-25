"use client";

// Online (card) payments in the staff UI. There is no tab of their own: an online
// deposit is a ledger row (its detail shows the card payment), a card dues payment
// shows in Agent Float / Merchant dues, the providers are in Settings and the
// payments that need a look are in Review.
import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Badge, Button, Card, DataTable, type Column } from "@/components/ui";
import { recheckPayment } from "@/app/d/blink-cash/ops-action";
import { formatDA } from "../data";
import { formatCharge, KNOWN_FAILURE_REASONS, purposeHref, type GatewayProvider, type ReviewPayment } from "../lib/gateway";
import { formatDateTime } from "../lib/format";
import type { TFn } from "../types";
import { LoadError } from "./ops-shared";

export const GW_STATUS_VARIANT: Record<string, "success" | "warning" | "danger" | "default"> = {
  paid: "success",
  pending: "warning",
  failed: "danger",
  canceled: "default",
  expired: "default",
};

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

/** Settings: the card payment providers. Read-only — their keys are set on the server. */
export function GatewayProviders({ providers, error }: { providers: GatewayProvider[]; error?: string }) {
  const t = useTranslations("blink_cash") as unknown as TFn;
  return (
    <Card title={t("gw.providers_title")} description={t("gw.providers_desc")} className="mb-5">
      {error ? (
        <LoadError t={t} error={error} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {providers.map((p) => (
            <ProviderCard key={p.provider} t={t} p={p} />
          ))}
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

/** Review: online payments that need a look — an amount mismatch, or a checkout left open past its lifetime. */
export function OnlinePaymentsReview({ payments }: { payments: ReviewPayment[] }) {
  const t = useTranslations("blink_cash") as unknown as TFn;
  const locale = useLocale();

  const columns: Column<ReviewPayment>[] = [
    {
      key: "issue",
      label: t("gw.col_issue"),
      render: (r) => (
        <div className="flex flex-col items-start gap-1">
          <Badge variant={r.issue === "amount_mismatch" ? "danger" : "warning"}>{t(`gw.issue.${r.issue}`)}</Badge>
          {r.test_mode && <Badge variant="warning">{t("gw.test")}</Badge>}
        </div>
      ),
    },
    {
      key: "provider",
      label: t("gw.col_provider"),
      render: (r) => (
        <span className="whitespace-nowrap">
          {t(`gw.provider.${r.provider}`)} · <span className="text-subtext">{t(`gw.method.${r.method}`)}</span>
        </span>
      ),
    },
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
        <Link href={`/blink-cash/wallets/${r.user_id}`} className="text-primary font-semibold hover:underline" dir="auto">
          {r.userName ?? r.user_id.slice(0, 8)}
        </Link>
      ),
    },
    {
      key: "amount",
      label: t("col.amount"),
      render: (r) => (
        <span className="whitespace-nowrap">
          <span className="font-mono font-semibold">{formatCharge(r.amount, r.currency, formatDA)}</span>
          {r.base_amount != null && <span className="block text-xs text-subtext font-mono">{formatDA(r.base_amount)}</span>}
        </span>
      ),
    },
    { key: "created_at", label: t("gw.col_created"), render: (r) => <span className="text-subtext whitespace-nowrap">{formatDateTime(r.created_at, locale)}</span> },
    { key: "act", label: "", sortable: false, render: (r) => <RecheckButton t={t} id={r.id} /> },
  ];

  return (
    <Card title={t("review.online")} description={t("review.online_desc")}>
      <DataTable columns={columns} data={payments} empty={t("review.online_empty")} enablePagination={false} enableSorting={false} />
    </Card>
  );
}
