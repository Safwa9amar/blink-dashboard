"use client";

import { useEffect, useMemo, useRef, useState, useTransition, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useLocale } from "next-intl";
import { Avatar, Badge, Button, DataTable, FilterPills, SearchBox, StatCard, type Column } from "@/components/ui";
import { formatDay } from "@/features/promotions";
import type { DeskConversation, DeskData } from "@/app/d/support/desk-data";
import { assignChat, resolveChat } from "@/app/d/support/action";
import { setConversationPriority } from "@/app/d/support/desk-action";
import { PRIORITIES, formatMinutes, policyFor, slaState, type Priority, type SlaState } from "../metrics";
import { PriorityLabel, ROLE_BADGE, STATUS_VARIANT, SlaBadge, MigrationNotice, unitsOf, useNow } from "./desk-shared";
import type { TFn } from "../types";

const STATUSES = ["bot", "waiting", "assigned", "resolved"] as const;
const ROLES = ["customer", "rider", "merchant", "agent"] as const;
const ALL = "all";

interface Row extends DeskConversation {
  sla: SlaState | null;
  search: string;
}

/** Compact accessible "⋯" dropdown, fixed-positioned so the table's scroll container never clips it. */
function RowMenu({ label, children }: { label: string; children: (close: () => void) => ReactNode }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; end: number } | null>(null);
  const btn = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    const onDown = (e: MouseEvent) => {
      const n = e.target as Node;
      if (!menu.current?.contains(n) && !btn.current?.contains(n)) close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        close();
        btn.current?.focus();
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [open]);

  const toggle = () => {
    if (!open && btn.current) {
      const r = btn.current.getBoundingClientRect();
      const rtl = document.documentElement.dir === "rtl";
      setPos({ top: r.bottom + 4, end: rtl ? r.left : window.innerWidth - r.right });
    }
    setOpen((o) => !o);
  };

  return (
    <>
      <button
        ref={btn}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={label}
        title={label}
        onClick={toggle}
        className="inline-flex h-6 w-7 items-center justify-center rounded-md text-subtext hover:bg-muted hover:text-text"
      >
        <span aria-hidden>⋯</span>
      </button>
      {open && pos && (
        <div
          ref={menu}
          role="menu"
          className="fixed z-50 min-w-[170px] rounded-lg border border-border bg-card py-1 shadow-lg"
          style={{ top: pos.top, insetInlineEnd: pos.end }}
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </>
  );
}

function MenuItem({ onClick, disabled, children }: { onClick: () => void; disabled?: boolean; children: ReactNode }) {
  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      onClick={onClick}
      className="block w-full px-3 py-1.5 text-start text-[13px] text-text hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent"
    >
      {children}
    </button>
  );
}

const pick = <T extends string>(v: string | null, allowed: readonly T[]): T | typeof ALL =>
  allowed.includes(v as T) ? (v as T) : ALL;

export function TicketsTab({ t, data }: { t: TFn; data: DeskData }) {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const now = useNow();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const units = unitsOf(t);

  const [status, setStatus] = useState<string>(() => pick(params.get("status"), STATUSES));
  const [role, setRole] = useState<string>(() => pick(params.get("role"), ROLES));
  const [prio, setPrio] = useState<string>(() => pick(params.get("priority"), PRIORITIES));
  const [who, setWho] = useState<string>(() => pick(params.get("assignee"), ["me", "unassigned"] as const));
  const [q, setQ] = useState(() => params.get("q") ?? "");

  const nowMs = now ?? new Date(data.generatedAt).getTime();

  const rows: Row[] = useMemo(() => {
    const latest = new Map<string, DeskData["cases"][number]>();
    for (const c of data.cases) {
      const prev = latest.get(c.conversationId);
      if (!prev || prev.escalatedAt < c.escalatedAt) latest.set(c.conversationId, c);
    }
    return data.conversations.map((c) => {
      const k = latest.get(c.id);
      return {
        ...c,
        sla: k ? slaState(k, policyFor(data.policies, c.priority), nowMs) : null,
        search: `${c.subject ?? ""} ${c.ownerName ?? ""} ${c.last_message_preview ?? ""}`.toLowerCase(),
      };
    });
  }, [data, nowMs]);

  const kpi = useMemo(() => {
    const open = rows.filter((r) => r.status === "waiting" || r.status === "assigned");
    const today = new Date(data.generatedAt).getTime() - 86400000;
    return {
      open: open.length,
      unassigned: open.filter((r) => !r.assigned_agent_id).length,
      breached: open.filter((r) => r.sla?.state === "breached").length,
      resolved: rows.filter((r) => r.status === "resolved" && new Date(r.last_message_at).getTime() >= today).length,
    };
  }, [rows, data.generatedAt]);

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (status !== ALL && r.status !== status) return false;
      if (role !== ALL && r.user_role !== role) return false;
      if (prio !== ALL && r.priority !== prio) return false;
      if (who === "me" && r.assigned_agent_id !== data.meId) return false;
      if (who === "unassigned" && r.assigned_agent_id) return false;
      return !needle || r.search.includes(needle);
    });
  }, [rows, status, role, prio, who, q, data.meId]);

  const sync = (next: Record<string, string>) => {
    const sp = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(next)) {
      if (!v || v === ALL) sp.delete(k);
      else sp.set(k, v);
    }
    const qs = sp.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  // Debounce the search box into the URL.
  useEffect(() => {
    const id = setTimeout(() => sync({ q: q.trim() }), 300);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const run = (fn: () => Promise<{ error: string | null }>) => {
    setMsg(null);
    start(async () => {
      const res = await fn();
      if (res.error) setMsg(["not_authorized", "invalid", "migration_pending"].includes(res.error) ? t(`tk.err_${res.error}`) : res.error);
      else router.refresh();
    });
  };

  const ago = (iso: string) => {
    if (now == null) return formatDay(iso, locale);
    return t("tk.ago", { time: formatMinutes((now - new Date(iso).getTime()) / 60000, units) });
  };

  const columns: Column<Row>[] = [
    {
      key: "subject",
      label: t("tk.col_subject"),
      render: (r) => (
        <div className="min-w-[180px] max-w-[260px]">
          <span dir="auto" className="block font-semibold text-text truncate">{r.subject || t("tk.no_subject")}</span>
          {r.last_message_preview && <span dir="auto" className="block text-[11.5px] text-subtext truncate">{r.last_message_preview}</span>}
        </div>
      ),
    },
    {
      key: "ownerName",
      label: t("tk.col_user"),
      render: (r) => (
        <div className="flex items-center gap-2 min-w-[140px]">
          <Avatar name={r.ownerName ?? r.user_role} />
          <div className="min-w-0">
            <span dir="auto" className="block text-[13px] font-semibold text-text truncate">{r.ownerName ?? "—"}</span>
            <Badge variant={ROLE_BADGE[r.user_role] ?? "default"}>{t(`tk.role_${r.user_role}`)}</Badge>
          </div>
        </div>
      ),
    },
    { key: "status", label: t("tk.col_status"), render: (r) => <Badge variant={STATUS_VARIANT[r.status]}>{t(`tk.st_${r.status}`)}</Badge> },
    { key: "priority", label: t("tk.col_priority"), render: (r) => <PriorityLabel priority={r.priority} t={t} /> },
    {
      key: "assigneeName",
      label: t("tk.col_assignee"),
      render: (r) =>
        r.assigned_agent_id ? (
          <span dir="auto" className="text-[13px] text-text whitespace-nowrap">{r.assigneeName ?? "—"}</span>
        ) : (
          <span className="text-[13px] text-subtext whitespace-nowrap">{t("tk.unassigned")}</span>
        ),
    },
    {
      key: "unread_for_staff",
      label: t("tk.col_unread"),
      render: (r) => (r.unread_for_staff > 0 ? <Badge variant="primary">{r.unread_for_staff}</Badge> : <span className="text-subtext">0</span>),
    },
    { key: "sla", label: t("tk.col_sla"), sortable: false, render: (r) => <SlaBadge sla={r.sla} t={t} /> },
    {
      key: "last_message_at",
      label: t("tk.col_activity"),
      render: (r) => <span className="text-subtext text-xs whitespace-nowrap">{ago(r.last_message_at)}</span>,
    },
    {
      key: "actions",
      label: "",
      sortable: false,
      render: (r) => {
        const isOpen = r.status === "waiting" || r.status === "assigned";
        return (
          <div className="flex items-center gap-1" data-row-ignore>
            <Link href={`/support/inbox?c=${r.id}`} className="inline-flex">
              <Button size="xs" variant="secondary" icon="chevron-right" type="button">{t("tk.act_open")}</Button>
            </Link>
            <RowMenu label={t("tk.more")}>
              {(close) => (
                <>
                  {isOpen && r.assigned_agent_id !== data.meId && (
                    <MenuItem disabled={pending} onClick={() => { close(); run(() => assignChat(r.id)); }}>{t("tk.act_assign")}</MenuItem>
                  )}
                  {isOpen && (
                    <MenuItem disabled={pending} onClick={() => { close(); run(() => resolveChat(r.id)); }}>{t("tk.act_resolve")}</MenuItem>
                  )}
                  <div className="px-3 pt-1.5 pb-0.5 text-[10.5px] font-bold uppercase tracking-wide text-subtext">{t("tk.act_priority")}</div>
                  {PRIORITIES.map((p: Priority) => (
                    <MenuItem key={p} disabled={pending || r.priority === p} onClick={() => { close(); run(() => setConversationPriority(r.id, p)); }}>
                      {t(`tk.prio_${p}`)}
                    </MenuItem>
                  ))}
                </>
              )}
            </RowMenu>
          </div>
        );
      },
    },
  ];

  const chip = (label: string, value: string, set: (v: string) => void, key: string, options: [string, string][]) => (
    <label className="inline-flex items-center gap-2 text-[12px] text-subtext">
      {label}
      <select
        value={value}
        onChange={(e) => { set(e.target.value); sync({ [key]: e.target.value }); }}
        className="h-[34px] rounded-lg border border-border bg-card px-2 text-[13px] text-text"
      >
        {options.map(([v, l]) => (<option key={v} value={v}>{l}</option>))}
      </select>
    </label>
  );

  return (
    <>
      {data.migrationPending && <MigrationNotice t={t} />}
      {msg && <div className="mb-4 rounded-xl border border-danger/30 bg-danger-light px-4 py-3 text-sm text-danger">{msg}</div>}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard label={t("tk.k_open")} value={kpi.open} variant="danger" icon="support" />
        <StatCard label={t("tk.k_unassigned")} value={kpi.unassigned} variant="warning" icon="clock" />
        <StatCard label={t("tk.k_breached")} value={kpi.breached} variant="danger" icon="warn" />
        <StatCard label={t("tk.k_resolved")} value={kpi.resolved} variant="success" icon="shield" change={t("tk.last_24h")} />
      </div>
      <FilterPills
        options={[
          [ALL, t("tk.st_all"), "support"],
          ...STATUSES.map((s) => [s, t(`tk.st_${s}`)] as [string, string]),
        ]}
        value={status}
        onChange={(v) => { setStatus(v); sync({ status: v }); }}
      />
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <SearchBox placeholder={t("tk.search")} value={q} onChange={setQ} />
        {chip(t("tk.col_user"), role, setRole, "role", [[ALL, t("tk.all_roles")], ...ROLES.map((r) => [r, t(`tk.role_${r}`)] as [string, string])])}
        {chip(t("tk.col_priority"), prio, setPrio, "priority", [[ALL, t("tk.all_priorities")], ...PRIORITIES.map((p) => [p, t(`tk.prio_${p}`)] as [string, string])])}
        {chip(t("tk.col_assignee"), who, setWho, "assignee", [[ALL, t("tk.assignee_any")], ["me", t("tk.assignee_me")], ["unassigned", t("tk.unassigned")]])}
      </div>
      <DataTable columns={columns} data={shown} empty={t("tk.empty")} rowHref={(r) => `/support/inbox?c=${r.id}`} />
    </>
  );
}
