"use client";

import { useState, useTransition, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Card, Badge, Button, Toggle, DashIcon, fInput, type Variant } from "@/components/ui";
import {
  createAlertRule,
  updateAlertRule,
  toggleAlertRule,
  deleteAlertRule,
} from "@/app/d/blink-server/alerts/action";
import type {
  AlertRuleRow,
  AlertEventRow,
  AlertMetric,
  AlertComparator,
  AlertSeverity,
} from "../types";

const METRICS: AlertMetric[] = [
  "error_rate",
  "avg_latency",
  "cpu",
  "memory",
  "event_loop_lag",
  "req_per_min",
  "ai_limit_hits",
];
const COMPARATORS: { v: AlertComparator; sym: string }[] = [
  { v: "gt", sym: ">" },
  { v: "gte", sym: "≥" },
  { v: "lt", sym: "<" },
  { v: "lte", sym: "≤" },
];
const SEVERITIES: AlertSeverity[] = ["critical", "warning", "info"];
const ALL_CHANNELS = ["inapp", "email", "whatsapp"];
const CHANNEL_ICON: Record<string, string> = { inapp: "bell", email: "mail", whatsapp: "chat" };
const SEV_VARIANT: Record<AlertSeverity, Variant> = {
  critical: "danger",
  warning: "warning",
  info: "info",
};
const METRIC_UNIT: Record<AlertMetric, string> = {
  error_rate: "%",
  avg_latency: "ms",
  cpu: "%",
  memory: "%",
  event_loop_lag: "ms",
  req_per_min: "",
  ai_limit_hits: "",
};
const symbolOf = (c: AlertComparator) => COMPARATORS.find((x) => x.v === c)?.sym ?? c;

type TFn = (k: string) => string;

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const m = Math.round(diffMs / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `−${m}m`;
  const h = Math.round(m / 60);
  if (h < 24) return `−${h}h`;
  return `−${Math.round(h / 24)}d`;
}

export function Alerts({
  rules,
  events,
  error,
}: {
  rules: AlertRuleRow[];
  events: AlertEventRow[];
  error: string | null;
}) {
  const t = useTranslations("blink_server.alerts");
  const tk = t as unknown as TFn; // for the metric_/sev_/channel_ dynamic keys
  const [form, setForm] = useState<{ open: boolean; rule?: AlertRuleRow }>({ open: false });

  const metricLabel = (m: AlertMetric) => tk(`metric_${m}`);
  const sevLabel = (s: AlertSeverity) => tk(`sev_${s}`);
  const channelLabel = (c: string) => tk(`channel_${c}`);

  return (
    <>
      {error && (
        <div className="mb-4 rounded-xl border border-danger/30 bg-danger-light px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      <Card
        title={t("rules")}
        description={t("rules_desc")}
        className="mb-4"
        action={
          <Button variant="primary" size="sm" icon="plus" onClick={() => setForm({ open: true })}>
            {t("create_rule")}
          </Button>
        }
      >
        {rules.length === 0 ? (
          <p className="py-8 text-center text-[13px] text-subtext">{t("no_rules")}</p>
        ) : (
          <div className="divide-y divide-border/60">
            {rules.map((r) => (
              <RuleRow
                key={r.id}
                rule={r}
                metricLabel={metricLabel}
                sevLabel={sevLabel}
                onEdit={() => setForm({ open: true, rule: r })}
                t={t}
              />
            ))}
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card title={t("history")} description={t("history_desc")}>
          {events.length === 0 ? (
            <p className="py-8 text-center text-[13px] text-subtext">{t("no_events")}</p>
          ) : (
            <div className="divide-y divide-border/60">
              {events.map((e) => (
                <div
                  key={e.id}
                  className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge variant={SEV_VARIANT[e.severity]}>{sevLabel(e.severity)}</Badge>
                      <span className="truncate font-medium text-text">
                        {e.alert_rules?.name ?? "—"}
                      </span>
                    </div>
                    {e.message && (
                      <p className="mt-0.5 truncate font-mono text-[12px] text-subtext">
                        {e.message}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <Badge variant={e.status === "active" ? "danger" : "success"}>
                      {e.status === "active" ? t("status_active") : t("status_resolved")}
                    </Badge>
                    <span className="text-[12px] text-subtext">{relativeTime(e.fired_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card title={t("channels")} description={t("channels_desc")}>
          <div className="divide-y divide-border/60">
            {ALL_CHANNELS.map((c) => (
              <div
                key={c}
                className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
              >
                <span className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-subtext">
                    <DashIcon name={CHANNEL_ICON[c]} className="h-4 w-4" />
                  </span>
                  <span className="font-medium text-text">{channelLabel(c)}</span>
                </span>
                <Badge variant={c === "inapp" ? "success" : "default"}>
                  {c === "inapp" ? t("channel_active") : t("channel_soon")}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {form.open && (
        <RuleFormModal
          rule={form.rule}
          metricLabel={metricLabel}
          sevLabel={sevLabel}
          channelLabel={channelLabel}
          onClose={() => setForm({ open: false })}
          t={t}
        />
      )}
    </>
  );
}

function RuleRow({
  rule,
  metricLabel,
  sevLabel,
  onEdit,
  t,
}: {
  rule: AlertRuleRow;
  metricLabel: (m: AlertMetric) => string;
  sevLabel: (s: AlertSeverity) => string;
  onEdit: () => void;
  t: ReturnType<typeof useTranslations>;
}) {
  const [pending, start] = useTransition();
  const [confirm, setConfirm] = useState(false);
  const condition = `${metricLabel(rule.metric)} ${symbolOf(rule.comparator)} ${rule.threshold}${METRIC_UNIT[rule.metric]}`;

  return (
    <div className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-text">{rule.name}</span>
          <Badge variant={SEV_VARIANT[rule.severity]}>{sevLabel(rule.severity)}</Badge>
          {!rule.enabled && <Badge variant="default">{t("disabled")}</Badge>}
        </div>
        <p className="mt-0.5 font-mono text-[12px] text-subtext">{condition}</p>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        <Toggle
          on={rule.enabled}
          onClick={() => start(() => void toggleAlertRule(rule.id, !rule.enabled))}
        />
        <Button variant="ghost" size="xs" icon="pencil" onClick={onEdit} aria-label={t("edit_rule")} />
        <Button
          variant="ghost"
          size="xs"
          icon="trash"
          onClick={() => setConfirm(true)}
          aria-label={t("delete_rule")}
        />
      </div>

      {confirm && (
        <ModalShell onClose={() => setConfirm(false)} maxW="max-w-sm">
          <h2 className="mb-2 text-lg font-bold text-text">{t("delete_rule")}</h2>
          <p className="mb-6 text-sm text-subtext">{t("delete_confirm")}</p>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" size="sm" onClick={() => setConfirm(false)}>
              {t("cancel")}
            </Button>
            <Button
              variant="danger"
              size="sm"
              loading={pending}
              onClick={() =>
                start(async () => {
                  await deleteAlertRule(rule.id);
                  setConfirm(false);
                })
              }
            >
              {t("delete")}
            </Button>
          </div>
        </ModalShell>
      )}
    </div>
  );
}

function RuleFormModal({
  rule,
  metricLabel,
  sevLabel,
  channelLabel,
  onClose,
  t,
}: {
  rule?: AlertRuleRow;
  metricLabel: (m: AlertMetric) => string;
  sevLabel: (s: AlertSeverity) => string;
  channelLabel: (c: string) => string;
  onClose: () => void;
  t: ReturnType<typeof useTranslations>;
}) {
  const editing = !!rule;
  const [name, setName] = useState(rule?.name ?? "");
  const [metric, setMetric] = useState<AlertMetric>(rule?.metric ?? "error_rate");
  const [comparator, setComparator] = useState<AlertComparator>(rule?.comparator ?? "gt");
  const [threshold, setThreshold] = useState(String(rule?.threshold ?? ""));
  const [severity, setSeverity] = useState<AlertSeverity>(rule?.severity ?? "warning");
  const [channels, setChannels] = useState<string[]>(rule?.channels ?? ["inapp"]);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  function toggleChannel(c: string) {
    setChannels((cur) => (cur.includes(c) ? cur.filter((x) => x !== c) : [...cur, c]));
  }

  function submit() {
    const num = Number(threshold);
    if (!name.trim()) return setError(t("err_name"));
    if (threshold.trim() === "" || Number.isNaN(num)) return setError(t("err_threshold"));
    if (channels.length === 0) return setError(t("err_channels"));
    const payload = {
      name: name.trim(),
      metric,
      comparator,
      threshold: num,
      severity,
      channels,
    };
    start(async () => {
      const res = editing
        ? await updateAlertRule(rule.id, payload)
        : await createAlertRule(payload);
      if (res.error) setError(res.error);
      else onClose();
    });
  }

  return (
    <ModalShell onClose={onClose} maxW="max-w-md">
      <h2 className="mb-1 text-lg font-bold text-text">
        {editing ? t("edit_rule") : t("create_rule")}
      </h2>
      <p className="mb-5 text-sm text-subtext">{t("rules_desc")}</p>

      <div className="space-y-4">
        <Field label={t("f_name")}>
          <input className={fInput} value={name} onChange={(e) => setName(e.target.value)} />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label={t("f_metric")}>
            <select
              className={fInput}
              value={metric}
              onChange={(e) => setMetric(e.target.value as AlertMetric)}
            >
              {METRICS.map((m) => (
                <option key={m} value={m}>
                  {metricLabel(m)}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t("f_severity")}>
            <select
              className={fInput}
              value={severity}
              onChange={(e) => setSeverity(e.target.value as AlertSeverity)}
            >
              {SEVERITIES.map((s) => (
                <option key={s} value={s}>
                  {sevLabel(s)}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label={t("f_comparator")}>
            <select
              className={fInput}
              value={comparator}
              onChange={(e) => setComparator(e.target.value as AlertComparator)}
            >
              {COMPARATORS.map((c) => (
                <option key={c.v} value={c.v}>
                  {c.sym} {t(`cmp_${c.v}` as never)}
                </option>
              ))}
            </select>
          </Field>
          <Field label={`${t("f_threshold")} ${METRIC_UNIT[metric] ? `(${METRIC_UNIT[metric]})` : ""}`}>
            <input
              className={fInput}
              type="number"
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
            />
          </Field>
        </div>

        <Field label={t("f_channels")}>
          <div className="flex flex-wrap gap-2">
            {ALL_CHANNELS.map((c) => {
              const on = channels.includes(c);
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => toggleChannel(c)}
                  className={`rounded-full px-3 py-1.5 text-[13px] font-semibold transition-colors ${
                    on ? "bg-primary text-white" : "bg-muted text-subtext"
                  }`}
                >
                  {channelLabel(c)}
                </button>
              );
            })}
          </div>
        </Field>

        {error && (
          <div className="rounded-xl border border-danger/20 bg-danger-light px-3 py-2 text-sm text-danger">
            {error}
          </div>
        )}
      </div>

      <div className="mt-6 flex justify-end gap-3">
        <Button variant="secondary" size="sm" onClick={onClose}>
          {t("cancel")}
        </Button>
        <Button variant="primary" size="sm" loading={pending} onClick={submit}>
          {t("save")}
        </Button>
      </div>
    </ModalShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-subtext">{label}</label>
      {children}
    </div>
  );
}

function ModalShell({
  children,
  onClose,
  maxW,
}: {
  children: ReactNode;
  onClose: () => void;
  maxW: string;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className={`relative w-full ${maxW} rounded-2xl border border-border bg-card p-6 shadow-xl`}>
        {children}
      </div>
    </div>
  );
}
