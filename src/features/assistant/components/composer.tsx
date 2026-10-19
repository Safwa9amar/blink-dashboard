"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { DashIcon } from "@/components/ui";
import { MAX_MESSAGE_LENGTH } from "../use-assistant-chat";

export function Composer({
  streaming,
  onSend,
  onStop,
}: {
  streaming: boolean;
  onSend: (text: string) => void;
  onStop: () => void;
}) {
  const t = useTranslations("assistant");
  const [value, setValue] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
  }, [value]);

  useEffect(() => {
    if (!streaming) ref.current?.focus();
  }, [streaming]);

  const submit = () => {
    const text = value.trim();
    if (!text || streaming) return;
    onSend(text);
    setValue("");
  };

  return (
    <div className="border-t border-border p-3">
      <div className="flex items-end gap-2 rounded-2xl border border-border bg-background px-3 py-2 focus-within:border-primary">
        <textarea
          ref={ref}
          dir="auto"
          rows={1}
          value={value}
          disabled={streaming}
          maxLength={MAX_MESSAGE_LENGTH}
          placeholder={t("placeholder")}
          aria-label={t("placeholder")}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              submit();
            }
          }}
          className="max-h-[140px] min-h-6 flex-1 resize-none bg-transparent text-[13px] text-text outline-none placeholder:text-subtext disabled:opacity-60"
        />
        {streaming ? (
          <button
            type="button"
            onClick={onStop}
            className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg bg-muted px-2.5 text-xs font-semibold text-text hover:bg-card-hover cursor-pointer"
          >
            <span className="h-2.5 w-2.5 rounded-sm bg-current" aria-hidden />
            {t("stop")}
          </button>
        ) : (
          <button
            type="button"
            onClick={submit}
            disabled={!value.trim()}
            aria-label={t("send")}
            title={t("send")}
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-white hover:bg-primary-hover disabled:opacity-40 cursor-pointer disabled:cursor-default"
          >
            <DashIcon name="send" className="h-4 w-4 rtl:-scale-x-100" />
          </button>
        )}
      </div>
      {value.length >= MAX_MESSAGE_LENGTH - 500 && (
        <p dir="ltr" className={`mt-1 text-end text-[11px] ${value.length >= MAX_MESSAGE_LENGTH ? "text-danger" : "text-subtext"}`}>
          {value.length}/{MAX_MESSAGE_LENGTH}
        </p>
      )}
    </div>
  );
}
