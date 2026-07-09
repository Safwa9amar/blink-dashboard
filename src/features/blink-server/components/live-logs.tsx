"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Card, Button, Segmented, SearchBox } from "@/components/ui";
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

// Defensive ANSI strip. The backend strips SGR color codes before buffering, but an
// online instance running an older build may still send them — render plain text
// regardless of server version. Built from a runtime char so there's no control-char
// literal in source (keeps eslint's no-control-regex quiet).
const ANSI_SGR = new RegExp(`${String.fromCharCode(27)}\\[[0-9;]*m`, "g");
const stripAnsi = (s: string) => s.replace(ANSI_SGR, "");

// Best-effort parse of a hono/logger request line — "--> GET /x 200 12ms" (completed)
// or "<-- GET /x" (incoming). Pure enrichment for rendering + status filtering; lines
// that don't match (cron output, bot turns, errors) are unaffected.
type StatusClass = "2xx" | "3xx" | "4xx" | "5xx";
interface ParsedReq {
  method: string;
  path: string;
  status?: number;
  elapsed?: string;
}
const REQ_RE = /^\s*(?:-->|<--)\s+([A-Z]+)\s+(\S+)(?:\s+(\d{3})\s+(\S+))?/;
function parseRequest(clean: string): ParsedReq | null {
  const m = clean.match(REQ_RE);
  if (!m) return null;
  return { method: m[1], path: m[2], status: m[3] ? Number(m[3]) : undefined, elapsed: m[4] };
}
function statusClass(status: number): StatusClass | null {
  if (status >= 500 && status <= 599) return "5xx";
  if (status >= 400 && status <= 499) return "4xx";
  if (status >= 300 && status <= 399) return "3xx";
  if (status >= 200 && status <= 299) return "2xx";
  return null;
}
const STATUS_COLOR: Record<StatusClass, string> = {
  "2xx": "text-success",
  "3xx": "text-info",
  "4xx": "text-warning",
  "5xx": "text-danger",
};

// Export the current buffer to a text file so a tail can be saved before Clear wipes it.
function downloadLogs(entries: ServerLogEntry[], instance: ServerInstance) {
  const text = entries
    .map((l) => `${l.ts} ${l.level.toUpperCase().padEnd(5)} ${stripAnsi(l.msg)}`)
    .join("\n");
  const url = URL.createObjectURL(new Blob([text], { type: "text/plain" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `blink-server-${instance}-logs.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

// Blink Server → Live Logs. Polls the server's /logs ring buffer every few seconds
// (incrementally, via the last-seen id) and renders a live, auto-scrolling tail with
// search, level + status filtering, and click-to-expand request inspection.
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

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-subtext">{label}: </span>
      <span className="font-semibold break-all text-text">{value}</span>
    </div>
  );
}

function LiveLogsPanel({ instance }: { instance: ServerInstance }) {
  const t = useTranslations("blink_server.logs");
  const [logs, setLogs] = useState<ServerLogEntry[]>([]);
  const [live, setLive] = useState(true);
  const [filter, setFilter] = useState<"all" | ServerLogEntry["level"]>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | StatusClass>("all");
  const [q, setQ] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [atBottom, setAtBottom] = useState(true);
  const lastIdRef = useRef(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

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

  // Strip + parse once per buffer change; filters below run over the enriched list.
  const enriched = useMemo(
    () =>
      logs.map((l) => {
        const clean = stripAnsi(l.msg);
        return { entry: l, clean, req: parseRequest(clean) };
      }),
    [logs]
  );

  const needle = useMemo(() => q.trim().toLowerCase(), [q]);
  const shown = useMemo(
    () =>
      enriched.filter(({ entry, clean, req }) => {
        if (filter !== "all" && entry.level !== filter) return false;
        if (
          statusFilter !== "all" &&
          (req?.status == null || statusClass(req.status) !== statusFilter)
        )
          return false;
        if (needle && !clean.toLowerCase().includes(needle)) return false;
        return true;
      }),
    [enriched, filter, statusFilter, needle]
  );

  // Auto-scroll to the newest line as entries arrive — but only while the operator is
  // already at the bottom, and not while a row is expanded for inspection, so neither
  // reading older lines nor inspecting a line gets yanked away.
  useEffect(() => {
    if (atBottom && expandedId == null) bottomRef.current?.scrollIntoView({ block: "end" });
  }, [shown.length, atBottom, expandedId]);

  // Track whether the tail is pinned to the bottom (within a small threshold).
  function onScroll() {
    const el = scrollRef.current;
    if (!el) return;
    setAtBottom(el.scrollHeight - el.scrollTop - el.clientHeight < 40);
  }

  function jumpToLatest() {
    setAtBottom(true);
    bottomRef.current?.scrollIntoView({ block: "end" });
  }

  async function onClear() {
    await clearServerLogs(instance);
    setLogs([]);
    lastIdRef.current = 0;
    setExpandedId(null);
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
          <Button
            variant="secondary"
            size="sm"
            icon="download"
            onClick={() => downloadLogs(logs, instance)}
            disabled={logs.length === 0}
          >
            {t("download")}
          </Button>
          <Button variant="secondary" size="sm" icon="x" onClick={onClear}>
            {t("clear")}
          </Button>
        </div>
      }
    >
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-[12px] font-semibold text-subtext">{t("filter_level")}</span>
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
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[12px] font-semibold text-subtext">{t("f_status")}</span>
          <Segmented
            options={[
              ["all", t("all")],
              ["2xx", "2xx"],
              ["3xx", "3xx"],
              ["4xx", "4xx"],
              ["5xx", "5xx"],
            ]}
            value={statusFilter}
            onChange={(v) => setStatusFilter(v as typeof statusFilter)}
          />
        </div>
        <SearchBox placeholder={t("search_ph")} value={q} onChange={setQ} />
        <span className="text-[12px] text-subtext">{t("count", { n: shown.length })}</span>
      </div>

      {error && (
        <div className="mb-3 rounded-xl border border-danger/30 bg-danger-light px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      <div className="relative">
        <div
          ref={scrollRef}
          onScroll={onScroll}
          className="h-[calc(100vh-330px)] min-h-[360px] overflow-y-auto rounded-xl border border-border bg-background p-3 font-mono text-[12px] leading-relaxed"
        >
          {shown.length === 0 ? (
            <p className="py-8 text-center text-subtext">
              {logs.length === 0 ? t("empty") : t("no_match")}
            </p>
          ) : (
            shown.map(({ entry: l, clean, req }) => {
              const open = expandedId === l.id;
              const cls = req?.status != null ? statusClass(req.status) : null;
              return (
                <div key={l.id}>
                  <button
                    type="button"
                    dir="ltr"
                    aria-expanded={open}
                    aria-controls={`log-detail-${l.id}`}
                    onClick={() => {
                      // Don't toggle when the user is dragging to select text to copy.
                      if ((window.getSelection()?.toString() ?? "").length > 0) return;
                      setExpandedId(open ? null : l.id);
                    }}
                    className="flex w-full gap-2 whitespace-pre-wrap break-words rounded py-0.5 text-start hover:bg-card"
                  >
                    <span className="shrink-0 text-muted">
                      {new Date(l.ts).toLocaleTimeString()}
                    </span>
                    <span className={`shrink-0 font-bold uppercase ${LEVEL_COLOR[l.level]}`}>
                      {l.level}
                    </span>
                    {cls && (
                      <span className={`shrink-0 font-bold ${STATUS_COLOR[cls]}`}>{req!.status}</span>
                    )}
                    <span className="text-text">{clean}</span>
                  </button>
                  {open && (
                    <div
                      id={`log-detail-${l.id}`}
                      className="my-1 rounded-lg border border-border bg-card p-3 text-[12px]"
                    >
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 sm:grid-cols-4">
                        <Field label={t("f_time")} value={new Date(l.ts).toLocaleString()} />
                        <Field label={t("f_source")} value={l.source} />
                        {req && <Field label={t("f_method")} value={req.method} />}
                        {req && <Field label={t("f_route")} value={req.path} />}
                        {req?.status != null && (
                          <Field label={t("f_status")} value={String(req.status)} />
                        )}
                        {req?.elapsed && <Field label={t("f_duration")} value={req.elapsed} />}
                      </div>
                      <pre
                        dir="ltr"
                        className="mt-2 overflow-x-auto whitespace-pre-wrap break-words text-subtext"
                      >
                        {clean}
                      </pre>
                      <div className="mt-2">
                        <Button
                          variant="secondary"
                          size="xs"
                          icon="copy"
                          onClick={async () => {
                            try {
                              await navigator.clipboard?.writeText(clean);
                              setCopied(true);
                              setTimeout(() => setCopied(false), 1500);
                            } catch {
                              /* clipboard unavailable — no-op */
                            }
                          }}
                        >
                          {copied ? t("copied") : t("copy")}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>
        {!atBottom && (
          <button
            type="button"
            onClick={jumpToLatest}
            className="absolute bottom-3 end-3 rounded-full bg-primary px-3 py-1.5 text-[12px] font-semibold text-white shadow-lg"
          >
            {t("jump_latest")}
          </button>
        )}
      </div>
    </Card>
  );
}
