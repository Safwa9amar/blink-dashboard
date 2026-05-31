"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { PageHeader, SubTabs } from "@/components/ui";
import {
  ACCESS_LOG,
  AccessStats,
  MembersPanel,
  RolesReference,
  PermissionMatrix,
  AuditLog,
  CreateStaffButton,
  GrantAccessButton,
  useStaffStore,
} from "@/features/access";

export default function AccessClient() {
  const t = useTranslations("access");
  const [tab, setTab] = useState("members");
  const staffCount = useStaffStore((s) => s.staff.length);

  const tabs = [
    { id: "members", label: t("tabs.members"), icon: "users", count: String(staffCount) },
    { id: "roles", label: t("tabs.roles"), icon: "lock" },
    { id: "activity", label: t("tabs.activity"), icon: "clock", count: String(ACCESS_LOG.length) },
  ];

  return (
    <div>
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={
          tab === "members" ? (
            <>
              <GrantAccessButton />
              <CreateStaffButton />
            </>
          ) : null
        }
      />

      <AccessStats />

      <SubTabs tabs={tabs} active={tab} onChange={setTab} />

      {tab === "members" && <MembersPanel />}
      {tab === "roles" && (
        <div className="space-y-7">
          <RolesReference />
          <PermissionMatrix />
        </div>
      )}
      {tab === "activity" && <AuditLog />}
    </div>
  );
}
