"use client";

import { MembersPanel, RolesReference, PermissionMatrix, ActivityLog, type StaffRole } from "@/features/access";
import type { AccessEventRow, StaffMemberRow } from "./data";

export type AccessClientProps =
  | { tab: "members"; staff: StaffMemberRow[]; currentUserId: string }
  | { tab: "roles"; counts: Record<StaffRole, number> }
  | { tab: "activity"; events: AccessEventRow[] };

export default function AccessClient(props: AccessClientProps) {
  switch (props.tab) {
    case "roles":
      return (
        <div className="space-y-7">
          <RolesReference counts={props.counts} />
          <PermissionMatrix />
        </div>
      );
    case "activity":
      return <ActivityLog events={props.events} />;
    default:
      return <MembersPanel staff={props.staff} currentUserId={props.currentUserId} />;
  }
}
