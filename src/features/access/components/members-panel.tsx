"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Button, DashIcon, DataTable, SearchBox, StatCard, type Column } from "@/components/ui";
import { formatDay } from "@/features/promotions";
import {
  removeStaffPasskeys,
  resetStaffPassword,
  resetStaffTwoFactor,
  revokeStaffAccess,
  sendStaffResetEmail,
  suspendStaff,
} from "@/app/d/access/action";
import type { StaffMemberRow } from "@/app/d/access/data";
import { STAFF_ROLES, type StaffRole, type StaffStatus } from "../data";
import { RoleBadge } from "./role-badge";
import { StaffStatusBadge } from "./staff-status-badge";
import { MenuItem, RowMenu } from "./row-menu";
import { AddStaffDialog } from "./add-staff-dialog";
import { GrantAccessDialog } from "./grant-access-dialog";
import { ChangeRoleDialog, ConfirmDialog, TempPasswordDialog } from "./staff-dialogs";
import { FIELD, useErrorText } from "./shared";

const STATUSES: StaffStatus[] = ["active", "must_change", "never_signed_in", "suspended"];
const WEEK_MS = 7 * 24 * 3600 * 1000;

type ConfirmKind = "revoke" | "suspend" | "reinstate" | "reset" | "reset_email" | "reset_mfa" | "remove_passkeys";
type Dialog =
  | { type: "add" }
  | { type: "grant"; query?: string }
  | { type: "role"; m: StaffMemberRow }
  | { type: "confirm"; kind: ConfirmKind; m: StaffMemberRow }
  | { type: "temp"; email: string; name: string; password: string; reset: boolean };

/** Current time, set after mount so server and first client render agree. */
function useNow(): number | null {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const id = setTimeout(() => setNow(Date.now()), 0);
    return () => clearTimeout(id);
  }, []);
  return now;
}

const selectCls = `${FIELD} !w-auto !py-0 h-[34px] !rounded-lg !text-[13px] cursor-pointer`;

export function MembersPanel({ staff, currentUserId }: { staff: StaffMemberRow[]; currentUserId: string }) {
  const t = useTranslations("access");
  const locale = useLocale();
  const router = useRouter();
  const errorText = useErrorText();
  const now = useNow();

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<StaffRole | "all">("all");
  const [statusFilter, setStatusFilter] = useState<StaffStatus | "all">("all");
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const activeSupers = staff.filter((m) => m.staffRole === "super_admin" && m.status !== "suspended").length;
  const kpi = {
    total: staff.length,
    supers: staff.filter((m) => m.staffRole === "super_admin").length,
    recent:
      now == null
        ? 0
        : staff.filter((m) => m.lastSignInAt && now - new Date(m.lastSignInAt).getTime() < WEEK_MS).length,
    suspended: staff.filter((m) => m.status === "suspended").length,
  };

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    const qDigits = q.replace(/\D/g, "");
    return staff.filter((m) => {
      if (roleFilter !== "all" && m.staffRole !== roleFilter) return false;
      if (statusFilter !== "all" && m.status !== statusFilter) return false;
      if (!q) return true;
      return (
        m.name.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        (qDigits.length > 1 && (m.phone ?? "").replace(/\D/g, "").includes(qDigits))
      );
    });
  }, [staff, search, roleFilter, statusFilter]);

  const rel = useMemo(() => new Intl.RelativeTimeFormat(locale, { numeric: "auto", style: "short" }), [locale]);
  function relative(iso: string | null): string | null {
    if (!iso || now == null) return null;
    const diff = new Date(iso).getTime() - now;
    if (Number.isNaN(diff) || -diff >= WEEK_MS) return null;
    const mins = Math.round(diff / 60000);
    if (Math.abs(mins) < 60) return rel.format(Math.min(mins, 0), "minute");
    const hours = Math.round(mins / 60);
    if (Math.abs(hours) < 24) return rel.format(hours, "hour");
    return rel.format(Math.round(hours / 24), "day");
  }

  function closeDialog() {
    setDialog(null);
    setActionError(null);
    setBusy(false);
  }
  function finish() {
    closeDialog();
    router.refresh();
  }

  async function runConfirm(kind: ConfirmKind, m: StaffMemberRow) {
    setBusy(true);
    setActionError(null);
    if (kind === "reset") {
      const res = await resetStaffPassword(m.id);
      setBusy(false);
      if (res.error || !res.tempPassword) return setActionError(errorText(res.error ?? "generic"));
      setDialog({ type: "temp", email: m.email, name: m.name, password: res.tempPassword, reset: true });
      return;
    }
    const res =
      kind === "revoke"
        ? await revokeStaffAccess(m.id)
        : kind === "reset_email"
          ? await sendStaffResetEmail(m.id)
          : kind === "reset_mfa"
            ? await resetStaffTwoFactor(m.id)
            : kind === "remove_passkeys"
              ? await removeStaffPasskeys(m.id)
              : await suspendStaff(m.id, kind === "suspend");
    setBusy(false);
    if (res.error) return setActionError(errorText(res.error));
    finish();
  }

  const columns: Column<StaffMemberRow>[] = [
    {
      key: "name",
      label: t("table.name"),
      render: (m) => (
        <div className="min-w-0 py-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-text" dir="auto">
              {m.name}
            </span>
            {m.id === currentUserId && (
              <span className="rounded-full bg-soft-pink px-2 py-0.5 text-[10px] font-bold uppercase text-primary">
                {t("you")}
              </span>
            )}
          </div>
          <div className="text-xs text-subtext" dir="ltr">
            <bdi>{m.email}</bdi>
          </div>
          {m.phone && (
            <div className="text-xs text-subtext" dir="ltr">
              <bdi>{m.phone}</bdi>
            </div>
          )}
          {((m.mfaFactors ?? 0) > 0 || (m.passkeyCount ?? 0) > 0) && (
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              {(m.mfaFactors ?? 0) > 0 && (
                <span
                  title={t("security.mfa_on")}
                  className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-bold text-success"
                >
                  <DashIcon name="shield" className="h-3 w-3" />
                  {t("security.mfa_badge")}
                </span>
              )}
              {(m.passkeyCount ?? 0) > 0 && (
                <span
                  title={t("security.passkeys", { count: m.passkeyCount ?? 0 })}
                  className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-subtext"
                >
                  <DashIcon name="lock" className="h-3 w-3" />
                  {t("security.passkeys_badge", { count: m.passkeyCount ?? 0 })}
                </span>
              )}
            </div>
          )}
        </div>
      ),
    },
    { key: "staffRole", label: t("table.role"), render: (m) => <RoleBadge role={m.staffRole} /> },
    { key: "status", label: t("table.status"), render: (m) => <StaffStatusBadge status={m.status} /> },
    {
      key: "lastSignInAt",
      label: t("table.last_sign_in"),
      render: (m) => {
        if (!m.lastSignInAt) return <span className="text-subtext">{t("never")}</span>;
        const r = relative(m.lastSignInAt);
        return (
          <div className="whitespace-nowrap">
            <div>{formatDay(m.lastSignInAt, locale)}</div>
            {r && <div className="text-xs text-subtext">{r}</div>}
          </div>
        );
      },
    },
    {
      key: "createdAt",
      label: t("table.created"),
      render: (m) => <span className="whitespace-nowrap">{formatDay(m.createdAt, locale)}</span>,
    },
    {
      key: "actions",
      label: t("table.actions"),
      render: (m) => {
        const self = m.id === currentUserId;
        const lastSuper = m.staffRole === "super_admin" && m.status !== "suspended" && activeSupers <= 1;
        const blocked = self ? t("guard.self") : lastSuper ? t("guard.last_super") : undefined;
        const suspended = m.status === "suspended";
        return (
          <div className="flex items-center gap-1.5">
            <Button
              variant="secondary"
              size="xs"
              disabled={!!blocked}
              title={blocked}
              onClick={() => setDialog({ type: "role", m })}
            >
              {t("row.change_role")}
            </Button>
            <RowMenu label={t("row.more")}>
              {(close) => (
                <>
                  <MenuItem
                    disabled={self}
                    title={self ? t("guard.self") : undefined}
                    onClick={() => {
                      close();
                      setDialog({ type: "confirm", kind: "reset", m });
                    }}
                  >
                    {t("row.reset_password")}
                  </MenuItem>
                  <MenuItem
                    disabled={self}
                    title={self ? t("guard.self") : undefined}
                    onClick={() => {
                      close();
                      setDialog({ type: "confirm", kind: "reset_email", m });
                    }}
                  >
                    {t("row.reset_email")}
                  </MenuItem>
                  {(m.mfaFactors ?? 0) > 0 && (
                    <MenuItem
                      onClick={() => {
                        close();
                        setDialog({ type: "confirm", kind: "reset_mfa", m });
                      }}
                    >
                      {t("row.reset_mfa")}
                    </MenuItem>
                  )}
                  {(m.passkeyCount ?? 0) > 0 && (
                    <MenuItem
                      onClick={() => {
                        close();
                        setDialog({ type: "confirm", kind: "remove_passkeys", m });
                      }}
                    >
                      {t("row.remove_passkeys")}
                    </MenuItem>
                  )}
                  <MenuItem
                    disabled={suspended ? false : !!blocked}
                    title={suspended ? undefined : blocked}
                    onClick={() => {
                      close();
                      setDialog({ type: "confirm", kind: suspended ? "reinstate" : "suspend", m });
                    }}
                  >
                    {suspended ? t("row.reinstate") : t("row.suspend")}
                  </MenuItem>
                  <MenuItem
                    danger
                    disabled={!!blocked}
                    title={blocked}
                    onClick={() => {
                      close();
                      setDialog({ type: "confirm", kind: "revoke", m });
                    }}
                  >
                    {t("row.revoke")}
                  </MenuItem>
                </>
              )}
            </RowMenu>
          </div>
        );
      },
    },
  ];

  return (
    <>
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 mb-6">
        <StatCard label={t("kpi.total")} value={kpi.total} icon="users" variant="primary" />
        <StatCard label={t("kpi.super_admins")} value={kpi.supers} icon="shield" variant="info" />
        <StatCard label={t("kpi.recent")} value={kpi.recent} icon="clock" variant="success" />
        <StatCard label={t("kpi.suspended")} value={kpi.suspended} icon="lock" variant="warning" />
      </div>

      <div className="flex flex-wrap items-center gap-2.5 mb-4">
        <SearchBox placeholder={t("search_ph")} value={search} onChange={setSearch} />
        <select
          aria-label={t("table.role")}
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as StaffRole | "all")}
          className={selectCls}
        >
          <option value="all">{t("filter.all_roles")}</option>
          {STAFF_ROLES.map((r) => (
            <option key={r} value={r}>
              {t(`roles.${r}.name`)}
            </option>
          ))}
        </select>
        <select
          aria-label={t("table.status")}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StaffStatus | "all")}
          className={selectCls}
        >
          <option value="all">{t("filter.all_status")}</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {t(`status.${s}`)}
            </option>
          ))}
        </select>
        <div className="ms-auto flex items-center gap-2">
          <Button variant="secondary" size="sm" icon="users" onClick={() => setDialog({ type: "grant" })}>
            {t("toolbar.grant")}
          </Button>
          <Button size="sm" icon="plus" onClick={() => setDialog({ type: "add" })}>
            {t("toolbar.add")}
          </Button>
        </div>
      </div>

      <DataTable<StaffMemberRow> columns={columns} data={shown} emptyMessage={t("empty")} />

      {dialog?.type === "add" && (
        <AddStaffDialog
          onClose={closeDialog}
          onCreated={(r) => setDialog({ type: "temp", ...r, reset: false })}
          onGrantInstead={(email) => setDialog({ type: "grant", query: email })}
        />
      )}
      {dialog?.type === "grant" && (
        <GrantAccessDialog initialQuery={dialog.query} onClose={closeDialog} onDone={finish} />
      )}
      {dialog?.type === "role" && (
        <ChangeRoleDialog
          userId={dialog.m.id}
          name={dialog.m.name}
          current={dialog.m.staffRole}
          onClose={closeDialog}
          onDone={finish}
        />
      )}
      {dialog?.type === "confirm" && (
        <ConfirmDialog
          title={t(`confirm.${dialog.kind}.title`)}
          desc={t(`confirm.${dialog.kind}.desc`, { name: dialog.m.name })}
          actionLabel={t(`confirm.${dialog.kind}.action`)}
          danger={dialog.kind !== "reinstate"}
          busy={busy}
          error={actionError}
          onConfirm={() => runConfirm(dialog.kind, dialog.m)}
          onClose={closeDialog}
        />
      )}
      {dialog?.type === "temp" && (
        <TempPasswordDialog
          email={dialog.email}
          name={dialog.name}
          password={dialog.password}
          reset={dialog.reset}
          onDone={finish}
        />
      )}
    </>
  );
}
