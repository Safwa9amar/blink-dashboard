import type { Metadata } from "next";
import { pageMeta } from "@/lib/dash-metadata";
import { getCurrentStaffRole } from "@/lib/auth/staff";
import { AiServerSettings } from "@/features/blink-server";
import { AssistantSettingsCard } from "@/features/assistant";

export function generateMetadata(): Promise<Metadata> {
  return pageMeta("blink_server", undefined, "tab_ai");
}

export default async function Page() {
  const role = await getCurrentStaffRole();
  return (
    <>
      <AiServerSettings />
      {role === "super_admin" && <AssistantSettingsCard />}
    </>
  );
}
