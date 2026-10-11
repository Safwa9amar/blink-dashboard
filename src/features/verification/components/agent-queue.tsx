"use client";

import { useState, useTransition } from "react";
import { Badge, Button, DashIcon, EmptyState, FilterPills } from "@/components/ui";
import { reviewAgentDocument, reviewAgentShop } from "@/app/d/verification/partner-action";
import { reviewErrorText } from "../queue";
import {
  AGENT_REASON_MAX,
  AGENT_VIEWS,
  agentDocLabel,
  agentsInView,
  type AgentQueueItem,
  type AgentQueueLoad,
  type AgentShopItem,
  type AgentView,
  type PartnerVerdict,
  type ShopDecision,
} from "../partners";
import type { ReviewOutcome, TFn } from "../types";
import { ApplicantCard } from "./applicant-card";
import { ApproveDialog } from "./approve-dialog";
import { DetailField } from "./detail-field";
import { DocumentTile } from "./document-tile";
import { PartnerDocActions } from "./partner-doc-actions";
import { PartnerNotice, type PartnerNoticeValue } from "./partner-notice";
import { AgentTable } from "./agent-table";

const VIEW_VARIANT = { pending: "warning", rejected: "danger" } as const;
const sectionTitle = "text-[11px] font-bold uppercase text-subtext mb-2.5";

// Agents queue: displays a master table list by default.
// Selecting an agent row opens their detailed verification card,
// with previous/next navigation and a back button.
export function AgentQueue({ t, locale, load }: { t: TFn; locale: string; load: AgentQueueLoad }) {
  const [view, setView] = useState<AgentView>("pending");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");
  const [notice, setNotice] = useState<PartnerNoticeValue | null>(null);

  const shown = agentsInView(load.items, view);
  const selectedAgent = selectedId ? load.items.find((a) => a.id === selectedId) : null;
  const currentIndex = selectedAgent ? shown.findIndex((a) => a.id === selectedAgent.id) : -1;

  const options: [AgentView, string][] = AGENT_VIEWS.map((v) => [
    v,
    t("partners.filter_count", { label: t(`partners.agent.filter.${v}`), n: load.counts[v] }),
  ]);

  function changeView(v: AgentView) {
    setView(v);
    setSelectedId(null);
    setNotice(null);
  }

  return (
    <>
      <PartnerNotice t={t} notice={notice} onDismiss={() => setNotice(null)} />

      {selectedAgent ? (
        <div>
          {/* Top Back & Stepper Navigation Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-card border border-border/80 rounded-2xl p-3 sm:p-3.5 mb-4 shadow-sm">
            <div className="flex items-center gap-2.5 min-w-0">
              <Button
                size="xs"
                variant="secondary"
                onClick={() => setSelectedId(null)}
                className="flex items-center gap-1.5"
              >
                <DashIcon name="chevron-left" className="w-3.5 h-3.5" />
                <span>{t("stores.table.back_to_agents")}</span>
              </Button>
              <span className="text-xs text-subtext/60 hidden sm:inline">|</span>
              <span className="text-xs font-semibold text-text truncate max-w-[200px] sm:max-w-xs">
                {selectedAgent.name || t("unnamed")}
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              {currentIndex >= 0 && (
                <span className="text-xs text-subtext font-medium">
                  {t("stores.table.agent_counter", { current: currentIndex + 1, total: shown.length })}
                </span>
              )}
              <div className="flex items-center gap-1">
                <Button
                  size="xs"
                  variant="outline"
                  disabled={currentIndex <= 0}
                  onClick={() => currentIndex > 0 && setSelectedId(shown[currentIndex - 1].id)}
                  aria-label="Previous agent"
                  className="px-2"
                >
                  <DashIcon name="chevron-left" className="w-3.5 h-3.5" />
                </Button>
                <Button
                  size="xs"
                  variant="outline"
                  disabled={currentIndex < 0 || currentIndex >= shown.length - 1}
                  onClick={() => currentIndex < shown.length - 1 && setSelectedId(shown[currentIndex + 1].id)}
                  aria-label="Next agent"
                  className="px-2"
                >
                  <DashIcon name="chevron-right" className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </div>

          <AgentCard t={t} locale={locale} agent={selectedAgent} onNotice={setNotice} />
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <FilterPills options={options} value={view} onChange={changeView} />

            <div className="flex items-center gap-1 bg-muted p-1 rounded-xl border border-border/40">
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  viewMode === "table"
                    ? "bg-card text-text shadow-sm border border-border/80"
                    : "text-subtext hover:text-text"
                }`}
              >
                <span>☷</span>
                <span>{t("stores.table.view_table")}</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("cards")}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  viewMode === "cards"
                    ? "bg-card text-text shadow-sm border border-border/80"
                    : "text-subtext hover:text-text"
                }`}
              >
                <span>⊞</span>
                <span>{t("stores.table.view_cards")}</span>
              </button>
            </div>
          </div>

          <p className="text-xs text-subtext -mt-2.5 mb-4">{t(`partners.agent.hint.${view}`)}</p>

          {shown.length === 0 ? (
            <EmptyState
              icon={<DashIcon name="shield" className="w-10 h-10" />}
              title={t(`partners.agent.empty.${view}`)}
              description={t(`partners.agent.empty.${view}_desc`)}
            />
          ) : viewMode === "table" ? (
            <AgentTable
              t={t}
              locale={locale}
              agents={shown}
              onSelectAgent={(a) => setSelectedId(a.id)}
            />
          ) : (
            <div className="space-y-4">
              {shown.map((a) => (
                <AgentCard key={a.id} t={t} locale={locale} agent={a} onNotice={setNotice} />
              ))}
            </div>
          )}
        </>
      )}
    </>
  );
}

function AgentCard({
  t,
  locale,
  agent: a,
  onNotice,
}: {
  t: TFn;
  locale: string;
  agent: AgentQueueItem;
  onNotice: (n: PartnerNoticeValue) => void;
}) {
  const name = a.name || t("unnamed");
  const hasDocs = a.docs.some((d) => d.status !== "missing");

  function handleDoc(label: string, verdict: PartnerVerdict, outcome: ReviewOutcome) {
    if (outcome.ok) onNotice({ tone: "success", text: t(`partners.done.agent_${verdict}`, { doc: label, name }) });
    else onNotice({ tone: "danger", text: outcome.message });
  }

  return (
    <ApplicantCard
      t={t}
      locale={locale}
      name={name}
      meta={a.agentId ?? undefined}
      badge={<Badge variant={VIEW_VARIANT[a.view]}>{t(`partners.agent.filter.${a.view}`)}</Badge>}
      submittedAt={a.submittedAt}
      updatedAt={a.updatedAt}
    >
      <dl className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-3 mb-4">
        <DetailField label={t("partners.fields.phone")}>
          {a.phone ? <span dir="ltr">{a.phone}</span> : "—"}
        </DetailField>
        <DetailField label={t("fields.nif")}>{a.nif ? <span dir="ltr">{a.nif}</span> : "—"}</DetailField>
        <DetailField label={t("fields.nis")}>{a.nis ? <span dir="ltr">{a.nis}</span> : "—"}</DetailField>
      </dl>

      {hasDocs && (
        <>
          <p className={sectionTitle}>{t("partners.agent.documents")}</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            {a.docs.map((d) => {
              const label = agentDocLabel(t, d.key);
              return (
                <DocumentTile
                  key={d.key}
                  t={t}
                  label={label}
                  url={d.url}
                  trusted={d.trusted}
                  isPdf={d.isPdf}
                  status={d.status}
                  note={d.reason}
                  actions={
                    <PartnerDocActions
                      t={t}
                      label={label}
                      status={d.status}
                      untrusted={!!d.url && !d.trusted}
                      noteVariant="reject_agent_doc"
                      noteMax={AGENT_REASON_MAX}
                      submit={(verdict, reason) =>
                        reviewAgentDocument({ agentId: a.id, document: d.key }, verdict, reason)
                      }
                      onOutcome={(verdict, outcome) => handleDoc(label, verdict, outcome)}
                    />
                  }
                />
              );
            })}
          </div>
        </>
      )}

      {a.shops.length > 0 && (
        <>
          <p className={sectionTitle}>{t("partners.agent.shops")}</p>
          <div className="space-y-3">
            {a.shops.map((s) => (
              <ShopRow key={s.id} t={t} shop={s} onNotice={onNotice} />
            ))}
          </div>
        </>
      )}
    </ApplicantCard>
  );
}

function ShopRow({
  t,
  shop: s,
  onNotice,
}: {
  t: TFn;
  shop: AgentShopItem;
  onNotice: (n: PartnerNoticeValue) => void;
}) {
  const [pending, startTransition] = useTransition();
  const [dialog, setDialog] = useState<ShopDecision | null>(null);
  const [error, setError] = useState<string | null>(null);
  const name = s.name || t("unnamed");

  function run(decision: ShopDecision) {
    setError(null);
    startTransition(async () => {
      const outcome = await reviewAgentShop(s.id, decision);
      if (outcome.ok) {
        setDialog(null);
        onNotice({ tone: "success", text: t(`partners.done.shop_${decision}`, { name }) });
        return;
      }
      const text = reviewErrorText(t, outcome);
      setError(text);
      onNotice({ tone: "danger", text });
    });
  }

  function close() {
    if (pending) return;
    setDialog(null);
    setError(null);
  }

  return (
    <div className="rounded-xl border border-border bg-background p-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold text-text truncate">{name}</p>
          <p className="text-xs text-subtext mt-0.5">{[s.address, s.phone].filter(Boolean).join(" · ")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant={s.status === "rejected" ? "danger" : "warning"}>{t(`partners.shop.status.${s.status}`)}</Badge>
          <Button size="xs" icon="check" disabled={pending} loading={pending && !dialog} onClick={() => run("approve")}>
            {t("actions.approve")}
          </Button>
          {s.status !== "rejected" && (
            <Button size="xs" variant="secondary" icon="x" disabled={pending} onClick={() => setDialog("reject")}>
              {t("actions.reject")}
            </Button>
          )}
        </div>
      </div>
      {error && !dialog && (
        <p role="alert" className="text-[11px] text-danger mt-1.5">
          {error}
        </p>
      )}
      {s.description && <p className="text-sm text-text mt-2">{s.description}</p>}
      {(s.nif || s.nis) && (
        <p className="text-xs text-subtext mt-2" dir="ltr">
          {[s.nif && `${t("fields.nif")} ${s.nif}`, s.nis && `${t("fields.nis")} ${s.nis}`].filter(Boolean).join(" · ")}
        </p>
      )}
      {s.files.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
          {s.files.map((f) => (
            <DocumentTile
              key={f.key}
              t={t}
              label={t(`partners.shop_file.${f.key}`)}
              url={f.url}
              trusted={f.trusted}
              isPdf={f.isPdf}
            />
          ))}
        </div>
      )}
      {dialog === "reject" && (
        <ApproveDialog
          t={t}
          title={t("partners.shop.reject_title", { name })}
          message={t("partners.shop.reject_message")}
          confirmLabel={t("partners.shop.reject_confirm")}
          pending={pending}
          error={error}
          onClose={close}
          onConfirm={() => run("reject")}
        />
      )}
    </div>
  );
}
