"use client";

import { useState, type ReactNode } from "react";
import { Card, Button, Badge, Avatar, DashIcon, fInput } from "@/components/ui";
import {
  THREADS,
  DEFAULT_THREAD,
  TICKET_CONTEXT,
  VIEWERS,
  MACROS,
  AGENTS,
  PRIO,
  TK_STATUS,
  ROLE_VARIANT,
  supLbl,
  type Ticket,
  type Message,
} from "../data";
import type { TFn } from "../types";

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function Bubble({ m, t }: { m: Message; t: TFn }) {
  if (m.from === "note") {
    return (
      <div className="rounded-xl border border-warning/30 bg-warning-light/50 px-4 py-3">
        <div className="flex items-center gap-1.5 mb-1 text-warning">
          <DashIcon name="lock" className="w-3.5 h-3.5" />
          <b className="text-[11px] font-bold uppercase tracking-wide">{t("det.internal_note")}</b>
          <span className="text-[11px] text-subtext font-normal ms-auto">{m.time}</span>
        </div>
        <p className="text-[13px] text-text leading-relaxed">{m.text}</p>
      </div>
    );
  }
  const agent = m.from === "agent";
  return (
    <div className={`flex gap-2.5 ${agent ? "flex-row-reverse" : ""}`}>
      <Avatar name={m.who} />
      <div className={`max-w-[78%] ${agent ? "items-end" : "items-start"} flex flex-col`}>
        <div className={`rounded-2xl px-4 py-2.5 text-[13px] leading-relaxed ${agent ? "bg-soft-pink text-text rounded-tr-sm" : "bg-background border border-border text-text rounded-tl-sm"}`}>
          {m.text}
        </div>
        <span className="text-[11px] text-subtext mt-1 px-1">{m.who} · {m.time}</span>
      </div>
    </div>
  );
}

export function TicketDetail({ ticket, t, onBack }: { ticket: Ticket; t: TFn; onBack: () => void }) {
  const thread = THREADS[ticket.id] ?? DEFAULT_THREAD;
  const [mode, setMode] = useState<"reply" | "note">("reply");
  const [text, setText] = useState("");
  const [status, setStatus] = useState(ticket.status);
  const [prio, setPrio] = useState(ticket.prio);
  const [assignee, setAssignee] = useState(AGENTS[0].name);

  const insertMacro = (body: string) => setText((cur) => (cur ? `${cur}\n${body}` : body));

  return (
    <div>
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <Button variant="secondary" size="sm" icon="chevron-left" onClick={onBack}>
          {t("det.back")}
        </Button>
        <span className="font-mono text-primary font-semibold">{ticket.id}</span>
        <h2 className="text-lg font-bold text-text">{ticket.subj}</h2>
        <Badge variant={TK_STATUS[status]}>{supLbl(status)}</Badge>
        {VIEWERS.length > 0 && (
          <span className="ms-auto inline-flex items-center gap-1.5 text-[12px] text-subtext bg-muted rounded-full px-3 py-1.5">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
            {t("det.viewing", { name: VIEWERS[0] })}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-5 items-start">
        {/* Conversation + composer */}
        <Card bodyClassName="flex flex-col" title={t("det.conversation")} description={t("det.conversation_desc")}>
          <div className="space-y-4 mb-5">
            {thread.map((m, i) => (
              <Bubble key={i} m={m} t={t} />
            ))}
          </div>

          <div className="border-t border-border pt-4">
            <div className="inline-flex bg-background border border-border rounded-[10px] p-[3px] mb-3">
              {(["reply", "note"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={`px-4 py-[7px] rounded-lg text-[13px] font-semibold transition-colors inline-flex items-center gap-1.5 ${
                    mode === m ? (m === "note" ? "bg-warning text-white" : "bg-primary text-white") : "text-subtext"
                  }`}
                >
                  {m === "note" && <DashIcon name="lock" className="w-3.5 h-3.5" />}
                  {t(m === "reply" ? "det.reply" : "det.note")}
                </button>
              ))}
            </div>
            <textarea
              className={`${fInput} min-h-28 resize-y leading-relaxed ${mode === "note" ? "bg-warning-light/40" : ""}`}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={t(mode === "note" ? "det.note_ph" : "det.reply_ph")}
            />
            <div className="flex items-center gap-2.5 mt-3 flex-wrap">
              <select
                className="bg-background border border-border rounded-[10px] px-3 py-2 text-[13px] text-subtext outline-none focus:border-primary cursor-pointer"
                value=""
                onChange={(e) => e.target.value && insertMacro(e.target.value)}
              >
                <option value="">{t("det.insert_macro")}</option>
                {MACROS.map((mac) => (
                  <option key={mac.t} value={mac.b}>
                    {mac.t}
                  </option>
                ))}
              </select>
              <Button variant="secondary" size="sm" icon="activity" onClick={() => insertMacro(t("det.ai_draft"))}>
                {t("det.ai_suggest")}
              </Button>
              <Button size="sm" icon="send" className="ms-auto" onClick={() => setText("")}>
                {t(mode === "note" ? "det.add_note" : "det.send_reply")}
              </Button>
            </div>
          </div>
        </Card>

        {/* Context sidebar */}
        <div className="space-y-4">
          <Card>
            <div className="flex items-center gap-3 mb-3">
              <Avatar name={ticket.who} />
              <div className="min-w-0">
                <b className="block text-sm font-bold text-text truncate">{ticket.who}</b>
                <Badge variant={ROLE_VARIANT[cap(ticket.role)] ?? "default"}>{cap(ticket.role)}</Badge>
              </div>
            </div>
            <div className="text-[12px] text-subtext space-y-1.5">
              <p>{TICKET_CONTEXT.joined}</p>
              <p>{TICKET_CONTEXT.device}</p>
              <p>{t("det.prefers", { lang: TICKET_CONTEXT.lang })}</p>
            </div>
          </Card>

          <Card title={t("det.sla")}>
            <SlaRow label={t("det.first_response")} value={t("det.met")} pct={100} ok />
            <SlaRow label={t("det.resolution_due")} value="1h 24m" pct={62} />
          </Card>

          <Card title={t("det.properties")}>
            <Field label={t("col.status")}>
              <select className={fInput} value={status} onChange={(e) => setStatus(e.target.value)}>
                {["open", "in_progress", "resolved"].map((s) => (
                  <option key={s} value={s}>
                    {supLbl(s)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t("col.priority")}>
              <select className={fInput} value={prio} onChange={(e) => setPrio(e.target.value)} style={{ color: PRIO[prio] }}>
                {["urgent", "high", "normal", "low"].map((p) => (
                  <option key={p} value={p} style={{ color: PRIO[p] }}>
                    {cap(p)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t("det.assignee")}>
              <select className={fInput} value={assignee} onChange={(e) => setAssignee(e.target.value)}>
                {AGENTS.map((a) => (
                  <option key={a.name}>{a.name}</option>
                ))}
              </select>
            </Field>
            <div className="text-[12px] text-subtext">
              {t("col.category")}: <b className="text-text">{ticket.cat}</b>
            </div>
          </Card>

          <Card title={t("det.context")}>
            <div className="grid grid-cols-2 gap-3 text-center">
              <Ctx value={TICKET_CONTEXT.orders} label={t("det.orders")} />
              <Ctx value={TICKET_CONTEXT.wallet} label={t("det.wallet")} />
              <Ctx value={TICKET_CONTEXT.priorTickets} label={t("det.prior")} />
              <Ctx value="4.7" label={t("det.rating")} />
            </div>
            <p className="text-[12px] text-subtext mt-3 pt-3 border-t border-border">
              {t("det.last_order")}: <b className="text-text">{TICKET_CONTEXT.lastOrder}</b>
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="mb-3.5 last:mb-0">
      <label className="block text-[11.5px] font-bold text-text mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function Ctx({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="rounded-xl bg-background border border-border py-2.5">
      <b className="block text-base font-bold text-text">{value}</b>
      <span className="text-[10.5px] text-subtext uppercase tracking-wide">{label}</span>
    </div>
  );
}

function SlaRow({ label, value, pct, ok }: { label: string; value: string; pct: number; ok?: boolean }) {
  return (
    <div className="mb-3 last:mb-0">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[12px] text-subtext">{label}</span>
        <span className={`text-[12px] font-bold ${ok ? "text-success" : "text-warning"}`}>{value}</span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full ${ok ? "bg-success" : "bg-warning"}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
