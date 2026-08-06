"use client";

import { Avatar, Skeleton } from "@/components/ui";
import { attachmentsOf, fmtWhen, partyName } from "../format";
import type { EmailMessageRow, TFn } from "../types";

// One email in the thread. Inbound (customer) sits on the start side; outbound
// (staff reply) on the end side with a soft-pink bubble — mirrors the support
// live-chat bubble, adapted for full email bodies (pre-wrapped, selectable).
export function MessageView({ message, t }: { message: EmailMessageRow; t: TFn }) {
  const outbound = message.direction === "outbound";
  const who = outbound ? t("you") : partyName(message.from_name, message.from_email);
  const attachments = attachmentsOf(message);

  return (
    <div className={`flex gap-2.5 ${outbound ? "flex-row-reverse" : ""}`}>
      <Avatar name={who} />
      <div className={`max-w-[78%] flex flex-col ${outbound ? "items-end" : "items-start"}`}>
        <span className="text-[11px] font-semibold text-subtext mb-1 px-1">{who}</span>
        <div
          className={`rounded-2xl px-4 py-2.5 text-[13px] leading-relaxed whitespace-pre-wrap break-words ${
            outbound
              ? "bg-soft-pink text-text rounded-tr-sm"
              : "bg-background border border-border text-text rounded-tl-sm"
          }`}
        >
          {message.body_text || "—"}
          {attachments.length > 0 && (
            <div className={`mt-2 pt-2 border-t ${outbound ? "border-primary/20" : "border-border"} flex flex-col gap-1`}>
              {attachments.map((a, i) => (
                <span key={i} className="text-[11.5px] text-subtext inline-flex items-center gap-1">
                  📎 {a.filename || t("attachment_unnamed")}
                </span>
              ))}
            </div>
          )}
        </div>
        <span className="text-[11px] text-subtext mt-1 px-1">{fmtWhen(message.created_at)}</span>
      </div>
    </div>
  );
}

// Placeholder while a thread's messages load (alternating in/out rows).
const SKELETON_ROWS: { out: boolean; w: string; h: string }[] = [
  { out: false, w: "w-56", h: "h-16" },
  { out: true, w: "w-52", h: "h-20" },
  { out: false, w: "w-44", h: "h-12" },
];

export function ThreadSkeleton() {
  return (
    <>
      {SKELETON_ROWS.map((r, i) => (
        <div key={i} className={`flex gap-2.5 ${r.out ? "flex-row-reverse" : ""}`}>
          <Skeleton className="w-[34px] h-[34px] rounded-full shrink-0" />
          <div className={`max-w-[78%] flex flex-col ${r.out ? "items-end" : "items-start"}`}>
            <Skeleton className="h-2.5 w-14 mb-1.5 rounded" />
            <Skeleton className={`${r.h} ${r.w} rounded-2xl ${r.out ? "rounded-tr-sm" : "rounded-tl-sm"}`} />
            <Skeleton className="h-2.5 w-10 mt-1.5 rounded" />
          </div>
        </div>
      ))}
    </>
  );
}
