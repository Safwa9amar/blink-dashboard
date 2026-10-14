"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Badge, DataTable, SearchBox, type Column, type Variant } from "@/components/ui";
import type { AccessEventRow } from "@/app/d/access/data";
import type { AccessEventAction } from "../types";
import { FIELD } from "./shared";

const ACTIONS: AccessEventAction[] = [
  "created",
  "granted",
  "role_changed",
  "revoked",
  "suspended",
  "reinstated",
  "password_reset",
  "password_changed",
];

const ACTION_VARIANT: Record<AccessEventAction, Variant> = {
  created: "success",
  granted: "success",
  role_changed: "info",
  revoked: "danger",
  suspended: "warning",
  reinstated: "primary",
  password_reset: "warning",
  password_changed: "default",
};

export function ActivityLog({ events }: { events: AccessEventRow[] }) {
  const t = useTranslations("access");
  const locale = useLocale();
  const [action, setAction] = useState<AccessEventAction | "all">("all");
  const [search, setSearch] = useState("");

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    return events.filter((e) => {
      if (action !== "all" && e.action !== action) return false;
      if (!q) return true;
      return [e.actorName, e.targetName, e.targetEmail].some((v) => v?.toLowerCase().includes(q));
    });
  }, [events, action, search]);

  const fmt = (iso: string) =>
    new Date(iso).toLocaleString(locale === "en" ? "en-GB" : locale, {
      timeZone: "Africa/Algiers",
      dateStyle: "short",
      timeStyle: "short",
    });
  const role = (r: string) => t(`roles.${r}.name` as never);

  const columns: Column<AccessEventRow>[] = [
    {
      key: "createdAt",
      label: t("table.when"),
      render: (e) => <span className="whitespace-nowrap">{fmt(e.createdAt)}</span>,
    },
    {
      key: "actorName",
      label: t("table.actor"),
      render: (e) => (
        <span dir="auto">
          <bdi>{e.actorName ?? "—"}</bdi>
        </span>
      ),
    },
    {
      key: "action",
      label: t("table.action"),
      render: (e) => <Badge variant={ACTION_VARIANT[e.action] ?? "default"}>{t(`events.${e.action}` as never)}</Badge>,
    },
    {
      key: "targetName",
      label: t("table.target"),
      render: (e) => (
        <div className="py-1">
          <div className="font-medium text-text" dir="auto">
            <bdi>{e.targetName ?? "—"}</bdi>
          </div>
          {e.targetEmail && (
            <div className="text-xs text-subtext" dir="ltr">
              <bdi>{e.targetEmail}</bdi>
            </div>
          )}
        </div>
      ),
    },
    {
      key: "toRole",
      label: t("table.change"),
      sortable: false,
      render: (e) =>
        e.fromRole || e.toRole ? (
          <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-[13px]">
            {e.fromRole ? role(e.fromRole) : "—"}
            <span aria-hidden className="inline-block rtl:-scale-x-100 text-subtext">
              →
            </span>
            {e.toRole ? role(e.toRole) : "—"}
          </span>
        ) : (
          <span className="text-subtext">—</span>
        ),
    },
    {
      key: "note",
      label: t("table.note"),
      render: (e) => (
        <span className="text-subtext" dir="auto">
          {e.note ?? "—"}
        </span>
      ),
    },
  ];

  return (
    <>
      <div className="flex flex-wrap items-center gap-2.5 mb-4">
        <SearchBox placeholder={t("search_ph")} value={search} onChange={setSearch} />
        <select
          aria-label={t("table.action")}
          value={action}
          onChange={(e) => setAction(e.target.value as AccessEventAction | "all")}
          className={`${FIELD} !w-auto !py-0 h-[34px] !rounded-lg !text-[13px] cursor-pointer`}
        >
          <option value="all">{t("filter.all_actions")}</option>
          {ACTIONS.map((a) => (
            <option key={a} value={a}>
              {t(`events.${a}`)}
            </option>
          ))}
        </select>
      </div>
      <DataTable<AccessEventRow> columns={columns} data={shown} emptyMessage={t("empty_events")} />
    </>
  );
}
