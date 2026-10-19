"use client";

import { useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Badge, Button, Card, DataTable, Modal, fInput, type Column, type Variant } from "@/components/ui";
import { createMcpToken, listMcpAudit, listMcpTokens, revokeMcpToken } from "./action";
import {
  EXPIRY_OPTIONS,
  MAX_ACTIVE_TOKENS,
  MCP_ENDPOINT,
  NAME_MAX,
  deriveStatus,
  type ExpiryDays,
  type McpAuditRow,
  type McpTokenRow,
  type McpTokenStatus,
} from "./shared";

const STATUS_VARIANT: Record<McpTokenStatus, Variant> = {
  active: "success",
  expired: "warning",
  revoked: "danger",
};

function CopyButton({ text, label }: { text: string; label: string }) {
  const t = useTranslations("blink_server.mcp");
  const [done, setDone] = useState(false);
  return (
    <Button
      variant="secondary"
      size="xs"
      icon={done ? "check" : "copy"}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setDone(true);
          setTimeout(() => setDone(false), 1500);
        } catch {
          /* clipboard unavailable */
        }
      }}
    >
      {done ? t("copied") : label}
    </Button>
  );
}

function CodeBlock({ title, code }: { title: string; code: string }) {
  const t = useTranslations("blink_server.mcp");
  return (
    <div className="mt-3">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-text">{title}</span>
        <CopyButton text={code} label={t("copy")} />
      </div>
      <pre
        dir="ltr"
        className="overflow-x-auto rounded-lg border border-border bg-muted p-3 text-start font-mono text-[12px] text-text whitespace-pre-wrap break-all"
      >
        {code}
      </pre>
    </div>
  );
}

export default function McpClient({
  isSuper,
  tokens: initialTokens,
  audit: initialAudit,
  migrationPending,
  error,
}: {
  isSuper: boolean;
  tokens: McpTokenRow[];
  audit: McpAuditRow[];
  migrationPending: boolean;
  error: string | null;
}) {
  const t = useTranslations("blink_server.mcp");
  const locale = useLocale();
  const [tokens, setTokens] = useState(initialTokens);
  const [audit, setAudit] = useState(initialAudit);
  const [name, setName] = useState("");
  const [days, setDays] = useState<ExpiryDays>(90);
  const [formError, setFormError] = useState<string | null>(null);
  const [revokeError, setRevokeError] = useState<string | null>(null);
  const [created, setCreated] = useState<string | null>(null);
  const [revoking, setRevoking] = useState<McpTokenRow | null>(null);
  const [pending, startTransition] = useTransition();

  const errText = (code: string | null) => {
    if (!code) return null;
    if (code === "invalid_name") return t("err_name", { max: NAME_MAX });
    if (code === "too_many_tokens") return t("err_limit", { max: MAX_ACTIVE_TOKENS });
    if (code === "migration_pending") return t("migration_pending_title");
    if (code === "invalid_expiry") return t("err_expiry");
    if (code === "not_authorized") return t("err_not_authorized");
    if (code === "not_found") return t("err_not_found");
    return t("err_generic");
  };

  const fmtDate = (iso: string | null) =>
    iso ? new Date(iso).toLocaleString(locale, { dateStyle: "medium", timeStyle: "short" }) : "—";
  const fmtRel = (iso: string | null) => {
    if (!iso) return t("never");
    const diff = (new Date(iso).getTime() - Date.now()) / 1000;
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
    const abs = Math.abs(diff);
    if (abs < 60) return rtf.format(Math.round(diff), "second");
    if (abs < 3600) return rtf.format(Math.round(diff / 60), "minute");
    if (abs < 86400) return rtf.format(Math.round(diff / 3600), "hour");
    return rtf.format(Math.round(diff / 86400), "day");
  };

  const refresh = async () => {
    const [tk, au] = await Promise.all([listMcpTokens(), listMcpAudit({ limit: 100 })]);
    if (tk.data) setTokens(tk.data);
    if (au.data) setAudit(au.data);
  };

  const onCreate = () => {
    setFormError(null);
    startTransition(async () => {
      const res = await createMcpToken({ name, expiresInDays: days });
      if (res.error || !res.data) return setFormError(errText(res.error));
      setCreated(res.data.token);
      setName("");
      await refresh();
    });
  };

  const onRevoke = () => {
    const row = revoking;
    if (!row) return;
    startTransition(async () => {
      const res = await revokeMcpToken(row.id);
      if (res.error) return setRevokeError(errText(res.error));
      setRevoking(null);
      await refresh();
    });
  };

  if (migrationPending) {
    return (
      <Card title={t("migration_pending_title")} description={t("migration_pending_desc")}>
        <p className="text-[13px] text-subtext">{t("migration_pending_hint")}</p>
      </Card>
    );
  }

  const tokenCols: Column<McpTokenRow>[] = [
    { key: "name", label: t("col_name"), render: (r) => <span className="font-medium text-text">{r.name}</span> },
    {
      key: "token_prefix",
      label: t("col_prefix"),
      sortable: false,
      render: (r) => (
        <span dir="ltr" className="font-mono text-[12px] text-subtext">
          {r.token_prefix}…
        </span>
      ),
    },
    ...(isSuper
      ? [
          {
            key: "owner_name",
            label: t("col_owner"),
            render: (r: McpTokenRow) => (
              <div className="min-w-0">
                <div className="text-text">{r.owner_name ?? "—"}</div>
                <div dir="ltr" className="truncate text-start text-[11.5px] text-subtext">
                  {r.owner_email ?? ""}
                </div>
              </div>
            ),
          } satisfies Column<McpTokenRow>,
        ]
      : []),
    { key: "created_at", label: t("col_created"), render: (r) => fmtDate(r.created_at) },
    { key: "last_used_at", label: t("col_last_used"), render: (r) => fmtRel(r.last_used_at) },
    {
      key: "expires_at",
      label: t("col_expires"),
      render: (r) => (r.expires_at ? fmtDate(r.expires_at) : t("no_expiry")),
    },
    {
      key: "status",
      label: t("col_status"),
      sortable: false,
      render: (r) => {
        const s = deriveStatus(r);
        return <Badge variant={STATUS_VARIANT[s]}>{t(`status_${s}`)}</Badge>;
      },
    },
    {
      key: "actions",
      label: "",
      sortable: false,
      render: (r) =>
        deriveStatus(r) === "revoked" ? null : (
          <Button variant="danger" size="xs" icon="trash" onClick={() => {
              setRevokeError(null);
              setRevoking(r);
            }}>
            {t("revoke")}
          </Button>
        ),
    },
  ];

  const auditCols: Column<McpAuditRow>[] = [
    {
      key: "tool",
      label: t("col_tool"),
      render: (r) => (
        <span dir="ltr" className="font-mono text-[12px] text-text">
          {r.tool}
        </span>
      ),
    },
    {
      key: "token_name",
      label: isSuper ? t("col_user_token") : t("col_token"),
      render: (r) => [r.owner_name, r.token_name].filter(Boolean).join(" · ") || "—",
    },
    {
      key: "ok",
      label: t("col_result"),
      sortable: false,
      render: (r) => (
        <span title={r.error ?? undefined}>
          <Badge variant={r.ok ? "success" : "danger"}>{r.ok ? t("result_ok") : t("result_error")}</Badge>
        </span>
      ),
    },
    {
      key: "row_count",
      label: t("col_rows"),
      render: (r) => <span dir="ltr">{r.row_count ?? "—"}</span>,
    },
    {
      key: "duration_ms",
      label: t("col_duration"),
      render: (r) => <span dir="ltr">{r.duration_ms != null ? `${r.duration_ms} ms` : "—"}</span>,
    },
    { key: "created_at", label: t("col_time"), render: (r) => fmtRel(r.created_at) },
  ];

  const cliSnippet = (tok: string) =>
    `claude mcp add --transport http blink ${MCP_ENDPOINT} --header "Authorization: Bearer ${tok}"`;
  const jsonSnippet = (tok: string) =>
    JSON.stringify(
      { mcpServers: { blink: { type: "http", url: MCP_ENDPOINT, headers: { Authorization: `Bearer ${tok}` } } } },
      null,
      2
    );

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-xl border border-danger/30 bg-danger-light px-4 py-3 text-sm text-danger">{errText(error)}</div>
      )}

      <Card title={t("intro_title")} description={t("intro_desc")}>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-text">{t("endpoint")}</span>
          <code dir="ltr" className="rounded-lg border border-border bg-muted px-2.5 py-1 font-mono text-[12px] text-text">
            {MCP_ENDPOINT}
          </code>
          <CopyButton text={MCP_ENDPOINT} label={t("copy")} />
        </div>
      </Card>

      <Card title={t("create_title")} description={t("create_desc", { max: MAX_ACTIVE_TOKENS })}>
        <div className="flex flex-wrap items-end gap-3">
          <label className="min-w-[220px] flex-1">
            <span className="mb-1.5 block text-xs font-semibold text-text">{t("field_name")}</span>
            <input
              className={fInput}
              value={name}
              maxLength={NAME_MAX}
              placeholder={t("name_placeholder")}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <label>
            <span className="mb-1.5 block text-xs font-semibold text-text">{t("field_expiry")}</span>
            <select
              className={fInput}
              value={days === null ? "never" : String(days)}
              onChange={(e) => setDays(e.target.value === "never" ? null : (Number(e.target.value) as ExpiryDays))}
            >
              {EXPIRY_OPTIONS.map((d) => (
                <option key={String(d)} value={d === null ? "never" : String(d)}>
                  {d === null ? t("expiry_never") : t("expiry_days", { count: d })}
                </option>
              ))}
            </select>
          </label>
          <Button icon="plus" loading={pending} disabled={pending || name.trim().length === 0} onClick={onCreate}>
            {t("create")}
          </Button>
        </div>
        {formError && <p className="mt-3 text-[13px] text-danger">{formError}</p>}

        {created && (
          <div className="mt-4 rounded-xl border border-primary/40 bg-soft-pink p-4">
            <p className="text-[13px] font-semibold text-primary">{t("created_warning")}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <code
                dir="ltr"
                className="break-all rounded-lg border border-border bg-card px-2.5 py-1.5 font-mono text-[12px] text-text"
              >
                {created}
              </code>
              <CopyButton text={created} label={t("copy")} />
            </div>
            <CodeBlock title={t("snippet_cli")} code={cliSnippet(created)} />
            <CodeBlock title={t("snippet_json")} code={jsonSnippet(created)} />
            <div className="mt-3">
              <Button variant="secondary" size="sm" onClick={() => setCreated(null)}>
                {t("done")}
              </Button>
            </div>
          </div>
        )}
      </Card>

      <Card title={t("tokens_title")} description={isSuper ? t("tokens_desc_super") : t("tokens_desc")}>
        <DataTable columns={tokenCols} data={tokens} keyField="id" emptyMessage={t("no_tokens")} pageSize={10} />
      </Card>

      <Card title={t("activity_title")} description={isSuper ? t("activity_desc_super") : t("activity_desc")}>
        <DataTable columns={auditCols} data={audit} keyField="id" emptyMessage={t("no_activity")} pageSize={10} />
      </Card>

      <Modal open={!!revoking} onClose={() => setRevoking(null)} title={t("revoke_title")}>
        <p className="text-[13px] text-subtext">{t("revoke_confirm", { name: revoking?.name ?? "" })}</p>
        {revokeError && <p className="mt-3 text-[13px] text-danger">{revokeError}</p>}
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={() => setRevoking(null)}>
            {t("cancel")}
          </Button>
          <Button variant="danger" size="sm" loading={pending} onClick={onRevoke}>
            {t("revoke")}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
