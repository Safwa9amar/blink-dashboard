"use client";

import {
  MembersPanel,
  RolesReference,
  PermissionMatrix,
  AuditLog,
  CreateStaffButton,
  GrantAccessButton,
} from "@/features/access";

export default function AccessClient({ tab }: { tab: "members" | "roles" | "activity" }) {
  switch (tab) {
    case "roles":
      return (
        <div className="space-y-7">
          <RolesReference />
          <PermissionMatrix />
        </div>
      );
    case "activity":
      return <AuditLog />;
    default:
      return (
        <>
          <div className="flex justify-end gap-2.5 mb-4">
            <GrantAccessButton />
            <CreateStaffButton />
          </div>
          <MembersPanel />
        </>
      );
  }
}
