"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Card, Button, Segmented } from "@/components/ui";
import {
  fetchServerLogs,
  clearServerLogs,
  type ServerLogEntry,
} from "@/app/d/blink-server/logs-action";
import { InstanceSwitcher } from "./instance-switcher";
import { useServerInstanceStore } from "../instance-store";
import type { ServerInstance } from "../instances";

const LEVEL_COLOR: Record<ServerLogEntry["level"], string> = {
  info: "text-subtext",
  warn: "text-warning",
  error: "text-danger",
};

const POLL_MS = 3000;
const MAX_KEEP = 1000; // cap the client-side buffer

// Blink Server → Live Logs. Polls the server's /logs ring buffer every few seconds
// (incrementally, via the last-seen id) and renders a live, auto-scrolling tail.
// Super-admin only — the route + the server endpoint both enforce it.
export function LiveLogs() {
  const instance = useServerInstanceStore((s) => s.instance);
  return (
    <>
      <InstanceSwitcher />
      {/* key={instance} remounts the panel on switch → its tail/cursor reset cleanly */}
      <LiveLogsPanel key={instance} instance={instance} />
    </>
  );
}

function LiveLogsPanel({ instance }: { instance: ServerInstance }) {
  const t = useTranslations("blink_server.logs");
  const [logs, setLogs] = useState<ServerLogEntry[]>([]);
  const [live, setLive] = useState(true);
  const [filter, setFilter] = useState<"all" | ServerLogEntry["level"]>("all");
  const [error, setError] = useState<string | null>(null);
  const lastIdRef = useRef(0);
  const bottomRef = useRef<HTMLDivElement>(null);

  const poll = useCallback(async () => {
    const { logs: fresh, lastId, error: err } = await fetchServerLogs(lastIdRef.current, instance);
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

  const shown = filter === "all" ? logs : logs.filter((l) => l.level === filter);

  // Auto-scroll to the newest line as entries arrive.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [shown.length]);

  async function onClear() {
    await clearServerLogs(instance);
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
      <div className="mb-3 flex items-center justify-between gap-3">
        <Segmented
          options={[
            ["all", t("all")],
            ["info", t("info")],
            ["warn", t("warn")],
            ["error", t("error")],
          ]}
          value={filter}
          onChange={(v) => setFilter(v as typeof filter)}
        />
        <span className="text-[12px] text-subtext">{t("count", { n: shown.length })}</span>
      </div>

      {error && (
        <div className="mb-3 rounded-xl border border-danger/30 bg-danger-light px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      <div
        className="h-[calc(100vh-330px)] min-h-[360px] overflow-y-auto rounded-xl border border-border bg-background p-3 font-mono text-[12px] leading-relaxed"
        style={{ direction: "ltr" }}
      >
        {shown.length === 0 ? (
          <p className="py-8 text-center text-subtext">{t("empty")}</p>
        ) : (
          shown.map((l) => (
            <div key={l.id} className="flex gap-2 whitespace-pre-wrap break-words py-0.5">
              <span className="shrink-0 text-muted">{new Date(l.ts).toLocaleTimeString()}</span>
              <span
                className={`shrink-0 font-bold uppercase ${LEVEL_COLOR[l.level]}`}
              >
                {l.level}
              </span>
              <span className="text-text">{l.msg}</span>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>
    </Card>
  );
}
