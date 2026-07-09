import type { Metadata } from "next";
import { pageMeta } from "@/lib/dash-metadata";
import { createAdminClient } from "@/lib/supabase/admin";
import { Alerts, type AlertRuleRow, type AlertEventRow } from "@/features/blink-server";

export function generateMetadata(): Promise<Metadata> {
  return pageMeta("blink_server", undefined, "tab_alerts");
}

export default async function Page() {
  const supabase = await createAdminClient();
  const [rulesRes, eventsRes] = await Promise.all([
    supabase.from("alert_rules").select("*").order("created_at", { ascending: false }),
    supabase
      .from("alert_events")
      .select("*, alert_rules(name)")
      .order("fired_at", { ascending: false })
      .limit(20),
  ]);
  return (
    <Alerts
      rules={(rulesRes.data as AlertRuleRow[] | null) ?? []}
      events={(eventsRes.data as AlertEventRow[] | null) ?? []}
      error={rulesRes.error?.message ?? null}
    />
  );
}
