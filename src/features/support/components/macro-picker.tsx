"use client";

import { useState } from "react";
import { Button, fInput } from "@/components/ui";
import { listMacrosAction, useMacro as recordMacroUse } from "@/app/d/support/macros-action";
import { macrosFor, searchMacros, type MacroRow } from "../macros";
import type { TFn } from "../types";

/**
 * "Macros" button for the Inbox composer: opens a searchable list of canned replies
 * that fit the conversation's locale and role, and hands the chosen body back.
 */
export function MacroPicker({
  t,
  locale,
  role,
  onPick,
}: {
  t: TFn;
  locale?: string | null;
  role?: string | null;
  onPick: (body: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [macros, setMacros] = useState<MacroRow[] | null>(null);
  const [q, setQ] = useState("");

  async function toggle() {
    const next = !open;
    setOpen(next);
    if (next) {
      setQ("");
      const res = await listMacrosAction();
      setMacros(res.macros);
    }
  }

  const rows = macros ? searchMacros(macrosFor(macros, { locale, role }), q) : null;

  return (
    <div className="relative">
      <Button variant="secondary" size="sm" icon="chat" onClick={toggle} aria-expanded={open}>
        {t("mac.picker")}
      </Button>
      {open && (
        <div className="absolute bottom-full mb-2 start-0 z-30 w-[min(340px,calc(100vw-2rem))] rounded-xl border border-border bg-card shadow-2xl p-2.5">
          <input
            className={fInput}
            dir="auto"
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("mac.picker_search")}
          />
          <div className="mt-2 max-h-64 overflow-y-auto">
            {rows === null ? (
              <p className="p-3 text-center text-[12.5px] text-subtext">{t("mac.picker_loading")}</p>
            ) : rows.length === 0 ? (
              <p className="p-3 text-center text-[12.5px] text-subtext">{t("mac.picker_empty")}</p>
            ) : (
              rows.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  className="w-full text-start rounded-lg px-2.5 py-2 hover:bg-card-hover transition-colors"
                  onClick={() => {
                    onPick(m.body);
                    setOpen(false);
                    void recordMacroUse(m.id);
                  }}
                >
                  <b className="block text-[13px] text-text truncate" dir="auto">
                    {m.title}
                  </b>
                  <span className="block text-[12px] text-subtext line-clamp-2" dir="auto">
                    {m.body}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
