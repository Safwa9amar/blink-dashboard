"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Card, Button, Badge, Segmented } from "@/components/ui";
import type { Variant } from "@/components/ui";
import {
  fetchAiLogs,
  clearAiLogs,
  type AiLogEntry,
  type AiLogKind,
} from "@/app/d/blink-server/ai-log-action";
import { InstanceSwitcher } from "./instance-switcher";
import { useServerInstanceStore } from "../instance-store";
import type { ServerInstance } from "../instances";

const POLL_MS = 3000;
const MAX_KEEP = 1000; // cap the client-side buffer

const KIND_VARIANT: Record<AiLogKind, Variant> = {
  reply: "success",
  rate_limit: "danger",
  quota: "danger",
  timeout: "warning",
  error: "danger",
};

// The "model reached its limit" kinds — emphasized with a tinted row.
const LIMIT_KINDS: AiLogKind[] = ["rate_limit", "quota"];

type Filter = "all" | "reply" | "error" | "limit";

function tokenTotal(e: AiLogEntry): number | null {
  return e.tokens?.total ?? null;
}

// Blink Server → AI Log. Polls the server's /ai-logs ring buffer every few seconds
// (incrementally, via the last-seen id) and renders a live tail of every AI call the
// bot makes — successful replies and failures, with the "model reached its limit"
// case (HTTP 429 / 402) highlighted. Super-admin only — the route + the server
// endpoint both enforce it.
export function AiLog() {
  const instance = useServerInstanceStore((s) => s.instance);
  return (
    <>
      <InstanceSwitcher />
      {/* key={instance} remounts the panel on switch → its tail/cursor reset cleanly */}
      <AiLogPanel key={instance} instance={instance} />
    </>
  );
}

function AiLogPanel({ instance }: { instance: ServerInstance }) {
  const t = useTranslations("blink_server.ai_log");
  const [logs, setLogs] = useState<AiLogEntry[]>([]);
  const [live, setLive] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");
  const [error, setError] = useState<string | null>(null);
  const lastIdRef = useRef(0);
  const bottomRef = useRef<HTMLDivElement>(null);

  const poll = useCallback(async () => {
    const { logs: fresh, lastId, error: err } = await fetchAiLogs(lastIdRef.current, instance);
    setError(err);
    if (err || !fresh.length) return;
    // Advance monotonically so a stale concurrent response can't rewind `since`.
    lastIdRef.current = Math.max(lastIdRef.current, lastId);
    setLogs((prev) => {
      // Dedupe by id — concurrent initial polls (StrictMode / remounts) can both
      // fetch the same entries; appending blindly would duplicate React keys.
      const seen = new Set(prev.map((l) => l.id));
      const add = fresh.filter((l) => !seen.has(l.id));
      if (!add.length) return prev;
      const merged = prev.concat(add);
      return merged.length > MAX_KEEP ? merged.slice(-MAX_KEEP) : merged;
    });
  }, [instance]);

  useEffect(() => {
    if (!live) return;
    void poll(); // fetch immediately, then on an interval
    const id = setInterval(() => void poll(), POLL_MS);
    return () => clearInterval(id);
  }, [live, poll]);

  const shown = logs.filter((l) => {
    if (filter === "all") return true;
    if (filter === "reply") return l.kind === "reply";
    if (filter === "error") return l.level === "error";
    return LIMIT_KINDS.includes(l.kind); // "limit"
  });

  const limitCount = logs.filter((l) => LIMIT_KINDS.includes(l.kind)).length;

  // Auto-scroll to the newest line as entries arrive.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [shown.length]);

  async function onClear() {
    await clearAiLogs(instance);
    setLogs([]);
    lastIdRef.current = 0;
  }

  return (
    <Card
      title={t("title")}
      description={t("desc")}
      action={
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-[12px] font-semibold text-subtext">
            <span
              className={`h-2 w-2 rounded-full ${live ? "bg-success animate-pulse" : "bg-subtext"}`}
            />
            {live ? t("live") : t("paused")}
          </span>
          <Button variant="secondary" size="sm" onClick={() => setLive((v) => !v)}>
            {live ? t("pause") : t("resume")}
          </Button>
          <Button variant="secondary" size="sm" icon="x" onClick={onClear}>
            {t("clear")}
          </Button>
        </div>
      }
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <Segmented
          options={[
            ["all", t("all")],
            ["reply", t("replies")],
            ["error", t("errors")],
            ["limit", t("limits")],
          ]}
          value={filter}
          onChange={(v) => setFilter(v as Filter)}
        />
        <div className="flex items-center gap-3 text-[12px] text-subtext">
          {limitCount > 0 && (
            <Badge variant="danger">{t("limit_count", { n: limitCount })}</Badge>
          )}
          <span>{t("count", { n: shown.length })}</span>
        </div>
      </div>

      {error && (
        <div className="mb-3 rounded-xl border border-danger/30 bg-danger-light px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      <div
        className="h-[calc(100vh-330px)] min-h-[360px] space-y-2 overflow-y-auto rounded-xl border border-border bg-background p-3"
        style={{ direction: "ltr" }}
      >
        {shown.length === 0 ? (
          <p className="py-8 text-center text-subtext">{t("empty")}</p>
        ) : (
          shown.map((l) => {
            const isLimit = LIMIT_KINDS.includes(l.kind);
            const isFail = l.level === "error";
            const total = tokenTotal(l);
            return (
              <div
                key={l.id}
                className={`rounded-lg border px-3 py-2 text-[12.5px] ${
                  isLimit
                    ? "border-danger/40 bg-danger-light"
                    : isFail
                      ? "border-danger/20 bg-card"
                      : "border-border bg-card"
                }`}
              >
                <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                  <span className="font-mono text-[11px] text-muted">
                    {new Date(l.ts).toLocaleTimeString()}
                  </span>
                  <Badge variant={KIND_VARIANT[l.kind]}>{t(`kind_${l.kind}`)}</Badge>
                  {l.source && (
                    <span className="font-semibold text-text">{l.source}</span>
                  )}
                  {l.userRole && <span className="text-subtext">{l.userRole}</span>}
                  <span className="text-subtext" style={{ direction: "ltr" }}>
                    {[l.provider, l.model].filter(Boolean).join(" · ") || "—"}
                  </span>
                  {l.statusCode != null && (
                    <span className={isFail ? "font-semibold text-danger" : "text-subtext"}>
                      HTTP {l.statusCode}
                    </span>
                  )}
                  {typeof l.latencyMs === "number" && (
                    <span className="text-muted">{(l.latencyMs / 1000).toFixed(1)}s</span>
                  )}
                  {total != null && (
                    <span className="text-muted">{t("tokens", { n: total })}</span>
                  )}
                </div>

                {l.userMessage && (
                  <p className="mt-1.5 line-clamp-2 text-subtext">
                    <span className="font-semibold text-text">{t("prompt")}: </span>
                    {l.userMessage}
                  </p>
                )}
                {isFail && l.message && (
                  <p className="mt-1 break-words font-mono text-[11.5px] text-danger">
                    {l.message}
                  </p>
                )}
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>
    </Card>
  );
}
