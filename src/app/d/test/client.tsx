"use client";

import { useTranslations } from "next-intl";
import {
  PageHeader,
  Card,
  StatCard,
  StatGrid,
  Badge,
} from "@/components/ui";

const LOG_ENTRIES = [
  { time: "2 min ago", action: "User login successful", variant: "success" as const },
  { time: "15 min ago", action: "API call /v1/orders processed", variant: "info" as const },
  { time: "45 min ago", action: "Cache cleared successfully", variant: "success" as const },
  { time: "1 hr ago", action: "DB migration ran: Schema updated", variant: "warning" as const },
  { time: "3 hrs ago", action: "Webhook fired for user creation", variant: "info" as const },
  { time: "Yesterday", action: "Config updated for payment gateway", variant: "danger" as const },
];

const SERVICES = [
  { name: "Authentication", status: "healthy", latency: "12ms" },
  { name: "Payments Gateway", status: "healthy", latency: "45ms" },
  { name: "Push Notifications", status: "degraded", latency: "300ms" },
  { name: "SMS Provider", status: "healthy", latency: "8ms" },
  { name: "Map/Geocoding API", status: "healthy", latency: "18ms" },
  { name: "Email Service", status: "down", latency: "—" },
] as const;

const STATUS_DOT: Record<string, string> = {
  healthy: "bg-green-500",
  degraded: "bg-yellow-500",
  down: "bg-red-500",
};

const DEPS = [
  { name: "Next.js", version: "16.2.6" },
  { name: "React", version: "19.2" },
  { name: "Supabase SSR", version: "0.6.x" },
  { name: "Tailwind CSS", version: "4.x" },
  { name: "next-intl", version: "4.x" },
];

const ENDPOINTS = [
  { method: "GET", path: "/api/v1/users", time: "23ms", reqs: "12.4K req/day", color: "text-green-500 bg-green-500/10" },
  { method: "POST", path: "/api/v1/orders", time: "45ms", reqs: "8.2K req/day", color: "text-blue-500 bg-blue-500/10" },
  { method: "GET", path: "/api/v1/trips", time: "18ms", reqs: "15.1K req/day", color: "text-green-500 bg-green-500/10" },
  { method: "POST", path: "/api/v1/auth/login", time: "89ms", reqs: "3.5K req/day", color: "text-blue-500 bg-blue-500/10" },
  { method: "GET", path: "/api/v1/riders", time: "31ms", reqs: "6.8K req/day", color: "text-green-500 bg-green-500/10" },
  { method: "PUT", path: "/api/v1/settings", time: "12ms", reqs: "240 req/day", color: "text-yellow-500 bg-yellow-500/10" },
];

const STORAGE = [
  { label: "Supabase Storage", used: "2.4 GB", total: "5 GB", pct: 48 },
  { label: "CDN Cache", used: "890 MB", total: "2 GB", pct: 44 },
  { label: "Database Backups", used: "3.1 GB", total: "10 GB", pct: 31 },
  { label: "Log Files", used: "450 MB", total: "1 GB", pct: 45 },
];

const CRON_JOBS = [
  { name: "Daily DB Backup", cron: "0 2 * * *", last: "2h ago", variant: "success" as const, status: "Passed" },
  { name: "Report Generation", cron: "0 6 * * *", last: "8h ago", variant: "success" as const, status: "Passed" },
  { name: "Cache Cleanup", cron: "*/30 * * * *", last: "5m ago", variant: "success" as const, status: "Passed" },
  { name: "Email Queue Flush", cron: "*/15 * * * *", last: "2m ago", variant: "warning" as const, status: "Slow" },
  { name: "Expired Token Purge", cron: "0 0 * * *", last: "14h ago", variant: "danger" as const, status: "Failed" },
];

const DB_STATS = [
  { label: "Tables", value: "24" },
  { label: "Total Rows", value: "1.2M" },
  { label: "DB Size", value: "856 MB" },
  { label: "Connections", value: "12/100" },
  { label: "Avg Query", value: "3.2ms" },
  { label: "Cache Hit Rate", value: "94.7%" },
];

const FEATURE_FLAGS = [
  { name: "Dark Mode", desc: "Enables dark theme mode for the application", enabled: true },
  { name: "Push Notifications", desc: "Allows sending real-time alerts to users", enabled: true },
  { name: "Biometric Login", desc: "Supports login via fingerprint or FaceID", enabled: false },
  { name: "Arabic RTL Support", desc: "Enables Right-to-Left layout for Arabic content", enabled: true },
  { name: "Cash on Delivery", desc: "Allows payment upon physical delivery of goods", enabled: true },
  { name: "Live Tracking V2", desc: "Uses the latest protocol for real-time location updates", enabled: false },
];

const PERF_METRICS = [
  { name: "Largest Contentful Paint (LCP)", value: "1.2s", trend: "down 8%", good: true },
  { name: "First Input Delay (FID)", value: "45ms", trend: "down 12%", good: true },
  { name: "Cumulative Layout Shift (CLS)", value: "0.05", trend: "up 2%", good: false },
  { name: "Time to First Byte (TTFB)", value: "180ms", trend: "down 15%", good: true },
];

const DEPLOYMENTS = [
  { hash: "abc1234", msg: "Fix payment gateway timeout", ago: "2h ago", variant: "success" as const },
  { hash: "def5678", msg: "Add Arabic translations for news", ago: "5h ago", variant: "success" as const },
  { hash: "ghi9012", msg: "Update rider matching algorithm", ago: "1d ago", variant: "success" as const },
  { hash: "jkl3456", msg: "Hotfix: SMS rate limiting", ago: "2d ago", variant: "warning" as const },
  { hash: "mno7890", msg: "Rollback CDN config change", ago: "3d ago", variant: "danger" as const },
];

const SECURITY_ITEMS = [
  { icon: "🔒", label: "SSL Certificate", value: "Valid until Dec 2026", color: "text-green-500" },
  { icon: "⚠️", label: "Failed Login Attempts", value: "23 today", color: "text-yellow-500" },
  { icon: "👥", label: "Active Sessions", value: "156", color: "text-text" },
  { icon: "🛡️", label: "Last Security Scan", value: "2h ago", color: "text-green-500" },
];

export default function TestClient() {
  const t = useTranslations("test");

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} description={t("description")} />

      {/* System Stats */}
      <StatGrid>
        <StatCard label="API Status" value="Online" icon="activity" />
        <StatCard label="Database" value="Connected" icon="database" />
        <StatCard label="Uptime" value="99.9%" icon="clock" />
        <StatCard label="Response Time" value="45ms" icon="zap" />
      </StatGrid>

      {/* Service Health */}
      <Card title="Service Health">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {SERVICES.map((svc) => (
            <div key={svc.name} className="rounded-lg bg-card p-4 border border-border">
              <div className="flex items-center mb-1">
                <span className={`w-2 h-2 rounded-full inline-block me-2 ${STATUS_DOT[svc.status]}`} />
                <span className="text-text font-medium">{svc.name}</span>
              </div>
              <div className="text-subtext text-sm">
                {svc.status === "down" ? "Status: Down" : `Latency: ${svc.latency}`}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Performance Metrics */}
      <Card title="Performance Metrics">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {PERF_METRICS.map((m) => (
            <div key={m.name} className="rounded-lg border border-border p-4">
              <p className="text-sm text-subtext">{m.name}</p>
              <div className="mt-1 flex items-end justify-between">
                <span className="text-2xl font-bold text-text">{m.value}</span>
                <span className={`text-xs ${m.good ? "text-green-500" : "text-red-500"}`}>
                  {m.good ? "↓" : "↑"} {m.trend}
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Security Overview */}
      <Card title="Security Overview">
        <div className="grid grid-cols-2 gap-4">
          {SECURITY_ITEMS.map((item) => (
            <div key={item.label} className="p-4 rounded-lg border border-border">
              <div className={`text-xl mb-2 ${item.color}`}>{item.icon}</div>
              <p className="text-sm text-subtext">{item.label}</p>
              <p className="text-lg font-semibold text-text">{item.value}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Database Stats */}
      <Card title="Database Stats">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {DB_STATS.map((stat) => (
            <div key={stat.label} className="p-3 rounded-lg border border-border">
              <p className="text-xs text-subtext uppercase tracking-wider">{stat.label}</p>
              <p className="text-lg font-semibold text-text mt-1">{stat.value}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* API Endpoints */}
      <Card title="API Endpoints">
        <div className="divide-y divide-border">
          {ENDPOINTS.map((ep) => (
            <div key={ep.path} className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${ep.color}`}>{ep.method}</span>
                <span className="font-mono text-sm text-text">{ep.path}</span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-subtext text-sm">{ep.time}</span>
                <span className="text-subtext text-xs">{ep.reqs}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Feature Flags */}
      <Card title="Feature Flags">
        <div className="divide-y divide-border">
          {FEATURE_FLAGS.map((flag) => (
            <div key={flag.name} className="flex items-center justify-between py-3">
              <div>
                <span className="text-text text-sm font-medium">{flag.name}</span>
                <span className="text-xs text-subtext block mt-0.5">{flag.desc}</span>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${flag.enabled ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}`}>
                {flag.enabled ? "Enabled" : "Disabled"}
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* Recent Deployments */}
      <Card title="Recent Deployments">
        <div className="divide-y divide-border">
          {DEPLOYMENTS.map((d) => (
            <div key={d.hash} className="flex items-center justify-between py-3">
              <div>
                <p className="font-mono text-xs text-primary">{d.hash}</p>
                <p className="text-sm text-text font-medium mt-0.5">{d.msg}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-subtext">{d.ago}</span>
                <Badge variant={d.variant}>{d.variant}</Badge>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Storage & Media */}
      <Card title="Storage & Media">
        <div>
          {STORAGE.map((s) => (
            <div key={s.label} className="py-3 border-b border-border last:border-b-0">
              <div className="flex justify-between mb-1">
                <span className="text-sm text-text">{s.label}</span>
                <span className="text-xs text-subtext">{s.used} / {s.total}</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full bg-primary" style={{ width: `${s.pct}%` }} />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Scheduled Jobs */}
      <Card title="Scheduled Jobs">
        <div className="divide-y divide-border">
          {CRON_JOBS.map((job) => (
            <div key={job.name} className="flex items-center justify-between py-3">
              <div>
                <div className="text-text text-sm font-medium">{job.name}</div>
                <div className="font-mono text-xs text-subtext">{job.cron}</div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-subtext">Last: {job.last}</span>
                <Badge variant={job.variant}>{job.status}</Badge>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Quick Actions */}
      <Card title="Quick Actions">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { emoji: "🗑️", label: "Clear Cache" },
            { emoji: "⚡", label: "Restart Workers" },
            { emoji: "🔄", label: "Run Migrations" },
            { emoji: "🌱", label: "Seed Database" },
          ].map((action) => (
            <div
              key={action.label}
              className="rounded-lg border border-border p-4 text-center cursor-pointer hover:bg-card-hover transition-colors"
            >
              <span className="text-2xl mb-2 block">{action.emoji}</span>
              <span className="text-sm text-text block">{action.label}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Recent Activity */}
      <Card title="Recent Activity">
        <div className="divide-y divide-border">
          {LOG_ENTRIES.map((entry) => (
            <div key={entry.action} className="flex justify-between items-center py-3">
              <div className="flex flex-col">
                <span className="text-sm text-subtext">{entry.time}</span>
                <span className="text-text font-medium">{entry.action}</span>
              </div>
              <Badge variant={entry.variant}>{entry.variant}</Badge>
            </div>
          ))}
        </div>
      </Card>

      {/* Dependencies */}
      <Card title="Dependencies">
        <div className="divide-y divide-border">
          {DEPS.map((dep) => (
            <div key={dep.name} className="flex items-center justify-between py-2">
              <span className="font-mono text-sm text-text">{dep.name}</span>
              <div className="flex items-center gap-3">
                <Badge variant="info">{dep.version}</Badge>
                <span className="text-green-500 text-xs">OK</span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Environment */}
      <Card title="Environment">
        <div className="divide-y divide-border">
          {[
            { label: "Node Version", value: "v22.x" },
            { label: "Environment", value: "Development" },
            { label: "Region", value: "Algeria / DZ" },
            { label: "Currency", value: "DZD" },
          ].map((item) => (
            <div key={item.label} className="flex justify-between py-2">
              <span className="text-subtext">{item.label}</span>
              <Badge variant="info">{item.value}</Badge>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
