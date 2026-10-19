"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Badge, Button, Card, FormRow, Toggle, fInput } from "@/components/ui";
import {
  getKbIndexStatus,
  listEmbeddingModels,
  reindexKb,
  saveRagSettings,
  searchKb,
} from "@/app/d/support/rag-action";
import {
  RAG_LOCALES,
  RAG_PROVIDERS,
  RAG_ROLES,
  type KbIndexStatus,
  type KbSearchResponse,
  type RagLocale,
  type RagProvider,
  type RagRole,
  type SupportRagConfig,
} from "../rag";

// Support → AI → knowledge retrieval (RAG): settings, index status, test search.
// Settings are written to the RAG columns of `ai_settings`; the rest talks to
// blink-server's staff endpoints through server actions (never from the browser).

const PROVIDER_LABELS: Record<RagProvider, string> = {
  openrouter: "OpenRouter",
  ollama: "Ollama",
  lmstudio: "LM Studio",
};

const ltr = { direction: "ltr" as const };
const num = (n: number | null | undefined, d = 3) => (n == null ? "—" : n.toFixed(d));

export function RagPanel({
  initial,
  migrationPending,
  loadError,
}: {
  initial: SupportRagConfig;
  migrationPending?: boolean;
  loadError?: string | null;
}) {
  const t = useTranslations("support.rag");
  const locale = useLocale();

  // ── settings ──
  const [enabled, setEnabled] = useState(initial.rag_enabled);
  const [provider, setProvider] = useState<RagProvider>(initial.embedding_provider);
  const [model, setModel] = useState(initial.embedding_model ?? "");
  const [topK, setTopK] = useState(String(initial.rag_top_k));
  const [minScore, setMinScore] = useState(String(initial.rag_min_score));
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  useEffect(() => {
    let alive = true;
    listEmbeddingModels(provider).then((r) => alive && setSuggestions(r.data ?? []));
    return () => {
      alive = false;
    };
  }, [provider]);

  async function onSave() {
    setSaving(true);
    setResult(null);
    const { error } = await saveRagSettings({
      rag_enabled: enabled,
      embedding_provider: provider,
      embedding_model: model.trim() || null,
      rag_top_k: Number(topK),
      rag_min_score: Number(minScore),
    });
    setSaving(false);
    setResult(error ? { ok: false, msg: error } : { ok: true, msg: t("saved") });
  }

  // ── index status ──
  const [status, setStatus] = useState<KbIndexStatus | null>(null);
  const [statusErr, setStatusErr] = useState<string | null>(null);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const alive = useRef(true);

  const refreshRef = useRef<() => Promise<void>>(async () => {});
  const refresh = useCallback(async () => {
    const r = await getKbIndexStatus();
    if (!alive.current) return;
    setStatus(r.data);
    setStatusErr(r.error);
    if (timer.current) clearTimeout(timer.current);
    if (r.data?.syncing) timer.current = setTimeout(() => refreshRef.current(), 3000);
  }, []);
  useEffect(() => {
    refreshRef.current = refresh;
  }, [refresh]);

  useEffect(() => {
    alive.current = true;
    refresh();
    return () => {
      alive.current = false;
      if (timer.current) clearTimeout(timer.current);
    };
  }, [refresh]);

  async function onReindex(full: boolean) {
    setBusy(true);
    setSyncMsg(null);
    const r = await reindexKb(full);
    setBusy(false);
    if (r.error) setSyncMsg(r.error === "unavailable" ? t("unavailable") : r.error);
    else if (r.data && !r.data.started) setSyncMsg(t("already_syncing"));
    await refresh();
  }

  // ── test retrieval ──
  const [query, setQuery] = useState("");
  const [role, setRole] = useState<RagRole>("customer");
  const [lang, setLang] = useState<RagLocale>("en");
  const [searching, setSearching] = useState(false);
  const [search, setSearch] = useState<KbSearchResponse | null>(null);
  const [searchErr, setSearchErr] = useState<string | null>(null);
  const [open, setOpen] = useState<Record<number, boolean>>({});

  async function onSearch() {
    if (!query.trim()) return;
    setSearching(true);
    setSearchErr(null);
    setOpen({});
    const r = await searchKb({ query, role, locale: lang });
    setSearching(false);
    setSearch(r.data);
    setSearchErr(r.error === "unavailable" ? t("unavailable") : r.error);
  }

  const dateFmt = (iso: string | null) =>
    iso
      ? new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso))
      : t("never");

  const stat = (label: string, value: string | number) => (
    <div className="rounded-xl border border-border bg-background px-4 py-3">
      <div className="text-[11.5px] text-subtext">{label}</div>
      <div className="text-[18px] font-bold text-text" style={ltr}>
        {value}
      </div>
    </div>
  );

  return (
    <div className="flex max-w-[680px] flex-col gap-6">
      {/* Settings */}
      <Card
        title={t("title")}
        description={t("desc")}
        action={
          <div className="flex items-center gap-3">
            <span className="text-[12.5px] font-bold text-text">{t("enabled")}</span>
            <Toggle on={enabled} onClick={() => setEnabled((v) => !v)} />
          </div>
        }
      >
        {(loadError || migrationPending) && (
          <div
            className={`mb-4 rounded-xl border px-4 py-3 text-sm ${
              loadError
                ? "border-danger/30 bg-danger-light text-danger"
                : "border-warning/30 bg-warning-light text-warning"
            }`}
          >
            {loadError ?? t("migration_pending")}
          </div>
        )}
        <p className="mb-5 text-[12.5px] text-subtext">{t("enabled_hint")}</p>

        <FormRow label={t("provider")}>
          <select
            className={fInput}
            value={provider}
            onChange={(e) => setProvider(e.target.value as RagProvider)}
          >
            {RAG_PROVIDERS.map((p) => (
              <option key={p} value={p}>
                {PROVIDER_LABELS[p]}
              </option>
            ))}
          </select>
        </FormRow>

        <FormRow label={t("model")} hint={t("model_hint")}>
          <input
            className={fInput}
            style={ltr}
            list="rag-embedding-models"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder={t("model_ph")}
          />
          <datalist id="rag-embedding-models">
            {suggestions.map((m) => (
              <option key={m} value={m} />
            ))}
          </datalist>
        </FormRow>

        <div className="grid grid-cols-2 gap-4">
          <FormRow label={t("top_k")} hint={t("top_k_hint")}>
            <input
              type="number"
              min={1}
              max={20}
              step={1}
              className={fInput}
              style={ltr}
              value={topK}
              onChange={(e) => setTopK(e.target.value)}
            />
          </FormRow>
          <FormRow label={t("min_score")} hint={t("min_score_hint")}>
            <input
              type="number"
              min={0}
              max={1}
              step={0.05}
              className={fInput}
              style={ltr}
              value={minScore}
              onChange={(e) => setMinScore(e.target.value)}
            />
          </FormRow>
        </div>

        <div className="mt-2 flex items-center gap-3">
          <Button loading={saving} onClick={onSave}>
            {t("save")}
          </Button>
          {result && (
            <span className={`text-[13px] font-semibold ${result.ok ? "text-success" : "text-danger"}`}>
              {result.msg}
            </span>
          )}
        </div>
      </Card>

      {/* Index status */}
      <Card
        title={t("status.title")}
        description={t("status.desc")}
        action={status?.syncing ? <Badge variant="info">{t("status.syncing")}</Badge> : undefined}
      >
        {statusErr ? (
          <div className="rounded-xl border border-border bg-background px-4 py-3 text-sm text-subtext">
            {statusErr === "unavailable" ? t("unavailable") : statusErr}
          </div>
        ) : !status ? (
          <p className="text-[13px] text-subtext">{t("loading")}</p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {stat(t("status.articles"), `${status.articles_indexed} / ${status.articles_published}`)}
              {stat(t("status.chunks"), status.chunks_indexed)}
              {stat(t("status.stale"), status.stale_articles)}
              {stat("EN", status.chunks_by_locale.en)}
              {stat("FR", status.chunks_by_locale.fr)}
              {stat("AR", status.chunks_by_locale.ar)}
            </div>
            <p className="mt-4 text-[12.5px] text-subtext">
              {t("status.last_synced")}: <span className="font-semibold text-text">{dateFmt(status.last_synced_at)}</span>
              {" · "}
              <span style={ltr}>
                {PROVIDER_LABELS[status.embedding_provider as RagProvider] ?? status.embedding_provider} ·{" "}
                {status.embedding_model}
              </span>
            </p>
            {status.last_error && (
              <div className="mt-3 rounded-xl border border-danger/30 bg-danger-light px-4 py-3 text-sm text-danger">
                <div className="font-semibold">{t("status.last_error")}</div>
                <div className="break-words" style={ltr}>
                  {status.last_error}
                </div>
              </div>
            )}
          </>
        )}
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Button variant="secondary" loading={busy} disabled={!!status?.syncing} onClick={() => onReindex(false)}>
            {t("status.sync")}
          </Button>
          <Button variant="secondary" loading={busy} disabled={!!status?.syncing} onClick={() => onReindex(true)}>
            {t("status.rebuild")}
          </Button>
          {syncMsg && <span className="text-[13px] font-semibold text-danger">{syncMsg}</span>}
        </div>
      </Card>

      {/* Test retrieval */}
      <Card title={t("test.title")} description={t("test.desc")}>
        <FormRow label={t("test.question")}>
          <textarea
            className={`${fInput} min-h-[80px] resize-y`}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("test.question_ph")}
          />
        </FormRow>
        <div className="grid grid-cols-2 gap-4">
          <FormRow label={t("test.role")}>
            <select className={fInput} value={role} onChange={(e) => setRole(e.target.value as RagRole)}>
              {RAG_ROLES.map((r) => (
                <option key={r} value={r}>
                  {t(`test.roles.${r}`)}
                </option>
              ))}
            </select>
          </FormRow>
          <FormRow label={t("test.locale")} hint={t("test.locale_hint")}>
            <select className={fInput} value={lang} onChange={(e) => setLang(e.target.value as RagLocale)}>
              {RAG_LOCALES.map((l) => (
                <option key={l} value={l}>
                  {l.toUpperCase()}
                </option>
              ))}
            </select>
          </FormRow>
        </div>
        <Button loading={searching} disabled={!query.trim()} onClick={onSearch}>
          {t("test.search")}
        </Button>

        {searchErr && <p className="mt-4 text-[13px] font-semibold text-danger">{searchErr}</p>}
        {search && (
          <div className="mt-5">
            <div className="mb-3 flex items-center gap-2 text-[12.5px] text-subtext">
              {t("test.mode")}:
              <Badge variant={search.mode === "hybrid" ? "success" : "warning"}>{t(`test.modes.${search.mode}`)}</Badge>
            </div>
            {search.results.length === 0 ? (
              <p className="rounded-xl border border-border bg-background px-4 py-3 text-[13px] text-subtext">
                {t("test.empty")}
              </p>
            ) : (
              <ol className="flex flex-col gap-3">
                {search.results.map((r, i) => (
                  <li key={`${r.article_id}-${i}`} className="rounded-xl border border-border bg-background p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[12px] font-bold text-subtext" style={ltr}>
                        #{i + 1}
                      </span>
                      <span className="text-[13.5px] font-semibold text-text">{r.title}</span>
                      <Badge variant="primary">{r.type}</Badge>
                      <Badge>{r.locale}</Badge>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-subtext" style={ltr}>
                      <span>
                        {t("test.score")} <b className="text-text">{num(r.score)}</b>
                      </span>
                      <span>
                        {t("test.similarity")} <b className="text-text">{num(r.similarity)}</b>
                      </span>
                      <span>
                        {t("test.keyword")} <b className="text-text">{num(r.keyword_rank)}</b>
                      </span>
                    </div>
                    <p
                      className={`mt-3 whitespace-pre-wrap text-[12.5px] leading-relaxed text-text ${
                        open[i] ? "" : "line-clamp-3"
                      }`}
                    >
                      {r.content}
                    </p>
                    <button
                      type="button"
                      className="mt-1 text-[12px] font-semibold text-primary hover:underline"
                      onClick={() => setOpen((o) => ({ ...o, [i]: !o[i] }))}
                    >
                      {open[i] ? t("test.less") : t("test.more")}
                    </button>
                  </li>
                ))}
              </ol>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
