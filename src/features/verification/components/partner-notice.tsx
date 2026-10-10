"use client";

import { useEffect, useRef } from "react";
import { DashIcon } from "@/components/ui";
import type { TFn } from "../types";

export type PartnerNoticeValue = { tone: "success" | "danger"; text: string };

// The result of the last decision, above the list: green for a success, red
// (focused, announced) for a failure. A failure caused by a stale list comes
// with a refreshed page, so the card it applied to may be gone.
export function PartnerNotice({
  t,
  notice,
  onDismiss,
}: {
  t: TFn;
  notice: PartnerNoticeValue | null;
  onDismiss: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const alertText = notice?.tone === "danger" ? notice.text : null;

  useEffect(() => {
    if (!alertText) return;
    ref.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    ref.current?.focus({ preventScroll: true });
  }, [alertText]);

  if (!notice) return null;
  return (
    <div
      ref={ref}
      tabIndex={-1}
      role={notice.tone === "danger" ? "alert" : "status"}
      className={`flex items-start justify-between gap-3 rounded-xl p-3 mb-4 text-sm font-semibold outline-none focus-visible:ring-2 focus-visible:ring-danger/40 ${
        notice.tone === "success" ? "bg-success-light text-success" : "bg-danger-light text-danger"
      }`}
    >
      <span>{notice.text}</span>
      <button
        type="button"
        onClick={onDismiss}
        aria-label={t("notice_dismiss")}
        className="shrink-0 opacity-70 hover:opacity-100 cursor-pointer"
      >
        <DashIcon name="x" className="w-4 h-4" />
      </button>
    </div>
  );
}
