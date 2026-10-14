"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Badge, Button, DataTable, FilterPills, FormRow, Modal, SearchBox, StatCard, StatGrid, fInput, type Column } from "@/components/ui";
import { extendCoupon, restoreCoupon, revokeCoupon } from "@/app/d/coupons/action";
import { SOURCES, STATUS_VARIANT } from "../status";
import type { CouponKpis, CouponListRow, CouponSource, CouponStatus, PromotionOption } from "../types";

type Dialog = { kind: "extend" | "revoke"; row: CouponListRow } | null;

const fmt = (n: number, locale: string) => n.toLocaleString(locale, { maximumFractionDigits: 2 });

export function CouponsList({
  rows,
  kpis,
  promotions,
  promotionFilter,
  truncated,
  error,
}: {
  rows: CouponListRow[];
  kpis: CouponKpis;
  promotions: PromotionOption[];
  promotionFilter: string;
  truncated: boolean;
  error?: string;
}) {
  const t = useTranslations("coupons");
  const tc = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [pending, start] = useTransition();
  const [status, setStatus] = useState<CouponStatus | "all">("all");
  const [source, setSource] = useState<CouponSource | "all">("all");
  const [q, setQ] = useState("");
  const [dialog, setDialog] = useState<Dialog>(null);
  const [date, setDate] = useState("");
  const [note, setNote] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  const errText = (key: string) => (t.has(`errors.${key}` as never) ? t(`errors.${key}` as never) : key);

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (status !== "all" && r.status !== status) return false;
      if (source !== "all" && r.source !== source) return false;
      if (!needle) return true;
      return `${r.code} ${r.customer_name} ${r.customer_phone}`.toLowerCase().includes(needle);
    });
  }, [rows, status, source, q]);

  const run = (fn: () => Promise<{ error: string | null } | { error: string }>, onOk?: () => void) => {
    setMsg(null);
    start(async () => {
      const res = await fn();
      if (res.error) setMsg(errText(res.error));
      else {
        onOk?.();
        router.refresh();
      }
    });
  };

  const open = (kind: "extend" | "revoke", row: CouponListRow) => {
    setMsg(null);
    setNote("");
    setDate("");
    setDialog({ kind, row });
  };

  const discount = (r: CouponListRow) =>
    r.discount_type === "percent"
      ? `${fmt(r.discount_value, locale)}%`
      : r.discount_type === "fixed"
        ? `${fmt(r.discount_value, locale)} ${tc("da")}`
        : t("free_delivery");

  const columns: Column<CouponListRow>[] = [
    { key: "code", label: t("cols.code"), render: (r) => <span className="font-mono text-xs font-bold">{r.code}</span> },
    {
      key: "customer_name",
      label: t("cols.customer"),
      render: (r) => (
        <Link href="/customers" className="hover:underline">
          <div className="font-semibold text-text">{r.customer_name || "—"}</div>
          <div className="text-xs text-subtext" dir="ltr">{r.customer_phone}</div>
        </Link>
      ),
    },
    {
      key: "promotion_title",
      label: t("cols.promotion"),
      render: (r) =>
        r.promotion_id && r.promotion_title ? (
          <Link href={`/promotions/${r.promotion_id}`} className="hover:underline">
            {r.promotion_title}
          </Link>
        ) : (
          <span className="text-subtext">{r.source === "referral" ? t("sources.referral") : r.source === "staff" ? t("sources.staff") : r.title}</span>
        ),
    },
    { key: "discount_value", label: t("cols.discount"), render: (r) => <span className="whitespace-nowrap">{discount(r)}</span> },
    {
      key: "min_order",
      label: t("cols.min_order"),
      render: (r) => <span className="tabular-nums">{r.min_order ? `${fmt(r.min_order, locale)} ${tc("da")}` : "—"}</span>,
    },
    { key: "status", label: t("cols.status"), render: (r) => <Badge variant={STATUS_VARIANT[r.status]}>{t(`statuses.${r.status}` as never)}</Badge> },
    {
      key: "expires_at",
      label: t("cols.expires"),
      render: (r) => <span className="text-subtext whitespace-nowrap">{r.expires_at ? new Date(r.expires_at).toLocaleDateString(locale) : "—"}</span>,
    },
    {
      key: "order_id",
      label: t("cols.used_on"),
      sortable: false,
      render: (r) =>
        r.order_id ? (
          <Link href="/orders" className="font-mono text-xs hover:underline">
            #{r.order_id.slice(0, 8).toUpperCase()}
          </Link>
        ) : (
          "—"
        ),
    },
    { key: "source", label: t("cols.source"), render: (r) => t(`sources.${r.source}` as never) },
    { key: "issued_by_name", label: t("cols.issued_by"), render: (r) => <span className="text-subtext">{r.issued_by_name ?? "—"}</span> },
    {
      key: "actions",
      label: tc("actions"),
      sortable: false,
      render: (r) => (
        <div className="flex gap-1 min-w-[120px]" data-row-ignore>
          {r.status === "revoked" ? (
            <Button size="xs" variant="secondary" type="button" disabled={pending} onClick={() => run(() => restoreCoupon(r.id))}>
              {t("actions.restore")}
            </Button>
          ) : r.status !== "used" ? (
            <>
              <Button size="xs" variant="secondary" type="button" onClick={() => open("extend", r)}>
                {t("actions.extend")}
              </Button>
              <Button size="xs" variant="ghost" type="button" onClick={() => open("revoke", r)}>
                {t("actions.revoke")}
              </Button>
            </>
          ) : null}
        </div>
      ),
    },
  ];

  const submit = () => {
    if (!dialog) return;
    if (dialog.kind === "extend") {
      if (!date) return setMsg(errText("expiry_required"));
      // End of the chosen day, local time.
      const iso = new Date(`${date}T23:59:59`).toISOString();
      run(() => extendCoupon(dialog.row.id, iso, note), () => setDialog(null));
    } else {
      if (!note.trim()) return setMsg(errText("note_required"));
      run(() => revokeCoupon(dialog.row.id, note), () => setDialog(null));
    }
  };

  return (
    <>
      <StatGrid cols={4}>
        <StatCard label={t("kpi.active")} value={kpis.active} variant="success" icon="ticket" />
        <StatCard label={t("kpi.used")} value={kpis.used30} variant="info" icon="trending" change={t("kpi.last30")} />
        <StatCard label={t("kpi.expiring")} value={kpis.expiring7} variant="warning" icon="clock" change={t("kpi.next7")} />
        <StatCard label={t("kpi.revoked")} value={kpis.revoked} variant="danger" icon="lock" />
      </StatGrid>

      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <SearchBox placeholder={t("search")} value={q} onChange={setQ} />
        <select
          className="bg-card border border-border rounded-lg px-3 h-[34px] text-[13px] text-text max-w-56"
          value={source}
          onChange={(e) => setSource(e.target.value as CouponSource | "all")}
          aria-label={t("cols.source")}
        >
          <option value="all">{t("filters.all_sources")}</option>
          {SOURCES.map((s) => (
            <option key={s} value={s}>
              {t(`sources.${s}` as never)}
            </option>
          ))}
        </select>
        <select
          className="bg-card border border-border rounded-lg px-3 h-[34px] text-[13px] text-text max-w-56"
          value={promotionFilter}
          onChange={(e) => router.push(e.target.value ? `${pathname}?promotion=${e.target.value}` : pathname)}
          aria-label={t("cols.promotion")}
        >
          <option value="">{t("filters.all_promotions")}</option>
          {promotions.map((p) => (
            <option key={p.id} value={p.id}>
              {p.title}
              {p.archived ? ` (${t("filters.archived")})` : ""}
            </option>
          ))}
        </select>
        <Link href="/coupons/new" className="ms-auto">
          <Button icon="plus" type="button">
            {t("new_coupon")}
          </Button>
        </Link>
      </div>

      <FilterPills<CouponStatus | "all">
        options={[["all", t("filters.all_status")], ["active", t("statuses.active")], ["used", t("statuses.used")], ["expired", t("statuses.expired")], ["revoked", t("statuses.revoked")]]}
        value={status}
        onChange={setStatus}
      />
      {truncated && <p className="text-warning text-xs mb-2">{t("truncated")}</p>}
      {msg && !dialog && <p className="text-danger text-sm mb-3">{msg}</p>}
      <DataTable<CouponListRow> columns={columns} data={shown} error={error} emptyMessage={t("empty")} />

      <Modal
        open={!!dialog}
        onClose={() => setDialog(null)}
        title={dialog ? (dialog.kind === "extend" ? t("dialog.extend_title", { code: dialog.row.code }) : t("dialog.revoke_title", { code: dialog.row.code })) : ""}
      >
        {dialog && (
          <div>
            {dialog.kind === "extend" ? (
              <FormRow label={t("dialog.new_expiry")}>
                <input type="date" className={fInput} value={date} onChange={(e) => setDate(e.target.value)} dir="ltr" />
              </FormRow>
            ) : (
              <p className="text-sm text-subtext mb-4">{t("dialog.revoke_desc")}</p>
            )}
            <FormRow label={dialog.kind === "revoke" ? t("dialog.reason") : t("dialog.note")} hint={dialog.kind === "revoke" ? t("dialog.required") : t("dialog.optional")}>
              <textarea className={fInput} rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
            </FormRow>
            {msg && <p className="text-danger text-sm mb-3">{msg}</p>}
            <div className="flex gap-2.5 justify-end">
              <Button type="button" variant="secondary" onClick={() => setDialog(null)}>
                {t("dialog.cancel")}
              </Button>
              <Button type="button" variant={dialog.kind === "revoke" ? "danger" : "primary"} loading={pending} onClick={submit}>
                {dialog.kind === "revoke" ? t("actions.revoke") : t("actions.extend")}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
