"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Card, Badge, Toggle, DashIcon, type Variant } from "@/components/ui";
import { InstanceSwitcher } from "./instance-switcher";
import { PreviewBanner } from "./preview-banner";

// Blink Server → Alerts (PLACEHOLDER). Threshold rules, recent-alert history and
// delivery channels. Toggles are local-only here — Phase 6 of the roadmap persists
// rules and wires firing into the existing notifications + email/WhatsApp channels.
const RULES: { id: string; condition: string; sev: string; variant: Variant }[] = [
  { id: "rule_error_rate", condition: "error rate > 5% / 5m", sev: "sev_critical", variant: "danger" },
  { id: "rule_latency", condition: "p95 > 1000 ms / 5m", sev: "sev_warning", variant: "warning" },
  { id: "rule_memory", condition: "memory > 80%", sev: "sev_warning", variant: "warning" },
  { id: "rule_down", condition: "/health fails ×3", sev: "sev_critical", variant: "danger" },
  { id: "rule_ai_limit", condition: "AI limit hits > 10 / 10m", sev: "sev_info", variant: "info" },
];

const HISTORY: { rule: string; sev: string; variant: Variant; time: string; status: string; statusVariant: Variant }[] = [
  { rule: "p95 > 1000 ms", sev: "sev_warning", variant: "warning", time: "−18m", status: "status_resolved", statusVariant: "success" },
  { rule: "AI limit hits", sev: "sev_info", variant: "info", time: "−2h", status: "status_resolved", statusVariant: "success" },
  { rule: "error rate > 5%", sev: "sev_critical", variant: "danger", time: "−6h", status: "status_resolved", statusVariant: "success" },
];

const CHANNELS = [
  { id: "channel_inapp", icon: "bell" },
  { id: "channel_email", icon: "mail" },
  { id: "channel_whatsapp", icon: "chat" },
];

export function Alerts() {
  const t = useTranslations("blink_server.alerts");
  // Local-only preview state — not persisted yet.
  const [rules, setRules] = useState<Record<string, boolean>>({
    rule_error_rate: true,
    rule_latency: true,
    rule_memory: false,
    rule_down: true,
    rule_ai_limit: false,
  });
  const [channels, setChannels] = useState<Record<string, boolean>>({
    channel_inapp: true,
    channel_email: false,
    channel_whatsapp: false,
  });

  return (
    <>
      <InstanceSwitcher />
      <PreviewBanner />

      <Card title={t("rules")} description={t("rules_desc")} className="mb-4">
        <div className="divide-y divide-border/60">
          {RULES.map((r) => (
            <div key={r.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-text">{t(r.id)}</span>
                  <Badge variant={r.variant}>{t(r.sev)}</Badge>
                </div>
                <p className="mt-0.5 font-mono text-[12px] text-subtext">{r.condition}</p>
              </div>
              <Toggle
                on={rules[r.id]}
                onClick={() => setRules((s) => ({ ...s, [r.id]: !s[r.id] }))}
              />
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card title={t("history")} description={t("history_desc")}>
          <div className="divide-y divide-border/60">
            {HISTORY.map((h, i) => (
              <div key={i} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                <div className="flex items-center gap-2">
                  <Badge variant={h.variant}>{t(h.sev)}</Badge>
                  <span className="font-medium text-text">{h.rule}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={h.statusVariant}>{t(h.status)}</Badge>
                  <span className="text-[12px] text-subtext">{h.time}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card title={t("channels")} description={t("channels_desc")}>
          <div className="divide-y divide-border/60">
            {CHANNELS.map((c) => (
              <div key={c.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                <span className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-subtext">
                    <DashIcon name={c.icon} className="h-4 w-4" />
                  </span>
                  <span className="font-medium text-text">{t(c.id)}</span>
                </span>
                <Toggle
                  on={channels[c.id]}
                  onClick={() => setChannels((s) => ({ ...s, [c.id]: !s[c.id] }))}
                />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}
