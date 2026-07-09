export { AiServerSettings } from "./components/ai-server-settings";
export { AiLog } from "./components/ai-log";
export { LiveLogs } from "./components/live-logs";
export { InstanceSwitcher } from "./components/instance-switcher";
// Monitoring placeholders — see MONITORING_ROADMAP.md.
export { ServerHealth } from "./components/server-health";
export { Traffic } from "./components/traffic";
export { AiInsights } from "./components/ai-insights";
export { Alerts } from "./components/alerts";
export { SERVER_INSTANCES, type ServerInstance } from "./instances";
export { useServerInstanceStore, useHydrateServerInstance } from "./instance-store";
export type {
  AlertRuleRow,
  AlertRuleInsert,
  AlertEventRow,
  AlertMetric,
  AlertComparator,
  AlertSeverity,
  AlertEventStatus,
} from "./types";
