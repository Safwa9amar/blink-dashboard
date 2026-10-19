"use client";

import { useEffect } from "react";
import { useLocale, useTranslations } from "next-intl";
import { DashIcon } from "@/components/ui";
import type { StaffRole } from "@/lib/auth/access";
import { useAssistantStore } from "../store";
import { useAssistantChat } from "../use-assistant-chat";
import { AssistantPanel } from "./assistant-panel";

/** Floating assistant launcher + panel, mounted once in the dashboard shell. */
export function AssistantChatHead({ staffRole, staffName }: { staffRole: StaffRole; staffName: string }) {
  const t = useTranslations("assistant");
  const locale = useLocale();
  const open = useAssistantStore((s) => s.open);
  const setOpen = useAssistantStore((s) => s.setOpen);
  const toggle = useAssistantStore((s) => s.toggle);
  const unread = useAssistantStore((s) => s.unread);
  const chat = useAssistantChat(locale);

  const enabled = chat.configState.state !== "ready" || chat.configState.config.enabled;

  useEffect(() => {
    if (!enabled) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && !e.altKey && !e.shiftKey && e.key.toLowerCase() === "j") {
        e.preventDefault();
        toggle();
      } else if (e.key === "Escape" && useAssistantStore.getState().open && !e.defaultPrevented) {
        // A confirm modal handles its own Escape; only close the panel when none is open.
        if (!useAssistantStore.getState().confirmOpen) setOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [enabled, toggle, setOpen]);

  if (!enabled) return null;

  const working = chat.streaming && !open;
  const config = chat.configState.state === "ready" ? chat.configState.config : null;

  return (
    <>
      {open && (
        <AssistantPanel chat={chat} config={config} staffRole={staffRole} staffName={staffName} onClose={() => setOpen(false)} />
      )}
      <button
        type="button"
        onClick={toggle}
        aria-label={open ? t("close") : t("open")}
        aria-expanded={open}
        title={`${open ? t("close") : t("open")} (Ctrl/⌘ J)`}
        className={`fixed bottom-5 end-5 z-[45] h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-lg transition-transform hover:scale-105 hover:bg-primary-hover cursor-pointer ${open ? "hidden sm:inline-flex" : "inline-flex"}`}
      >
        <DashIcon name={open ? "x" : "sparkles"} className="h-6 w-6" />
        {(working || unread) && (
          <span
            aria-label={working ? t("working") : t("unread")}
            className={`absolute end-1 top-1 h-3.5 w-3.5 rounded-full border-2 border-card ${working ? "animate-pulse bg-warning" : "bg-success"}`}
          />
        )}
      </button>
    </>
  );
}
