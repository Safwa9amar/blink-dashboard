// Local row shapes for the Alerts feature. Source of truth is blink-server's Drizzle
// schema (src/db/schema/alert-rules.ts, alert-events.ts) — keep these in sync by hand.

export type AlertMetric =
  | "error_rate"
  | "avg_latency"
  | "cpu"
  | "memory"
  | "event_loop_lag"
  | "req_per_min"
  | "ai_limit_hits";
export type AlertComparator = "gt" | "gte" | "lt" | "lte";
export type AlertSeverity = "critical" | "warning" | "info";
export type AlertEventStatus = "active" | "resolved";

export interface AlertRuleRow {
  id: string;
  name: string;
  metric: AlertMetric;
  comparator: AlertComparator;
  threshold: number;
  severity: AlertSeverity;
  enabled: boolean;
  channels: string[];
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// Insert/update payload (columns with DB defaults optional).
export interface AlertRuleInsert {
  name: string;
  metric: AlertMetric;
  comparator: AlertComparator;
  threshold: number;
  severity: AlertSeverity;
  enabled?: boolean;
  channels?: string[];
}

export interface AlertEventRow {
  id: string;
  rule_id: string;
  status: AlertEventStatus;
  severity: AlertSeverity;
  value: number;
  message: string | null;
  fired_at: string;
  resolved_at: string | null;
  // Joined rule name (alert_events ⨝ alert_rules) for display.
  alert_rules?: { name: string } | null;
}
