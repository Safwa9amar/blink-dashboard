"use client";

import { useState } from "react";
import { Card, Button, Avatar, Badge, LivePill, DashIcon, fInput } from "@/components/ui";
import { CHATS, CHAT_THREAD, CHANNEL_COLOR, ROLE_VARIANT } from "../data";
import type { TFn } from "../types";

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function InboxTab({ t }: { t: TFn }) {
  const [activeId, setActiveId] = useState(CHATS[0].id);
  const [draft, setDraft] = useState("");
  const active = CHATS.find((c) => c.id === activeId) ?? CHATS[0];
  const waiting = CHATS.filter((c) => c.status === "waiting").length;

  return (
    <>
      <div className="flex items-center gap-3 mb-[18px]">
        <LivePill>{t("inb.live", { n: CHATS.filter((c) => c.status !== "idle").length })}</LivePill>
        <span className="text-[13px] text-subtext">{t("inb.waiting", { n: waiting })}</span>
        <Button variant="secondary" size="sm" icon="filter" className="ms-auto">
          {t("inb.all_channels")}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-5 items-start">
        {/* Conversation list */}
        <Card padding={false} className="overflow-hidden">
          {CHATS.map((c) => {
            const on = c.id === activeId;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setActiveId(c.id)}
                className={`w-full text-start flex gap-3 p-3.5 border-b border-border last:border-b-0 transition-colors ${on ? "bg-soft-pink/50" : "hover:bg-card-hover"}`}
              >
                <span className="relative shrink-0">
                  <Avatar name={c.who} />
                  <span className="absolute -bottom-0.5 -end-0.5 w-3 h-3 rounded-full border-2 border-card" style={{ background: CHANNEL_COLOR[c.channel] }} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <b className="text-[13px] font-bold text-text truncate">{c.who}</b>
                    <span className="text-[10.5px] text-subtext ms-auto whitespace-nowrap">{c.channel}</span>
                  </div>
                  <p className="text-[12px] text-subtext truncate mt-0.5">{c.preview}</p>
                </div>
                {c.unread > 0 && (
                  <span className="self-center w-5 h-5 rounded-full bg-primary text-white text-[11px] font-bold inline-flex items-center justify-center shrink-0">{c.unread}</span>
                )}
              </button>
            );
          })}
        </Card>

        {/* Active thread */}
        <Card bodyClassName="flex flex-col min-h-[460px]">
          <div className="flex items-center gap-3 pb-4 border-b border-border mb-4">
            <Avatar name={active.who} />
            <div className="min-w-0">
              <b className="block text-sm font-bold text-text truncate">{active.who}</b>
              <span className="text-[12px] text-subtext">{t("inb.via", { channel: active.channel })}</span>
            </div>
            <Badge variant={ROLE_VARIANT[cap(active.role)] ?? "default"} className="ms-auto">{cap(active.role)}</Badge>
          </div>

          <div className="flex-1 space-y-4">
            {CHAT_THREAD.map((m, i) => {
              const agent = m.from === "agent";
              return (
                <div key={i} className={`flex gap-2.5 ${agent ? "flex-row-reverse" : ""}`}>
                  <Avatar name={agent ? "You" : active.who} />
                  <div className={`max-w-[78%] flex flex-col ${agent ? "items-end" : "items-start"}`}>
                    <div className={`rounded-2xl px-4 py-2.5 text-[13px] leading-relaxed ${agent ? "bg-soft-pink text-text rounded-tr-sm" : "bg-background border border-border text-text rounded-tl-sm"}`}>
                      {m.text}
                    </div>
                    <span className="text-[11px] text-subtext mt-1 px-1">{m.time}</span>
                  </div>
                </div>
              );
            })}
            <div className="flex items-center gap-1.5 text-[12px] text-subtext ps-12">
              <DashIcon name="chat" className="w-3.5 h-3.5" />
              {t("inb.typing", { name: active.who.split(" ")[0] })}
            </div>
          </div>

          <div className="flex items-center gap-2.5 mt-4 pt-4 border-t border-border">
            <input
              className={fInput}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={t("inb.message_ph")}
            />
            <Button size="sm" icon="send" onClick={() => setDraft("")}>
              {t("inb.send")}
            </Button>
          </div>
        </Card>
      </div>
    </>
  );
}
