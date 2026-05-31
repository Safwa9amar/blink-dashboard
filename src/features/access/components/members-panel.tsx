"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { SearchBox, FilterPills, DataTable, type Column } from "@/components/ui";
import { STAFF_ROLES, type StaffMember, type StaffRole } from "../data";
import { useStaffStore } from "../store";
import { RoleBadge } from "./role-badge";
import { StaffStatusBadge } from "./staff-status-badge";
import { EditAccessButton } from "./edit-access-button";
import { RevokeAccessButton } from "./revoke-access-button";

type RoleFilter = "all" | StaffRole;

export function MembersPanel() {
  const t = useTranslations("access");
  const staff = useStaffStore((s) => s.staff);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");

  const roleOptions: [RoleFilter, string][] = [
    ["all", t("filter.all")],
    ...STAFF_ROLES.map((r) => [r, t(`roles.${r}.name`)] as [RoleFilter, string]),
  ];

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return staff.filter((m) => {
      const matchesRole = roleFilter === "all" || m.staffRole === roleFilter;
      const matchesQuery = !q || m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q);
      return matchesRole && matchesQuery;
    });
  }, [staff, query, roleFilter]);

  const columns: Column<StaffMember>[] = [
    {
      key: "name",
      label: t("table.name"),
      render: (row) => (
        <div>
          <div className="font-medium text-text">{row.name}</div>
          <div className="text-[12px] text-subtext">{row.email}</div>
        </div>
      ),
    },
    { key: "staffRole", label: t("table.role"), render: (row) => <RoleBadge role={row.staffRole} /> },
    { key: "status", label: t("table.status"), render: (row) => <StaffStatusBadge status={row.status} /> },
    {
      key: "lastActive",
      label: t("table.last_active"),
      render: (row) => <span className="text-subtext">{new Date(row.lastActive).toLocaleDateString()}</span>,
    },
    {
      key: "actions",
      label: t("table.actions"),
      render: (row) => (
        <div className="flex items-center gap-1">
          <EditAccessButton member={row} />
          <RevokeAccessButton member={row} />
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="flex items-center gap-3 mb-[18px]">
        <SearchBox placeholder={t("search_ph")} value={query} onChange={setQuery} />
      </div>
      <FilterPills options={roleOptions} value={roleFilter} onChange={setRoleFilter} />
      <DataTable columns={columns} data={rows} emptyMessage={t("empty")} />
    </div>
  );
}
